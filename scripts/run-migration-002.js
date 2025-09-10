const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;
  
  try {
    // Configuration de la base de données
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'mysql-zigh-portfolio.alwaysdata.net',
      user: process.env.DB_USER || '404304',
      password: process.env.DB_PASSWORD || '404304',
      database: process.env.DB_NAME || '404304',
      port: process.env.DB_PORT || 3306,
      connectTimeout: 60000,
      reconnect: true,
      ssl: false,
      multipleStatements: false
    });

    console.log('🔗 Connexion à la base de données établie');

    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, '../migrations/002_add_new_document_types.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Exécution de la migration 002...');

    // Exécuter la migration
    await connection.execute(migrationSQL);

    console.log('✅ Migration 002 exécutée avec succès !');
    console.log('📋 Nouveaux types de documents ajoutés :');
    console.log('   - certificat_origine');
    console.log('   - conformite_ce');
    console.log('   - certificat_sanitaire');

  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de la migration:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter la migration
runMigration();
