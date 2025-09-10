const http = require('http');

// Test des routes API spécifiques
const testRoutes = [
  '/api/health',
  '/api/entreprises',
  '/api/conversations',
  '/api/conversations/find-or-create',
  '/api/conversations/contact-request'
];

async function testRoute(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          contentType: res.headers['content-type'],
          data: data.substring(0, 200) + (data.length > 200 ? '...' : '')
        });
      });
    });

    req.on('error', (err) => {
      reject({ path, error: err.message });
    });

    req.end();
  });
}

async function testAllRoutes() {
  console.log('🧪 Test des routes API...\n');
  
  for (const route of testRoutes) {
    try {
      const result = await testRoute(route);
      if (result.status === 200) {
        console.log(`✅ ${route} - Status: ${result.status} - Type: ${result.contentType}`);
      } else if (result.status === 401) {
        console.log(`🔐 ${route} - Status: ${result.status} - Authentification requise`);
      } else {
        console.log(`⚠️  ${route} - Status: ${result.status} - Type: ${result.contentType}`);
      }
    } catch (error) {
      console.log(`❌ ${route} - Erreur: ${error.error}`);
    }
  }
  
  console.log('\n🎯 Routes testées avec succès !');
}

testAllRoutes().catch(console.error);
