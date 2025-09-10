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

async function createTestUserNotifications() {
  let connection;
  
  try {
    console.log('🧪 Création de notifications de test pour les utilisateurs...');
    
    // Connexion à la base de données
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion à la base de données établie');

    // Nettoyer les anciennes notifications de test
    await connection.execute('DELETE FROM notifications WHERE titre LIKE "Test %"');
    console.log('🧹 Anciennes notifications de test supprimées');

    // Récupérer quelques utilisateurs existants
    const [users] = await connection.execute('SELECT id, nom, prenom, role_id FROM utilisateurs LIMIT 5');
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé. Créez d\'abord des utilisateurs.');
      return;
    }

    console.log(`👥 ${users.length} utilisateurs trouvés`);

    // Créer des notifications de test pour chaque utilisateur
    for (const user of users) {
      const { id: userId, nom, prenom, role_id } = user;
      const userType = role_id === 1 ? 'Acheteur' : role_id === 2 ? 'Fournisseur' : 'Utilisateur';
      
      console.log(`\n🔔 Création de notifications pour ${prenom} ${nom} (${userType})`);

      // Notifications selon le type d'utilisateur
      if (role_id === 1) { // Acheteur
        const acheteurNotifications = [
          {
            type: 'message',
            category: 'new_message',
            title: 'Test - Nouveau message de Tech Solutions',
            message: 'Bonjour, j\'ai une question sur votre produit. Pouvez-vous me donner plus de détails ?',
            priority: 'high',
            data: JSON.stringify({ supplier: 'Tech Solutions', conversationId: 1 })
          },
          {
            type: 'message',
            category: 'conversation_created',
            title: 'Test - Nouvelle conversation créée',
            message: 'Conversation créée pour le produit: Smartphone Galaxy S24',
            priority: 'medium',
            data: JSON.stringify({ product: 'Smartphone Galaxy S24', supplier: 'Tech Solutions' })
          },
          {
            type: 'produit',
            category: 'new_product',
            title: 'Test - Nouveau produit de Tech Solutions',
            message: 'Laptop Gaming Pro - 1299€',
            priority: 'medium',
            data: JSON.stringify({ product: 'Laptop Gaming Pro', price: 1299 })
          },
          {
            type: 'produit',
            category: 'price_change',
            title: 'Test - Prix modifié: Smartphone Galaxy S24',
            message: '899€ → 799€ par Tech Solutions',
            priority: 'medium',
            data: JSON.stringify({ product: 'Smartphone Galaxy S24', oldPrice: 899, newPrice: 799 })
          },
          {
            type: 'systeme',
            category: 'system_message',
            title: 'Test - Message système',
            message: 'Bienvenue sur GabMarketHub ! Découvrez nos nouveaux produits.',
            priority: 'low',
            data: JSON.stringify({ type: 'welcome' })
          }
        ];

        for (const notif of acheteurNotifications) {
          await connection.execute(`
            INSERT INTO notifications (
              utilisateur_id, type, category, titre, message, priority, data,
              lu, date_creation, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())
          `, [userId, notif.type, notif.category, notif.title, notif.message, notif.priority, notif.data]);
        }

      } else if (role_id === 2) { // Fournisseur
        const fournisseurNotifications = [
          {
            type: 'message',
            category: 'new_message',
            title: 'Test - Nouveau message de Marie Dupont',
            message: 'Bonjour, je suis intéressée par votre produit. Pouvez-vous me contacter ?',
            priority: 'high',
            data: JSON.stringify({ buyer: 'Marie Dupont', conversationId: 2 })
          },
          {
            type: 'message',
            category: 'contact_request',
            title: 'Test - Demande de contact de Jean Martin',
            message: 'Intéressé par: Laptop Gaming Pro',
            priority: 'high',
            data: JSON.stringify({ buyer: 'Jean Martin', product: 'Laptop Gaming Pro' })
          },
          {
            type: 'produit',
            category: 'product_approved',
            title: 'Test - Produit approuvé: Smartphone Galaxy S24',
            message: 'Votre produit a été approuvé par l\'administrateur',
            priority: 'high',
            data: JSON.stringify({ product: 'Smartphone Galaxy S24' })
          },
          {
            type: 'produit',
            category: 'modification_request',
            title: 'Test - Modification demandée: Laptop Gaming Pro',
            message: 'L\'administrateur demande des modifications',
            priority: 'medium',
            data: JSON.stringify({ product: 'Laptop Gaming Pro', reason: 'Description incomplète' })
          },
          {
            type: 'systeme',
            category: 'maintenance',
            title: 'Test - Maintenance programmée',
            message: 'Maintenance prévue du 15/09/2025 02:00 au 15/09/2025 04:00',
            priority: 'high',
            data: JSON.stringify({ startTime: '15/09/2025 02:00', endTime: '15/09/2025 04:00' })
          }
        ];

        for (const notif of fournisseurNotifications) {
          await connection.execute(`
            INSERT INTO notifications (
              utilisateur_id, type, category, titre, message, priority, data,
              lu, date_creation, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())
          `, [userId, notif.type, notif.category, notif.title, notif.message, notif.priority, notif.data]);
        }
      }
    }

    // Vérifier le nombre total de notifications
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM notifications');
    const [unreadCount] = await connection.execute('SELECT COUNT(*) as unread FROM notifications WHERE lu = 0');
    
    console.log(`\n📊 Total notifications: ${count[0].total}`);
    console.log(`📊 Notifications non lues: ${unreadCount[0].unread}`);

    console.log('\n🎉 Notifications de test créées avec succès !');
    console.log('🔔 Vous devriez maintenant voir les notifications dans l\'interface utilisateur');

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
createTestUserNotifications().catch(console.error);
