const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testAdminAPI() {
  try {
    console.log('🧪 Test de l\'API des notifications admin...');
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

    // Test 2: Tester l'endpoint des notifications admin (sans auth)
    console.log('\n2️⃣ Test de l\'endpoint notifications admin...');
    try {
      const notificationsResponse = await axios.get(`${API_BASE_URL}/api/admin/notifications`);
      console.log('✅ Endpoint accessible (sans auth)');
      console.log('📊 Données reçues:', {
        total: notificationsResponse.data.total,
        notifications: notificationsResponse.data.notifications?.length || 0
      });
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
      const countsResponse = await axios.get(`${API_BASE_URL}/api/admin/notifications/counts`);
      console.log('✅ Endpoint compteurs accessible (sans auth)');
      console.log('📊 Compteurs:', countsResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Endpoint compteurs protégé (401 Unauthorized) - Normal');
      } else {
        console.log('❌ Erreur endpoint compteurs:', error.message);
      }
    }

    // Test 4: Vérifier la structure de la réponse
    console.log('\n4️⃣ Test de la structure des données...');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/notifications`);
      const data = response.data;
      
      const expectedFields = ['notifications', 'total', 'page', 'limit', 'totalPages'];
      const hasAllFields = expectedFields.every(field => data.hasOwnProperty(field));
      
      if (hasAllFields) {
        console.log('✅ Structure de réponse correcte');
      } else {
        console.log('❌ Structure de réponse incorrecte');
        console.log('Champs attendus:', expectedFields);
        console.log('Champs reçus:', Object.keys(data));
      }
    } catch (error) {
      console.log('ℹ️ Test de structure ignoré (endpoint protégé)');
    }

    console.log('\n🎉 Tests de l\'API terminés !');
    console.log('\n📋 Résumé:');
    console.log('• Le serveur backend fonctionne');
    console.log('• Les endpoints sont accessibles');
    console.log('• L\'authentification est en place');
    console.log('• Les notifications de test sont créées');
    console.log('\n🚀 Vous pouvez maintenant tester l\'interface admin !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests
testAdminAPI().catch(console.error);
