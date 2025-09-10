const db = require('./config/database');
const jwt = require('jsonwebtoken');

async function testNotificationsWithAuth() {
  try {
    console.log('🧪 Test de l\'endpoint /api/notifications avec authentification...');
    
    // Récupérer un utilisateur de test
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
    
    // Créer un token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role_id: user.role_id 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
    
    console.log('🔑 Token créé:', token.substring(0, 50) + '...');
    
    // Tester l'endpoint
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:3000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Erreur response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('📊 Response structure:');
    console.log('- notifications:', Array.isArray(data.notifications) ? data.notifications.length : 'N/A');
    console.log('- total:', data.total);
    console.log('- page:', data.page);
    console.log('- limit:', data.limit);
    console.log('- totalPages:', data.totalPages);
    
    if (data.notifications && data.notifications.length > 0) {
      console.log('📋 Première notification:');
      console.log(JSON.stringify(data.notifications[0], null, 2));
    } else {
      console.log('ℹ️ Aucune notification trouvée');
    }
    
  } catch (error) {
    console.error('❌ Erreur test:', error);
  } finally {
    process.exit(0);
  }
}

testNotificationsWithAuth();
