const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkExistingNotifications() {
  let connection;
  
  try {
    console.log('🔍 Vérification de la table notifications existante...');
    
    // Connexion à la base de données
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gabon_trade_hub'
    });

    // Vérifier la structure de la table
    const [columns] = await connection.execute('DESCRIBE notifications');
    
    console.log('📊 Structure actuelle de la table notifications:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`);
    });

    // Vérifier s'il y a des données
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM notifications');
    console.log(`\n📈 Nombre d'enregistrements: ${count[0].total}`);

    if (count[0].total > 0) {
      // Afficher un exemple d'enregistrement
      const [sample] = await connection.execute('SELECT * FROM notifications LIMIT 1');
      console.log('\n📋 Exemple d\'enregistrement:');
      console.log(JSON.stringify(sample[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkExistingNotifications().catch(console.error);
