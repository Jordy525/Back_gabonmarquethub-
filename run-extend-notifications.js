const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gabon_trade_hub',
  port: process.env.DB_PORT || 3306
};

async function extendNotificationsTable() {
  let connection;
  
  try {
    console.log('🚀 Extension de la table notifications...');
    
    // Connexion à la base de données
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion à la base de données établie');

    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, 'migrations', 'extend_user_notifications.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Contenu SQL chargé');

    // Diviser le SQL en commandes individuelles pour un meilleur contrôle d'erreur
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 ${sqlCommands.length} commandes SQL à exécuter`);

    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      if (command.trim()) {
        try {
          console.log(`\n🔧 Exécution commande ${i + 1}/${sqlCommands.length}...`);
          await connection.execute(command);
          console.log(`✅ Commande ${i + 1} exécutée avec succès`);
        } catch (error) {
          if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_DUP_KEY') {
            console.log(`⚠️ Commande ${i + 1} ignorée (déjà existant): ${error.message}`);
          } else {
            console.log(`❌ Erreur commande ${i + 1}: ${error.message}`);
            // Continuer avec les autres commandes
          }
        }
      }
    }

    // Vérifier la structure finale
    const [columns] = await connection.execute('DESCRIBE notifications');
    console.log('\n📊 Structure finale de la table notifications:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`);
    });

    console.log('\n🎉 Extension de la table notifications terminée !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'extension:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter l'extension
extendNotificationsTable().catch(console.error);
