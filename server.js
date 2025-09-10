const express = require('express');
const http = require('http');

const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import des middlewares de sécurité
const {
  corsOptions,
  globalRateLimit,
  authRateLimit,
  helmetConfig,
  securityLogger,
  attackDetection,
  validateHeaders,
  timingAttackProtection,
  sanitizeResponse,
  dosProtection,

} = require('./middleware/security');

const app = express();
const server = http.createServer(app);

// Initialiser le gestionnaire Socket.IO SIMPLE
const SimpleSocketServer = require('./socket/simpleSocketServer');
const socketServer = new SimpleSocketServer(server);

// Rendre io accessible dans les routes
const io = socketServer.getIO();
app.use((req, res, next) => {
    req.io = io;
    req.socketServer = socketServer;
    next();
});

// Middlewares de sécurité (dans l'ordre d'importance)
app.use(helmetConfig);
app.use(cors(corsOptions));
app.use(validateHeaders);
app.use(dosProtection);
app.use(attackDetection);
app.use(globalRateLimit);
app.use(sanitizeResponse);

// Handle preflight requests
app.options('*', cors(corsOptions));

// Middleware pour parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (images)
app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static('uploads'));

// Routes avec sécurité renforcée
app.use('/api/auth', authRateLimit, securityLogger('auth'), timingAttackProtection, require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/users', require('./routes/settings'));
app.use('/api/users/dashboard', require('./routes/dashboard'));
app.use('/api/users/favorites', require('./routes/favorites'));
app.use('/api/notifications', require('./routes/user-notifications'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));

// ROUTES DE MESSAGERIE COMPLÈTES
app.use('/api/messages', require('./routes/messaging'));
app.use('/api/admin/messages', require('./routes/admin-messaging'));

// NOUVELLES ROUTES SIMPLES ET PROPRES (compatibilité)
app.use('/api/conversations', require('./routes/simple-conversations'));
app.use('/api/conversations', require('./routes/simple-messages'));

// Routes de compatibilité (ancien système)
app.use('/api/messages', require('./routes/messages_extended')); // Ancien système
app.use('/api/conversations-old', require('./routes/conversations')); // Ancien système

app.use('/api/supplier', require('./routes/supplier-registration'));
app.use('/api/supplier', require('./routes/supplier'));
app.use('/api/suppliers', require('./routes/entreprises')); // Route pour les acheteurs
app.use('/api/entreprises', require('./routes/entreprises'));
app.use('/api/products', require('./routes/products')); // Nouvelles routes produits
app.use('/api/products/reviews', require('./routes/reviews'));
app.use('/api/reviews', require('./routes/improved-reviews')); // Système d'avis amélioré
app.use('/api/analytics', require('./routes/analytics')); // Routes analytics et statistiques
app.use('/api/events', require('./routes/events')); // Routes événements
app.use('/api/blog', require('./routes/blog')); // Routes blog
app.use('/api/admin', require('./routes/admin'));
app.use('/api/documents', require('./routes/documents'));

app.use('/api/health', require('./routes/health')); // Route de santé

// Routes publiques pour les filtres
app.get('/api/sectors', async (req, res) => {
    try {
        const db = require('./config/database');
        
        // Vérifier d'abord la structure de la table
        const [columns] = await db.execute(`DESCRIBE entreprises`);
        console.log('Colonnes de la table entreprises:', columns.map(col => col.Field));
        
        // Essayer de récupérer les secteurs depuis la table secteurs_activite
        try {
            const [sectors] = await db.execute(`
                SELECT DISTINCT s.nom as secteur
                FROM secteurs_activite s
                JOIN entreprises e ON e.secteur_activite_id = s.id
                WHERE s.nom IS NOT NULL AND s.nom != ''
                ORDER BY s.nom
            `);
            
            const sectorList = sectors.map(row => row.secteur);
            res.json({ sectors: sectorList });
        } catch (err) {
            console.log('Erreur avec secteurs_activite, utilisation de données de test...');
            // Données de test en cas d'erreur
            const testSectors = [
                'Agriculture',
                'Commerce',
                'Services',
                'Industrie',
                'Technologie',
                'Santé',
                'Éducation',
                'Transport',
                'Immobilier',
                'Finance'
            ];
            res.json({ sectors: testSectors });
        }
    } catch (error) {
        console.error('Erreur récupération secteurs:', error);
        // Données de test en cas d'erreur
        const testSectors = [
            'Agriculture',
            'Commerce', 
            'Services',
            'Industrie',
            'Technologie'
        ];
        res.json({ sectors: testSectors });
    }
});

app.get('/api/cities', async (req, res) => {
    try {
        const db = require('./config/database');
        const [cities] = await db.execute(`
            SELECT DISTINCT ville 
            FROM entreprises 
            WHERE ville IS NOT NULL AND ville != ''
            ORDER BY ville
        `);
        
        const cityList = cities.map(row => row.ville);
        res.json({ cities: cityList });
    } catch (error) {
        console.error('Erreur récupération villes:', error);
        // Données de test en cas d'erreur
        const testCities = [
            'Libreville',
            'Port-Gentil',
            'Franceville',
            'Oyem',
            'Moanda',
            'Lambaréné',
            'Tchibanga',
            'Koulamoutou',
            'Makokou',
            'Bitam'
        ];
        res.json({ cities: testCities });
    }
});

// Routes de test
app.get('/', (req, res) => {
    res.json({
        message: 'API E-commerce Alibaba - Serveur actif',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        socketIO: 'Disponible sur ws://localhost:' + (process.env.PORT || 3000)
    });
});

// Route de test spécifique pour Socket.IO
app.get('/socket-test', (req, res) => {
    res.json({
        message: 'Test Socket.IO',
        connectedClients: io.engine.clientsCount,
        transport: 'websocket',
        cors: {
            origins: process.env.CORS_ORIGIN 
                ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
                : ["http://localhost:5173", "http://localhost:8080", "http://localhost:3000"]
        },
        timestamp: new Date().toISOString()
    });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion globale des erreurs avec debug DB
app.use((err, req, res, next) => {
    console.error('🚨 Erreur serveur:', {
        message: err.message,
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        sqlMessage: err.sqlMessage,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    
    // Erreurs spécifiques de base de données
    if (err.code === 'ER_BAD_DB_ERROR') {
        console.error('💡 Base de données introuvable - Vérifiez la configuration AlwaysData');
        return res.status(500).json({ 
            error: 'Base de données non accessible',
            details: 'Vérifiez la configuration de connexion AlwaysData'
        });
    }
    
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('💡 Accès refusé - Vérifiez les identifiants AlwaysData');
        return res.status(500).json({ 
            error: 'Accès à la base de données refusé',
            details: 'Vérifiez les identifiants de connexion'
        });
    }
    
    if (err.code === 'ENOTFOUND') {
        console.error('💡 Serveur MySQL introuvable - Vérifiez l\'URL AlwaysData');
        return res.status(500).json({ 
            error: 'Serveur de base de données introuvable',
            details: 'Vérifiez l\'URL du serveur MySQL AlwaysData'
        });
    }
    
    console.error(err.stack);
    res.status(500).json({ error: 'Erreur serveur interne' });
});

const PORT = process.env.PORT || 3000;

// Vérification de la configuration avant démarrage
console.log('🔧 Configuration détectée:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'non défini (development par défaut)');
console.log('- DB_HOST:', process.env.DB_HOST || 'non défini');
console.log('- DB_NAME:', process.env.DB_NAME || 'non défini');
console.log('- DB_USER:', process.env.DB_USER || 'non défini');
console.log('- DB_PASSWORD:', process.env.DB_PASSWORD ? '***masqué***' : 'MANQUANT');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'Défini' : 'MANQUANT');
console.log('- JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN || 'MANQUANT');

server.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur le port ${PORT}`);
    console.log(`🌐 API disponible sur http://localhost:${PORT}`);
    console.log(`🔌 WebSocket disponible sur ws://localhost:${PORT}`);
});