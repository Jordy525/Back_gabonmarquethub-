const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkProducts() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    const [rows] = await db.execute('SELECT id, nom FROM produits WHERE statut = "actif" LIMIT 5');
    console.log('Produits disponibles:', rows);
    
    if (rows.length === 0) {
      console.log('Aucun produit actif trouvé. Vérifions tous les produits...');
      const [allProducts] = await db.execute('SELECT id, nom, statut FROM produits LIMIT 10');
      console.log('Tous les produits:', allProducts);
    }
  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await db.end();
  }
}

checkProducts();


