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

async function createTestNotifications() {
  let connection;
  
  try {
    console.log('🧪 Création de notifications de test pour l\'admin...');
    
    // Connexion à la base de données
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion à la base de données établie');

    // Nettoyer les anciennes notifications de test
    await connection.execute('DELETE FROM admin_notifications WHERE category LIKE "test_%"');
    console.log('🧹 Anciennes notifications de test supprimées');

    // Créer des notifications de test variées
    const testNotifications = [
      {
        type: 'user_management',
        category: 'new_user',
        title: 'Nouvel utilisateur inscrit',
        message: 'Un nouvel utilisateur "Marie Dupont" s\'est inscrit sur la plateforme',
        priority: 'medium',
        data: JSON.stringify({ user: { nom: 'Dupont', prenom: 'Marie', email: 'marie.dupont@example.com' } }),
        user_id: 1
      },
      {
        type: 'user_management',
        category: 'verification_request',
        title: 'Demande de vérification d\'entreprise',
        message: 'L\'entreprise "Tech Solutions SARL" demande une vérification de son compte',
        priority: 'high',
        data: JSON.stringify({ entreprise: { nom_entreprise: 'Tech Solutions SARL', secteur: 'Technologie' } }),
        user_id: 2
      },
      {
        type: 'product_management',
        category: 'product_moderation',
        title: 'Nouveau produit à modérer',
        message: 'Un nouveau produit "Smartphone Galaxy S24" nécessite une modération',
        priority: 'medium',
        data: JSON.stringify({ product: { nom: 'Smartphone Galaxy S24', prix: 899.99 } }),
        product_id: 1
      },
      {
        type: 'product_management',
        category: 'product_report',
        title: 'Produit signalé',
        message: 'Le produit "Laptop Gaming Pro" a été signalé pour contenu inapproprié',
        priority: 'high',
        data: JSON.stringify({ product: { nom: 'Laptop Gaming Pro' }, reason: 'Contenu inapproprié' }),
        product_id: 2
      },
      {
        type: 'system',
        category: 'system_error',
        title: 'Erreur système critique',
        message: 'Une erreur de base de données s\'est produite dans le module de paiement',
        priority: 'urgent',
        data: JSON.stringify({ error: 'Database connection timeout', module: 'payment' })
      },
      {
        type: 'system',
        category: 'security_alert',
        title: 'Alerte de sécurité',
        message: 'Tentative de connexion suspecte détectée depuis l\'IP 192.168.1.100',
        priority: 'urgent',
        data: JSON.stringify({ ip: '192.168.1.100', type: 'suspicious_login' })
      },
      {
        type: 'system',
        category: 'performance_stats',
        title: 'Rapport de performance',
        message: 'Temps de réponse moyen: 2.3s, Utilisation mémoire: 78%',
        priority: 'low',
        data: JSON.stringify({ response_time: 2.3, memory_usage: 78 })
      },
      {
        type: 'order_management',
        category: 'order_issue',
        title: 'Commande en attente',
        message: 'La commande #12345 est en attente de traitement depuis 2 heures',
        priority: 'high',
        data: JSON.stringify({ order_id: 12345, total: 299.99 }),
        order_id: 12345
      }
    ];

    // Insérer les notifications de test
    for (let i = 0; i < testNotifications.length; i++) {
      const notif = testNotifications[i];
      try {
        const [result] = await connection.execute(`
          INSERT INTO admin_notifications (
            type, category, title, message, priority, data, is_read, user_id, product_id, order_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          notif.type,
          notif.category,
          notif.title,
          notif.message,
          notif.priority,
          notif.data,
          0, // non lue
          notif.user_id || null,
          notif.product_id || null,
          notif.order_id || null
        ]);

        console.log(`✅ Notification ${i + 1} créée: ${notif.title}`);
      } catch (error) {
        console.error(`❌ Erreur notification ${i + 1}:`, error.message);
      }
    }

    // Vérifier le nombre total de notifications
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM admin_notifications');
    const [unreadCount] = await connection.execute('SELECT COUNT(*) as unread FROM admin_notifications WHERE is_read = 0');
    
    console.log(`📊 Total notifications: ${count[0].total}`);
    console.log(`📊 Notifications non lues: ${unreadCount[0].unread}`);

    console.log('🎉 Notifications de test créées avec succès !');
    console.log('🔔 Vous devriez maintenant voir les notifications dans le header admin');

  } catch (error) {
    console.error('❌ Erreur lors de la création des notifications de test:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter la création des notifications de test
createTestNotifications().catch(console.error);
