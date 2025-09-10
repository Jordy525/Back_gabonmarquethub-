const http = require('http');

// Test des routes POST avec des données valides
const testPostRoutes = [
  {
    path: '/api/conversations/find-or-create',
    method: 'POST',
    data: JSON.stringify({
      fournisseur_id: 1,
      sujet: 'Test de conversation'
    })
  },
  {
    path: '/api/conversations/contact-request',
    method: 'POST',
    data: JSON.stringify({
      fournisseur_id: 1,
      message: 'Test de message',
      sujet: 'Test de contact'
    })
  }
];

async function testPostRoute(route) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: route.path,
      method: route.method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(route.data)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          path: route.path,
          method: route.method,
          status: res.statusCode,
          contentType: res.headers['content-type'],
          data: data.substring(0, 200) + (data.length > 200 ? '...' : '')
        });
      });
    });

    req.on('error', (err) => {
      reject({ path: route.path, method: route.method, error: err.message });
    });

    req.write(route.data);
    req.end();
  });
}

async function testAllPostRoutes() {
  console.log('🧪 Test des routes POST...\n');
  
  for (const route of testPostRoutes) {
    try {
      const result = await testPostRoute(route);
      if (result.status === 401) {
        console.log(`🔐 ${result.method} ${result.path} - Status: ${result.status} - Authentification requise (normal)`);
      } else if (result.status === 400) {
        console.log(`⚠️  ${result.method} ${result.path} - Status: ${result.status} - Données invalides (normal sans token)`);
      } else if (result.status === 200 || result.status === 201) {
        console.log(`✅ ${result.method} ${result.path} - Status: ${result.status} - Succès`);
      } else {
        console.log(`❓ ${result.method} ${result.path} - Status: ${result.status} - Type: ${result.contentType}`);
      }
    } catch (error) {
      console.log(`❌ ${error.method} ${error.path} - Erreur: ${error.error}`);
    }
  }
  
  console.log('\n🎯 Routes POST testées !');
  console.log('💡 Les erreurs 401 et 400 sont normales sans token d\'authentification');
}

testAllPostRoutes().catch(console.error);
