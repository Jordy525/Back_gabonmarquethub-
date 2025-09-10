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

async function runUserNotificationsMigration() {
  let connection;
  
  try {
    console.log('🚀 Exécution de la migration des notifications utilisateurs...');
    
    // Connexion à la base de données
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion à la base de données établie');

    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, 'migrations', 'create_user_notifications.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Contenu SQL chargé');

    // Exécuter la migration
    await connection.execute(sqlContent);
    console.log('✅ Table notifications créée avec succès');

    // Vérifier que la table a été créée
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'notifications'
    `, [process.env.DB_NAME || 'gabon_trade_hub']);

    if (tables.length > 0) {
      console.log('✅ Vérification: Table notifications existe');
      
      // Afficher la structure de la table
      const [columns] = await connection.execute('DESCRIBE notifications');
      console.log('📊 Structure de la table notifications:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`);
      });
    } else {
      console.log('❌ Erreur: Table notifications non trouvée');
    }

    console.log('🎉 Migration des notifications utilisateurs terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️ La table notifications existe déjà');
    } else if (error.code === 'ER_CANT_CREATE_TABLE') {
      console.log('❌ Impossible de créer la table. Vérifiez les permissions.');
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      console.log('❌ Erreur de clé étrangère. Vérifiez que les tables référencées existent.');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter la migration
runUserNotificationsMigration().catch(console.error);
