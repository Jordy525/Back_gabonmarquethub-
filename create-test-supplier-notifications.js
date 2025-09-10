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

async function createTestSupplierNotifications() {
  let connection;
  
  try {
    console.log('🧪 Création de notifications de test pour les fournisseurs...');
    
    // Connexion à la base de données
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion à la base de données établie');

    // Nettoyer les anciennes notifications de test
    await connection.execute('DELETE FROM notifications WHERE titre LIKE "Test Fournisseur %"');
    console.log('🧹 Anciennes notifications de test supprimées');

    // Récupérer les fournisseurs existants
    const [suppliers] = await connection.execute(`
      SELECT u.id, u.nom, u.prenom, u.email 
      FROM utilisateurs u 
      WHERE u.role_id = 2 
      LIMIT 3
    `);
    
    if (suppliers.length === 0) {
      console.log('❌ Aucun fournisseur trouvé. Créez d\'abord des fournisseurs.');
      return;
    }

    console.log(`👥 ${suppliers.length} fournisseurs trouvés`);

    // Créer des notifications de test pour chaque fournisseur
    for (const supplier of suppliers) {
      const { id: supplierId, nom, prenom } = supplier;
      
      console.log(`\n🔔 Création de notifications pour ${prenom} ${nom} (Fournisseur)`);

      const supplierNotifications = [
        {
          type: 'message',
          category: 'new_message',
          title: 'Test Fournisseur - Nouveau message de Marie Dupont',
          message: 'Bonjour, je suis intéressée par votre produit. Pouvez-vous me donner plus de détails sur la livraison ?',
          priority: 'high',
          data: JSON.stringify({ buyer: 'Marie Dupont', conversationId: 1 })
        },
        {
          type: 'message',
          category: 'contact_request',
          title: 'Test Fournisseur - Demande de contact de Jean Martin',
          message: 'Intéressé par: Smartphone Galaxy S24',
          priority: 'high',
          data: JSON.stringify({ buyer: 'Jean Martin', product: 'Smartphone Galaxy S24' })
        },
        {
          type: 'produit',
          category: 'product_approved',
          title: 'Test Fournisseur - Produit approuvé: Laptop Gaming Pro',
          message: 'Votre produit a été approuvé par l\'administrateur',
          priority: 'high',
          data: JSON.stringify({ product: 'Laptop Gaming Pro' })
        },
        {
          type: 'produit',
          category: 'product_rejected',
          title: 'Test Fournisseur - Produit rejeté: Smartphone Galaxy S24',
          message: 'Raison: Description incomplète - Veuillez ajouter plus de détails techniques',
          priority: 'high',
          data: JSON.stringify({ product: 'Smartphone Galaxy S24', reason: 'Description incomplète' })
        },
        {
          type: 'produit',
          category: 'modification_request',
          title: 'Test Fournisseur - Modification demandée: Laptop Gaming Pro',
          message: 'L\'administrateur demande des modifications sur les spécifications',
          priority: 'medium',
          data: JSON.stringify({ product: 'Laptop Gaming Pro', reason: 'Spécifications incomplètes' })
        },
        {
          type: 'produit',
          category: 'pending_moderation',
          title: 'Test Fournisseur - Produit en attente: Smartphone Galaxy S24',
          message: 'Votre produit attend la modération de l\'administrateur',
          priority: 'low',
          data: JSON.stringify({ product: 'Smartphone Galaxy S24' })
        },
        {
          type: 'commande',
          category: 'new_order',
          title: 'Test Fournisseur - Nouvelle commande de Sophie Laurent',
          message: '2 produit(s) - Total: 1299€',
          priority: 'high',
          data: JSON.stringify({ buyer: 'Sophie Laurent', total: 1299, productCount: 2 })
        },
        {
          type: 'systeme',
          category: 'maintenance',
          title: 'Test Fournisseur - Maintenance programmée',
          message: 'Maintenance prévue du 15/09/2025 02:00 au 15/09/2025 04:00',
          priority: 'high',
          data: JSON.stringify({ startTime: '15/09/2025 02:00', endTime: '15/09/2025 04:00' })
        },
        {
          type: 'systeme',
          category: 'important_update',
          title: 'Test Fournisseur - Mise à jour v2.1.0',
          message: 'Nouvelle version disponible avec de nouvelles fonctionnalités de gestion des commandes',
          priority: 'medium',
          data: JSON.stringify({ version: '2.1.0', features: ['Gestion commandes', 'Statistiques avancées'] })
        }
      ];

      for (const notif of supplierNotifications) {
        await connection.execute(`
          INSERT INTO notifications (
            utilisateur_id, type, category, titre, message, priority, data,
            lu, date_creation, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())
        `, [supplierId, notif.type, notif.category, notif.title, notif.message, notif.priority, notif.data]);
      }
    }

    // Vérifier le nombre total de notifications
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM notifications');
    const [unreadCount] = await connection.execute('SELECT COUNT(*) as unread FROM notifications WHERE lu = 0');
    const [supplierCount] = await connection.execute(`
      SELECT COUNT(*) as supplier_notifications 
      FROM notifications n 
      JOIN utilisateurs u ON n.utilisateur_id = u.id 
      WHERE u.role_id = 2
    `);
    
    console.log(`\n📊 Total notifications: ${count[0].total}`);
    console.log(`📊 Notifications non lues: ${unreadCount[0].unread}`);
    console.log(`📊 Notifications fournisseurs: ${supplierCount[0].supplier_notifications}`);

    console.log('\n🎉 Notifications de test fournisseur créées avec succès !');
    console.log('🔔 Les fournisseurs devraient maintenant voir les notifications dans leur interface');

  } catch (error) {
    console.error('❌ Erreur lors de la création des notifications de test fournisseur:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter la création des notifications de test
createTestSupplierNotifications().catch(console.error);
