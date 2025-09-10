const mysql = require('mysql2/promise');

// Configuration de la base de données
const dbConfig = {
    host: 'mysql-zigh-portfolio.alwaysdata.net',
    user: '404304',
    password: 'Campement@2024',
    database: 'zigh-portfolio_gabmarkethub',
    port: 3306,
    connectTimeout: 60000,
    ssl: false,
    multipleStatements: false
};

async function testDatabase() {
    let connection;
    try {
        console.log('🔍 Test de connexion à la base de données...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connexion réussie');

        // Test 1: Vérifier la table utilisateurs
        console.log('\n📊 Test 1: Structure de la table utilisateurs');
        const [usersStructure] = await connection.execute('DESCRIBE utilisateurs');
        console.log('Colonnes de la table utilisateurs:');
        usersStructure.forEach(col => {
            console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`);
        });

        // Test 2: Compter les utilisateurs
        console.log('\n📊 Test 2: Nombre d\'utilisateurs');
        const [userCount] = await connection.execute('SELECT COUNT(*) as total FROM utilisateurs');
        console.log(`Total utilisateurs: ${userCount[0].total}`);

        // Test 3: Vérifier les rôles
        console.log('\n📊 Test 3: Rôles disponibles');
        const [roles] = await connection.execute('SELECT * FROM roles');
        console.log('Rôles:');
        roles.forEach(role => {
            console.log(`- ${role.id}: ${role.nom}`);
        });

        // Test 4: Test de la requête utilisateurs avec dates
        console.log('\n📊 Test 4: Requête utilisateurs avec dates');
        const [users] = await connection.execute(`
            SELECT 
                u.id,
                u.nom,
                u.prenom,
                u.email,
                u.role_id,
                r.nom as role_nom,
                u.statut,
                u.date_inscription as date_creation,
                COALESCE(u.derniere_connexion, u.last_login) as derniere_connexion
            FROM utilisateurs u
            LEFT JOIN roles r ON u.role_id = r.id
            LIMIT 5
        `);
        
        console.log('Utilisateurs trouvés:');
        users.forEach(user => {
            console.log(`- ${user.nom} ${user.prenom} (${user.role_nom})`);
            console.log(`  Inscription: ${user.date_creation}`);
            console.log(`  Dernière connexion: ${user.derniere_connexion}`);
        });

        // Test 5: Statistiques admin
        console.log('\n📊 Test 5: Statistiques admin');
        const [totalFournisseurs] = await connection.execute(`
            SELECT COUNT(DISTINCT e.id) as total 
            FROM entreprises e 
            JOIN utilisateurs u ON e.utilisateur_id = u.id 
            WHERE u.role_id = 2 AND u.statut = 'actif'
        `);

        const [totalAcheteurs] = await connection.execute(`
            SELECT COUNT(*) as total 
            FROM utilisateurs 
            WHERE role_id = 1 AND statut = 'actif'
        `);

        console.log(`Fournisseurs actifs: ${totalFournisseurs[0].total}`);
        console.log(`Acheteurs actifs: ${totalAcheteurs[0].total}`);

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Connexion fermée');
        }
    }
}

testDatabase();
