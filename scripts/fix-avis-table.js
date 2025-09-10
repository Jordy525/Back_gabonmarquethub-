const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixAvisTable() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('🔧 Ajout des colonnes manquantes à la table avis_produits...');

    // Ajouter les colonnes manquantes
    const columnsToAdd = [
      'ADD COLUMN statut ENUM(\'en_attente\', \'approuve\', \'rejete\') DEFAULT \'approuve\'',
      'ADD COLUMN date_moderation TIMESTAMP NULL',
      'ADD COLUMN moderateur_id INT NULL',
      'ADD COLUMN raison_rejet TEXT NULL',
      'ADD COLUMN ip_address VARCHAR(45)',
      'ADD COLUMN user_agent TEXT'
    ];

    for (const column of columnsToAdd) {
      try {
        await db.execute(`ALTER TABLE avis_produits ${column}`);
        console.log(`✅ Colonne ajoutée: ${column.split(' ')[2]}`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️  Colonne existe déjà: ${column.split(' ')[2]}`);
        } else {
          console.error(`❌ Erreur ajout colonne ${column.split(' ')[2]}:`, error.message);
        }
      }
    }

    // Ajouter les index manquants
    const indexesToAdd = [
      'ADD INDEX idx_statut (statut)',
      'ADD INDEX idx_produit_statut (produit_id, statut)',
      'ADD INDEX idx_date_creation (date_creation)'
    ];

    for (const index of indexesToAdd) {
      try {
        await db.execute(`ALTER TABLE avis_produits ${index}`);
        console.log(`✅ Index ajouté: ${index.split(' ')[2]}`);
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`⚠️  Index existe déjà: ${index.split(' ')[2]}`);
        } else {
          console.error(`❌ Erreur ajout index ${index.split(' ')[2]}:`, error.message);
        }
      }
    }

    // Mettre à jour les avis existants pour qu'ils soient approuvés
    await db.execute(`
      UPDATE avis_produits 
      SET statut = 'approuve' 
      WHERE statut IS NULL OR statut = ''
    `);
    console.log('✅ Avis existants mis à jour avec le statut "approuve"');

    console.log('🎉 Table avis_produits mise à jour avec succès !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await db.end();
  }
}

fixAvisTable();


