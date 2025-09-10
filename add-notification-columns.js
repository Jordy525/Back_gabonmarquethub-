const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gabon_trade_hub',
  port: process.env.DB_PORT || 3306
};

async function addNotificationColumns() {
  let connection;
  
  try {
    console.log('🚀 Ajout des colonnes manquantes à la table notifications...');
    
    // Connexion à la base de données
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion à la base de données établie');

    // Liste des colonnes à ajouter
    const columnsToAdd = [
      { name: 'category', definition: 'varchar(50) DEFAULT "general"' },
      { name: 'priority', definition: 'enum("low","medium","high","urgent") DEFAULT "medium"' },
      { name: 'data', definition: 'longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL' },
      { name: 'related_user_id', definition: 'int(11) DEFAULT NULL' },
      { name: 'related_product_id', definition: 'int(11) DEFAULT NULL' },
      { name: 'related_conversation_id', definition: 'int(11) DEFAULT NULL' },
      { name: 'related_order_id', definition: 'int(11) DEFAULT NULL' },
      { name: 'read_at', definition: 'timestamp NULL DEFAULT NULL' },
      { name: 'updated_at', definition: 'timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    ];

    // Ajouter chaque colonne
    for (const column of columnsToAdd) {
      try {
        console.log(`\n🔧 Ajout de la colonne ${column.name}...`);
        await connection.execute(`ALTER TABLE notifications ADD COLUMN ${column.name} ${column.definition}`);
        console.log(`✅ Colonne ${column.name} ajoutée avec succès`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️ Colonne ${column.name} existe déjà`);
        } else {
          console.log(`❌ Erreur ajout colonne ${column.name}: ${error.message}`);
        }
      }
    }

    // Modifier le type enum pour inclure tous les types
    try {
      console.log('\n🔧 Modification du type enum...');
      await connection.execute(`
        ALTER TABLE notifications 
        MODIFY COLUMN type enum('message','commande','promotion','systeme','produit','user_management','product_management','order_management') NOT NULL
      `);
      console.log('✅ Type enum modifié avec succès');
    } catch (error) {
      console.log(`❌ Erreur modification type enum: ${error.message}`);
    }

    // Ajouter les index
    const indexesToAdd = [
      'idx_category',
      'idx_priority', 
      'idx_related_user',
      'idx_related_product',
      'idx_related_conversation',
      'idx_related_order'
    ];

    for (const indexName of indexesToAdd) {
      try {
        const columnName = indexName.replace('idx_', '').replace('_', '_');
        console.log(`\n🔧 Ajout de l'index ${indexName}...`);
        await connection.execute(`ALTER TABLE notifications ADD INDEX ${indexName} (${columnName})`);
        console.log(`✅ Index ${indexName} ajouté avec succès`);
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`⚠️ Index ${indexName} existe déjà`);
        } else {
          console.log(`❌ Erreur ajout index ${indexName}: ${error.message}`);
        }
      }
    }

    // Vérifier la structure finale
    const [columns] = await connection.execute('DESCRIBE notifications');
    console.log('\n📊 Structure finale de la table notifications:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`);
    });

    console.log('\n🎉 Extension de la table notifications terminée !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'extension:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter l'extension
addNotificationColumns().catch(console.error);
