const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('🔍 Test de connexion à la base de données...\n');
  
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    connectTimeout: 10000,
    acquireTimeout: 10000,
    timeout: 10000
  };

  console.log('Configuration de connexion:');
  console.log(`- Host: ${config.host}`);
  console.log(`- Port: ${config.port}`);
  console.log(`- Database: ${config.database}`);
  console.log(`- User: ${config.user}`);
  console.log(`- Password: ${config.password ? '***' : 'NON DÉFINI'}\n`);

  let connection;
  
  try {
    console.log('🔄 Tentative de connexion...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connexion réussie !');
    
    // Test d'une requête simple
    console.log('🔄 Test d\'une requête simple...');
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Requête test réussie:', rows[0]);
    
    // Vérifier les tables existantes
    console.log('🔄 Vérification des tables...');
    const [tables] = await connection.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ? 
      ORDER BY table_name
    `, [config.database]);
    
    console.log(`✅ ${tables.length} tables trouvées:`);
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    // Vérifier les tables spécifiques à notre système
    const requiredTables = [
      'produits', 'utilisateurs', 'categories', 'entreprises',
      'statistiques_produits', 'vues_produits_detaillees', 'avis_produits'
    ];
    
    console.log('\n🔄 Vérification des tables requises...');
    const existingTables = tables.map(t => t.table_name);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length === 0) {
      console.log('✅ Toutes les tables requises sont présentes');
    } else {
      console.log('⚠️  Tables manquantes:');
      missingTables.forEach(table => {
        console.log(`   - ${table}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.error('Code d\'erreur:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solutions possibles:');
      console.log('1. Vérifiez que le serveur MySQL est démarré');
      console.log('2. Vérifiez l\'adresse IP et le port');
      console.log('3. Vérifiez les paramètres de pare-feu');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Solutions possibles:');
      console.log('1. Vérifiez le nom d\'utilisateur et le mot de passe');
      console.log('2. Vérifiez les permissions de l\'utilisateur');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Solutions possibles:');
      console.log('1. Vérifiez que la base de données existe');
      console.log('2. Vérifiez le nom de la base de données');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

// Exécution du test
if (require.main === module) {
  testDatabaseConnection().catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = testDatabaseConnection;


