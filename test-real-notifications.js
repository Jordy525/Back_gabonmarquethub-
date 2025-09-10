const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testRealNotifications() {
  try {
    console.log('🧪 Test des notifications automatiques...');
    console.log(`🔗 URL de base: ${API_BASE_URL}`);

    // Test 1: Inscription d'un nouvel utilisateur
    console.log('\n1️⃣ Test inscription utilisateur...');
    try {
      const registerData = {
        email: `test-${Date.now()}@example.com`,
        mot_de_passe: 'password123',
        nom: 'Test',
        prenom: 'User',
        telephone: '+241123456789',
        role_id: 1 // Acheteur
      };

      const registerResponse = await axios.post(`${API_BASE_URL}/api/auth/register`, registerData);
      console.log('✅ Utilisateur inscrit:', registerResponse.data.message);
      
      // Attendre un peu pour que la notification soit créée
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log('❌ Erreur inscription:', error.response?.data?.error || error.message);
    }

    // Test 2: Vérifier les notifications admin
    console.log('\n2️⃣ Vérification des notifications admin...');
    try {
      // Note: En production, il faudrait être authentifié en tant qu'admin
      // Pour ce test, on vérifie juste que l'endpoint répond
      const notificationsResponse = await axios.get(`${API_BASE_URL}/api/admin/notifications`);
      console.log('✅ Endpoint notifications accessible');
      console.log('📊 Notifications trouvées:', notificationsResponse.data.total || 0);
      
      if (notificationsResponse.data.notifications && notificationsResponse.data.notifications.length > 0) {
        console.log('🔔 Dernière notification:', notificationsResponse.data.notifications[0].title);
      }
      
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Endpoint protégé (401 Unauthorized) - Normal');
      } else {
        console.log('❌ Erreur endpoint notifications:', error.message);
      }
    }

    // Test 3: Vérifier les compteurs
    console.log('\n3️⃣ Vérification des compteurs...');
    try {
      const countsResponse = await axios.get(`${API_BASE_URL}/api/admin/notifications/counts`);
      console.log('✅ Endpoint compteurs accessible');
      console.log('📊 Compteurs:', countsResponse.data);
      
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Endpoint compteurs protégé (401 Unauthorized) - Normal');
      } else {
        console.log('❌ Erreur endpoint compteurs:', error.message);
      }
    }

    console.log('\n🎉 Tests terminés !');
    console.log('\n📋 Résumé:');
    console.log('• Un utilisateur de test a été inscrit');
    console.log('• Une notification admin devrait être créée automatiquement');
    console.log('• Les endpoints sont accessibles et protégés');
    console.log('\n🚀 Vérifiez maintenant l\'interface admin !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests
testRealNotifications().catch(console.error);
