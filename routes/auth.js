const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Inscription
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('mot_de_passe').isLength({ min: 6 }),
    body('nom').notEmpty().trim(),
    body('role_id').isInt({ min: 1, max: 3 })
], async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, mot_de_passe, nom, prenom, telephone, role_id, entreprise } = req.body;

        // Vérifier si l'email existe déjà
        const [existingUsers] = await connection.execute(
            'SELECT id FROM utilisateurs WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(mot_de_passe, 12);

        // Insérer l'utilisateur
        const [result] = await connection.execute(
            'INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, telephone, role_id) VALUES (?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, nom, prenom, telephone, role_id]
        );

        const userId = result.insertId;
        let entrepriseId = null;

        // Si c'est un fournisseur et qu'il y a des données d'entreprise, les créer
        if (role_id === 2 && entreprise) {
            const [entrepriseResult] = await connection.execute(`
                INSERT INTO entreprises (
                    utilisateur_id, nom_entreprise, telephone_professionnel, site_web, description,
                    secteur_activite_id, type_entreprise_id, annee_creation, nombre_employes,
                    adresse_ligne1, adresse_ligne2, ville, code_postal, pays,
                    numero_siret, numero_registre_commerce, numero_tva, capacite_production, certifications,
                    nom_banque, iban, nom_titulaire_compte, bic_swift,
                    statut_verification
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_attente')
            `, [
                userId,
                entreprise.nom_entreprise,
                entreprise.telephone_professionnel,
                entreprise.site_web || null,
                entreprise.description || null,
                entreprise.secteur_activite_id,
                entreprise.type_entreprise_id,
                entreprise.annee_creation || null,
                entreprise.nombre_employes || null,
                entreprise.adresse_ligne1,
                entreprise.adresse_ligne2 || null,
                entreprise.ville,
                entreprise.code_postal,
                entreprise.pays || 'Gabon',
                entreprise.numero_siret,
                entreprise.numero_registre_commerce || null,
                entreprise.numero_tva || null,
                entreprise.capacite_production || null,
                entreprise.certifications || null,
                entreprise.nom_banque || null,
                entreprise.iban || null,
                entreprise.nom_titulaire_compte || null,
                entreprise.bic_swift || null
            ]);

            entrepriseId = entrepriseResult.insertId;

            // Créer l'enregistrement des étapes d'inscription
            await connection.execute(`
                INSERT INTO etapes_inscription (
                    entreprise_id, etape_1_compte, etape_2_entreprise, etape_3_adresse,
                    etape_4_legal, etape_5_produits, etape_completee
                ) VALUES (?, 1, 1, 1, 1, 1, 1)
            `, [entrepriseId]);
        }

        // Générer le token JWT
        const token = jwt.sign(
            { id: userId, email, role_id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        await connection.commit();

        res.status(201).json({
            message: 'Utilisateur créé avec succès',
            token,
            user: { 
                id: userId, 
                email, 
                nom, 
                prenom, 
                role_id,
                entreprise_id: entrepriseId
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    } finally {
        connection.release();
    }
});


// Connexion
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('mot_de_passe').notEmpty()
], async (req, res) => {
    try {
        console.log('🔍 Login Debug: Début de la connexion');
        console.log('🔍 Login Debug: Variables env - JWT_SECRET:', process.env.JWT_SECRET ? 'Défini' : 'MANQUANT');
        console.log('🔍 Login Debug: Variables env - JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN || 'MANQUANT');
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('🔍 Login Debug: Erreurs de validation:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, mot_de_passe } = req.body;
        console.log('🔍 Login Debug: Email reçu:', email);
        console.log('🔍 Login Debug: Mot de passe reçu:', mot_de_passe ? 'Oui' : 'Non');

        // Vérifier la connexion à la base de données
        console.log('🔍 Login Debug: Test connexion DB...');
        try {
            await db.execute('SELECT 1');
            console.log('🔍 Login Debug: Connexion DB OK');
        } catch (dbError) {
            console.error('🔍 Login Debug: ERREUR DB:', dbError);
            return res.status(500).json({ error: 'Erreur de base de données' });
        }

        // Trouver l'utilisateur
        console.log('🔍 Login Debug: Recherche utilisateur en base...');
        let users;
        try {
            [users] = await db.execute(
                'SELECT id, email, mot_de_passe, nom, prenom, role_id, statut FROM utilisateurs WHERE email = ?',
                [email]
            );
            console.log('🔍 Login Debug: Utilisateurs trouvés:', users.length);
        } catch (queryError) {
            console.error('🔍 Login Debug: ERREUR REQUÊTE UTILISATEUR:', queryError);
            return res.status(500).json({ error: 'Erreur lors de la recherche utilisateur' });
        }

        if (users.length === 0) {
            console.log('🔍 Login Debug: Aucun utilisateur trouvé pour:', email);
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        const user = users[0];
        console.log('🔍 Login Debug: Utilisateur trouvé - ID:', user.id, 'Statut:', user.statut);

        if (user.statut === 'suspendu') {
            console.log('🔍 Login Debug: Compte suspendu pour:', email);
            
            // Récupérer les détails de la suspension
            const [suspensionDetails] = await db.execute(
                'SELECT suspension_reason, suspended_at FROM utilisateurs WHERE id = ?',
                [user.id]
            );
            
            const reason = suspensionDetails[0]?.suspension_reason || 'Aucune raison spécifiée';
            
            return res.status(403).json({ 
                error: 'Compte suspendu par l\'administrateur',
                details: `Raison: ${reason}`,
                suspended: true
            });
        }
        
        if (user.statut !== 'actif') {
            console.log('🔍 Login Debug: Compte inactif pour:', email);
            return res.status(401).json({ error: 'Compte inactif' });
        }

        // Vérifier le mot de passe
        console.log('🔍 Login Debug: Vérification du mot de passe...');
        let isValidPassword;
        try {
            isValidPassword = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
            console.log('🔍 Login Debug: Mot de passe valide:', isValidPassword);
        } catch (bcryptError) {
            console.error('🔍 Login Debug: ERREUR BCRYPT:', bcryptError);
            return res.status(500).json({ error: 'Erreur lors de la vérification du mot de passe' });
        }
        
        if (!isValidPassword) {
            console.log('🔍 Login Debug: Mot de passe incorrect pour:', email);
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        // Mettre à jour la dernière connexion
        console.log('🔍 Login Debug: Mise à jour dernière connexion...');
        try {
            await db.execute(
                'UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = ?',
                [user.id]
            );
            console.log('🔍 Login Debug: Dernière connexion mise à jour');
        } catch (updateError) {
            console.error('🔍 Login Debug: ERREUR MISE À JOUR:', updateError);
            // Ne pas bloquer la connexion pour cette erreur
        }

        // Vérifier les variables JWT
        if (!process.env.JWT_SECRET) {
            console.error('🔍 Login Debug: JWT_SECRET manquant !');
            return res.status(500).json({ error: 'Configuration serveur incorrecte' });
        }

        // Générer le token JWT
        console.log('🔍 Login Debug: Génération du token JWT...');
        console.log('🔍 Login Debug: JWT_SECRET présent:', !!process.env.JWT_SECRET);
        console.log('🔍 Login Debug: JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);
        console.log('🔍 Login Debug: Payload:', { id: user.id, email: user.email, role_id: user.role_id });
        
        let token;
        try {
            token = jwt.sign(
                { id: user.id, email: user.email, role_id: user.role_id },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );
            console.log('🔍 Login Debug: Token généré avec succès, longueur:', token ? token.length : 'undefined');
            console.log('🔍 Login Debug: Token preview:', token ? token.substring(0, 50) + '...' : 'undefined');
        } catch (jwtError) {
            console.error('🔍 Login Debug: ERREUR JWT:', jwtError);
            return res.status(500).json({ error: 'Erreur lors de la génération du token' });
        }

        console.log('🔍 Login Debug: Connexion réussie pour:', email);
        console.log('🔍 Login Debug: Réponse à envoyer:', {
            message: 'Connexion réussie',
            token: token ? 'PRÉSENT' : 'ABSENT',
            user: 'PRÉSENT'
        });
        
        res.json({
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                email: user.email,
                nom: user.nom,
                prenom: user.prenom,
                role_id: user.role_id
            }
        });

    } catch (error) {
        console.error('🔍 Login Debug: ERREUR CRITIQUE NON GÉRÉE:', error);
        console.error('🔍 Login Debug: Type d\'erreur:', error.constructor.name);
        console.error('🔍 Login Debug: Message:', error.message);
        console.error('🔍 Login Debug: Stack trace:', error.stack);
        res.status(500).json({ 
            error: 'Erreur lors de la connexion',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Route pour récupérer l'utilisateur actuel
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.execute(`
            SELECT u.id, u.email, u.nom, u.prenom, u.telephone, u.role_id, u.date_inscription as created_at,
                   r.nom as role_nom
            FROM utilisateurs u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = ?
        `, [req.user.id]);

        if (users.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        const user = users[0];
        user.role = { id: user.role_id, nom: user.role_nom };
        delete user.role_nom;

        // Si c'est un fournisseur, récupérer les infos entreprise avec relations
        if (user.role_id === 2) {
            const [entreprises] = await db.execute(`
                SELECT e.*, 
                       sa.nom as secteur_activite_nom,
                       te.nom as type_entreprise_nom
                FROM entreprises e
                LEFT JOIN secteurs_activite sa ON e.secteur_activite_id = sa.id
                LEFT JOIN types_entreprise te ON e.type_entreprise_id = te.id
                WHERE e.utilisateur_id = ?
            `, [user.id]);
            
            if (entreprises.length > 0) {
                const entreprise = entreprises[0];
                // Ajouter les objets de relation pour compatibilité frontend
                if (entreprise.secteur_activite_nom) {
                    entreprise.secteur_activite = {
                        id: entreprise.secteur_activite_id,
                        nom: entreprise.secteur_activite_nom
                    };
                }
                if (entreprise.type_entreprise_nom) {
                    entreprise.type_entreprise = {
                        id: entreprise.type_entreprise_id,
                        nom: entreprise.type_entreprise_nom
                    };
                }
                user.entreprise = entreprise;
            }
        }

        // Récupérer les adresses
        const [adresses] = await db.execute(
            'SELECT * FROM adresses WHERE utilisateur_id = ? ORDER BY par_defaut DESC',
            [user.id]
        );
        
        user.adresses = adresses;

        res.json(user);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
    }
});

// Déconnexion
router.post('/logout', authenticateToken, (req, res) => {
    // En JWT, la déconnexion se fait côté client en supprimant le token
    res.json({ message: 'Déconnexion réussie' });
});

// Route de test pour diagnostiquer les problèmes de connexion
router.get('/test', async (req, res) => {
    try {
        console.log('🔍 Auth Test: Début du test');
        
        // Test 1: Variables d'environnement
        const envCheck = {
            JWT_SECRET: process.env.JWT_SECRET ? 'Défini' : 'MANQUANT',
            JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || 'MANQUANT',
            DB_HOST: process.env.DB_HOST ? 'Défini' : 'MANQUANT',
            DB_NAME: process.env.DB_NAME ? 'Défini' : 'MANQUANT'
        };
        
        // Test 2: Connexion base de données
        let dbStatus = 'OK';
        let userCount = 0;
        try {
            await db.execute('SELECT 1');
            const [users] = await db.execute('SELECT COUNT(*) as count FROM utilisateurs');
            userCount = users[0].count;
        } catch (dbError) {
            dbStatus = `ERREUR: ${dbError.message}`;
        }
        
        // Test 3: Modules requis
        const modulesCheck = {
            bcrypt: typeof bcrypt !== 'undefined' ? 'OK' : 'MANQUANT',
            jwt: typeof jwt !== 'undefined' ? 'OK' : 'MANQUANT',
            validator: typeof validationResult !== 'undefined' ? 'OK' : 'MANQUANT'
        };
        
        res.json({
            message: 'Test de diagnostic auth',
            timestamp: new Date().toISOString(),
            environment: envCheck,
            database: {
                status: dbStatus,
                userCount: userCount
            },
            modules: modulesCheck,
            nodeVersion: process.version,
            platform: process.platform
        });
        
    } catch (error) {
        console.error('🔍 Auth Test: ERREUR:', error);
        res.status(500).json({
            error: 'Erreur lors du test',
            details: error.message
        });
    }
});

module.exports = router;