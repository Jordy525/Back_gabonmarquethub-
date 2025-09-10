const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkProduitsTable() {
  let connection;
  
  try {
    console.log('🔍 Vérification de la table produits...');
    
    // Connexion à la base de données
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gabon_trade_hub'
    });

    // Vérifier la structure de la table
    const [columns] = await connection.execute('DESCRIBE produits');
    
    console.log('📊 Structure de la table produits:');
    columns.forEach(col => {
      if (col.Field.includes('vues') || col.Field.includes('score') || col.Field.includes('note')) {
        console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`);
      }
    });

    // Vérifier s'il y a des colonnes liées aux vues
    const vuesColumns = columns.filter(col => 
      col.Field.includes('vues') || 
      col.Field.includes('score') || 
      col.Field.includes('note') ||
      col.Field.includes('popularite')
    );
    
    console.log('\n📈 Colonnes liées aux vues/score:');
    vuesColumns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkProduitsTable().catch(console.error);
