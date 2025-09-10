const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gabon_trade_hub',
  port: process.env.DB_PORT || 3306
};

async function runMigration() {
  let connection;
  
  try {
    console.log('🚀 Exécution de la migration admin_notifications...');
    
    // Connexion à la base de données
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion à la base de données établie');

    // Vérifier si la table existe déjà
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'admin_notifications'
    `, [dbConfig.database]);

    if (tables.length > 0) {
      console.log('ℹ️ Table admin_notifications existe déjà');
      return;
    }

    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, 'migrations', 'add_admin_notifications.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Fichier de migration non trouvé:', migrationPath);
      return;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Fichier de migration lu');

    // Diviser le SQL en instructions individuelles
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 ${statements.length} instructions SQL trouvées`);

    // Exécuter chaque instruction
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⏳ Exécution instruction ${i + 1}/${statements.length}...`);
          await connection.execute(statement);
          console.log(`✅ Instruction ${i + 1} exécutée avec succès`);
        } catch (error) {
          console.error(`❌ Erreur instruction ${i + 1}:`, error.message);
          // Continuer avec les autres instructions
        }
      }
    }

    // Vérifier que la table a été créée
    const [newTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'admin_notifications'
    `, [dbConfig.database]);

    if (newTables.length > 0) {
      console.log('🎉 Migration terminée avec succès !');
      console.log('✅ Table admin_notifications créée');
      
      // Vérifier le nombre d'enregistrements de test
      const [count] = await connection.execute('SELECT COUNT(*) as count FROM admin_notifications');
      console.log(`📊 ${count[0].count} notifications de test insérées`);
    } else {
      console.error('❌ La table n\'a pas été créée');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter la migration
runMigration().catch(console.error);
