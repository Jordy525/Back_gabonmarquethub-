const fetch = require('node-fetch');

async function testNotificationsEndpoint() {
  try {
    console.log('🧪 Test de l\'endpoint /api/notifications...');
    
    // Simuler un token d'authentification (remplacez par un vrai token)
    const token = 'your-test-token-here';
    
    const response = await fetch('http://localhost:3000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status:', response.status);
    console.log('📊 Headers:', response.headers.raw());
    
    const data = await response.json();
    console.log('📊 Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Erreur test endpoint:', error);
  }
}

testNotificationsEndpoint();
