const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkNotifications() {
  let connection;
  
  try {
    console.log('🔍 Vérification des notifications admin...');
    
    // Connexion à la base de données
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gabon_trade_hub'
    });

    // Vérifier les notifications récentes
    const [notifications] = await connection.execute(`
      SELECT id, title, message, type, category, priority, created_at 
      FROM admin_notifications 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log(`📊 Nombre de notifications trouvées: ${notifications.length}`);
    
    if (notifications.length > 0) {
      console.log('\n🔔 Dernières notifications:');
      notifications.forEach((n, index) => {
        console.log(`${index + 1}. ${n.title}`);
        console.log(`   Type: ${n.type} | Catégorie: ${n.category} | Priorité: ${n.priority}`);
        console.log(`   Message: ${n.message}`);
        console.log(`   Créé: ${n.created_at}`);
        console.log('');
      });
    } else {
      console.log('❌ Aucune notification trouvée');
    }

    // Vérifier les compteurs
    const [counts] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent,
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high
      FROM admin_notifications
    `);

    console.log('📈 Statistiques:');
    console.log(`   Total: ${counts[0].total}`);
    console.log(`   Non lues: ${counts[0].unread}`);
    console.log(`   Urgentes: ${counts[0].urgent}`);
    console.log(`   Élevées: ${counts[0].high}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkNotifications().catch(console.error);
