const http = require('http');

// Test simple pour vérifier si le serveur répond
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`✅ Serveur répond - Status: ${res.statusCode}`);
  console.log(`📡 Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`📄 Réponse:`, data);
  });
});

req.on('error', (err) => {
  console.error(`❌ Erreur de connexion:`, err.message);
  console.log(`💡 Vérifiez que le serveur backend est démarré sur le port 3000`);
});

req.end();
