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

async function testAdminNotifications() {
  let connection;
  
  try {
    console.log('🔧 Test du système de notifications admin...');
    
    // Connexion à la base de données
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion à la base de données établie');

    // Vérifier si la table admin_notifications existe
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'admin_notifications'
    `, [dbConfig.database]);

    if (tables.length === 0) {
      console.log('❌ Table admin_notifications non trouvée. Exécution de la migration...');
      
      // Lire et exécuter le script de migration
      const fs = require('fs');
      const path = require('path');
      const migrationPath = path.join(__dirname, 'migrations', 'add_admin_notifications.sql');
      
      if (fs.existsSync(migrationPath)) {
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            await connection.execute(statement);
          }
        }
        console.log('✅ Migration exécutée avec succès');
      } else {
        console.log('❌ Fichier de migration non trouvé');
        return;
      }
    } else {
      console.log('✅ Table admin_notifications existe déjà');
    }

    // Tester l'insertion d'une notification de test
    console.log('📝 Test d\'insertion d\'une notification...');
    
    const [result] = await connection.execute(`
      INSERT INTO admin_notifications (
        type, category, title, message, priority, data, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      'system',
      'test',
      'Test de notification',
      'Ceci est une notification de test pour vérifier le système',
      'medium',
      JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
      0
    ]);

    console.log('✅ Notification de test insérée avec l\'ID:', result.insertId);

    // Tester la récupération des notifications
    console.log('📋 Test de récupération des notifications...');
    
    const [notifications] = await connection.execute(`
      SELECT 
        an.*,
        u.nom as user_nom,
        u.prenom as user_prenom,
        u.email as user_email
      FROM admin_notifications an
      LEFT JOIN utilisateurs u ON an.user_id = u.id
      ORDER BY an.created_at DESC
      LIMIT 10
    `);

    console.log(`✅ ${notifications.length} notifications récupérées:`);
    notifications.forEach((notif, index) => {
      console.log(`  ${index + 1}. [${notif.type}] ${notif.title} (${notif.priority})`);
    });

    // Tester les compteurs
    console.log('📊 Test des compteurs de notifications...');
    
    const [counts] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread,
        SUM(CASE WHEN type = 'user_management' THEN 1 ELSE 0 END) as user_management,
        SUM(CASE WHEN type = 'product_management' THEN 1 ELSE 0 END) as product_management,
        SUM(CASE WHEN type = 'system' THEN 1 ELSE 0 END) as system,
        SUM(CASE WHEN type = 'order_management' THEN 1 ELSE 0 END) as order_management,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent,
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as low
      FROM admin_notifications
    `);

    const stats = counts[0];
    console.log('✅ Statistiques des notifications:');
    console.log(`  Total: ${stats.total}`);
    console.log(`  Non lues: ${stats.unread}`);
    console.log(`  Par type: Utilisateurs(${stats.user_management}), Produits(${stats.product_management}), Système(${stats.system}), Commandes(${stats.order_management})`);
    console.log(`  Par priorité: Urgent(${stats.urgent}), Élevée(${stats.high}), Moyenne(${stats.medium}), Faible(${stats.low})`);

    // Tester la mise à jour d'une notification
    console.log('✏️ Test de mise à jour d\'une notification...');
    
    const [updateResult] = await connection.execute(`
      UPDATE admin_notifications 
      SET is_read = 1, read_at = NOW()
      WHERE id = ?
    `, [result.insertId]);

    if (updateResult.affectedRows > 0) {
      console.log('✅ Notification marquée comme lue');
    } else {
      console.log('❌ Erreur lors du marquage de la notification');
    }

    // Nettoyer la notification de test
    console.log('🧹 Nettoyage de la notification de test...');
    
    await connection.execute(`
      DELETE FROM admin_notifications 
      WHERE id = ? AND category = 'test'
    `, [result.insertId]);

    console.log('✅ Notification de test supprimée');

    console.log('🎉 Tous les tests sont passés avec succès !');
    console.log('📋 Le système de notifications admin est prêt à être utilisé.');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter le test
testAdminNotifications().catch(console.error);
