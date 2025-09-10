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

async function runCategoryMigration() {
  let connection;
  
  try {
    console.log('🔧 Ajout de la colonne category à admin_notifications...');
    
    // Connexion à la base de données
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion à la base de données établie');

    // Vérifier si la colonne category existe déjà
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'admin_notifications' AND COLUMN_NAME = 'category'
    `, [dbConfig.database]);

    if (columns.length > 0) {
      console.log('ℹ️ Colonne category existe déjà');
      return;
    }

    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, 'migrations', 'add_category_column.sql');
    
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

    // Vérifier que la colonne a été ajoutée
    const [newColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'admin_notifications' AND COLUMN_NAME = 'category'
    `, [dbConfig.database]);

    if (newColumns.length > 0) {
      console.log('🎉 Migration terminée avec succès !');
      console.log('✅ Colonne category ajoutée');
    } else {
      console.error('❌ La colonne n\'a pas été ajoutée');
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
runCategoryMigration().catch(console.error);
