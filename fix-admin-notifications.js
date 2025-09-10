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

async function fixAdminNotifications() {
  let connection;
  
  try {
    console.log('🔧 Correction de la table admin_notifications...');
    
    // Connexion à la base de données
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion à la base de données établie');

    // Vérifier si la table existe
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'admin_notifications'
    `, [dbConfig.database]);

    if (tables.length === 0) {
      console.log('❌ Table admin_notifications non trouvée');
      return;
    }

    console.log('✅ Table admin_notifications existe');

    // Instructions SQL à exécuter une par une
    const sqlInstructions = [
      {
        sql: `ALTER TABLE admin_notifications ADD COLUMN category varchar(50) NOT NULL DEFAULT 'general' COMMENT 'Catégorie spécifique de la notification' AFTER type`,
        description: 'Ajouter la colonne category'
      },
      {
        sql: `ALTER TABLE admin_notifications ADD INDEX idx_category (category)`,
        description: 'Ajouter l\'index sur category'
      },
      {
        sql: `UPDATE admin_notifications SET category = 'general' WHERE category IS NULL OR category = ''`,
        description: 'Mettre à jour les catégories existantes'
      },
      {
        sql: `ALTER TABLE admin_notifications ADD COLUMN user_id int(11) DEFAULT NULL COMMENT 'ID de l\'utilisateur concerné' AFTER priority`,
        description: 'Ajouter la colonne user_id'
      },
      {
        sql: `ALTER TABLE admin_notifications ADD COLUMN product_id int(11) DEFAULT NULL COMMENT 'ID du produit concerné' AFTER user_id`,
        description: 'Ajouter la colonne product_id'
      },
      {
        sql: `ALTER TABLE admin_notifications ADD COLUMN order_id int(11) DEFAULT NULL COMMENT 'ID de la commande concernée' AFTER product_id`,
        description: 'Ajouter la colonne order_id'
      },
      {
        sql: `ALTER TABLE admin_notifications ADD COLUMN updated_at timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Date de mise à jour' AFTER read_at`,
        description: 'Ajouter la colonne updated_at'
      }
    ];

    // Exécuter chaque instruction
    for (let i = 0; i < sqlInstructions.length; i++) {
      const instruction = sqlInstructions[i];
      try {
        console.log(`⏳ ${instruction.description}...`);
        await connection.execute(instruction.sql);
        console.log(`✅ ${instruction.description} - Succès`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_DUP_KEYNAME') {
          console.log(`ℹ️ ${instruction.description} - Déjà existant`);
        } else {
          console.error(`❌ ${instruction.description} - Erreur:`, error.message);
        }
      }
    }

    // Vérifier la structure finale
    console.log('📋 Vérification de la structure finale...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'admin_notifications'
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);

    console.log('✅ Structure finale de la table:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Tester l'insertion d'une notification
    console.log('🧪 Test d\'insertion d\'une notification...');
    try {
      const [result] = await connection.execute(`
        INSERT INTO admin_notifications (
          type, category, title, message, priority, data, is_read, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        'system',
        'test',
        'Test de notification',
        'Ceci est un test pour vérifier que la table fonctionne',
        'medium',
        JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
        0
      ]);

      console.log('✅ Notification de test insérée avec l\'ID:', result.insertId);

      // Nettoyer la notification de test
      await connection.execute('DELETE FROM admin_notifications WHERE id = ?', [result.insertId]);
      console.log('✅ Notification de test supprimée');

    } catch (error) {
      console.error('❌ Erreur lors du test d\'insertion:', error.message);
    }

    console.log('🎉 Correction de la table terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter la correction
fixAdminNotifications().catch(console.error);
