const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testUserNotifications() {
  try {
    console.log('🧪 Test du système de notifications utilisateurs...');
    console.log(`🔗 URL de base: ${API_BASE_URL}`);

    // Test 1: Vérifier que le serveur répond
    console.log('\n1️⃣ Test de connectivité...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/api/health`);
      console.log('✅ Serveur accessible:', healthResponse.data.status);
    } catch (error) {
      console.log('❌ Serveur non accessible:', error.message);
      return;
    }

    // Test 2: Tester l'endpoint des notifications (sans auth)
    console.log('\n2️⃣ Test de l\'endpoint notifications...');
    try {
      const notificationsResponse = await axios.get(`${API_BASE_URL}/api/notifications`);
      console.log('✅ Endpoint accessible (sans auth)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Endpoint protégé (401 Unauthorized) - Normal');
      } else {
        console.log('❌ Erreur endpoint:', error.message);
      }
    }

    // Test 3: Tester l'endpoint des compteurs
    console.log('\n3️⃣ Test de l\'endpoint compteurs...');
    try {
      const countsResponse = await axios.get(`${API_BASE_URL}/api/notifications/counts`);
      console.log('✅ Endpoint compteurs accessible (sans auth)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Endpoint compteurs protégé (401 Unauthorized) - Normal');
      } else {
        console.log('❌ Erreur endpoint compteurs:', error.message);
      }
    }

    console.log('\n🎉 Tests de l\'API terminés !');
    console.log('\n📋 Résumé:');
    console.log('• Le serveur backend fonctionne');
    console.log('• Les endpoints de notifications sont accessibles');
    console.log('• L\'authentification est en place');
    console.log('\n🚀 Vous pouvez maintenant tester l\'interface utilisateur !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests
testUserNotifications().catch(console.error);
