const db = require('./config/database');
const userNotificationService = require('./services/userNotificationService');

async function createTestNotifications() {
  try {
    console.log('🧪 Création de notifications de test...');
    
    // Récupérer un utilisateur de test (acheteur)
    const [users] = await db.execute(`
      SELECT id, nom, prenom, email, role_id 
      FROM utilisateurs 
      WHERE role_id = 1 
      LIMIT 1
    `);
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur acheteur trouvé');
      return;
    }
    
    const user = users[0];
    console.log(`👤 Utilisateur trouvé: ${user.nom} ${user.prenom} (ID: ${user.id})`);
    
    // Créer quelques notifications de test
    const notifications = [
      {
        userId: user.id,
        type: 'message',
        category: 'new_message',
        title: 'Nouveau message reçu',
        message: 'Vous avez reçu un nouveau message d\'un fournisseur',
        priority: 'high'
      },
      {
        userId: user.id,
        type: 'produit',
        category: 'new_product',
        title: 'Nouveau produit disponible',
        message: 'Un nouveau produit a été ajouté par un fournisseur que vous suivez',
        priority: 'medium'
      },
      {
        userId: user.id,
        type: 'systeme',
        category: 'system_message',
        title: 'Bienvenue sur la plateforme',
        message: 'Merci de vous être inscrit sur Gabon Trade Hub',
        priority: 'low'
      }
    ];
    
    for (const notification of notifications) {
      try {
        const id = await userNotificationService.createNotification(notification);
        console.log(`✅ Notification créée: ${notification.title} (ID: ${id})`);
      } catch (error) {
        console.error(`❌ Erreur création notification "${notification.title}":`, error.message);
      }
    }
    
    console.log('🎉 Notifications de test créées avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur création notifications test:', error);
  } finally {
    process.exit(0);
  }
}

createTestNotifications();
