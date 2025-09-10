const mysql = require('mysql2/promise');
require('dotenv').config();

async function testAnalyticsDebug() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    const productId = 10;
    const today = new Date().toISOString().split('T')[0];
    
    console.log('Test 1: Vérifier que le produit existe...');
    const [product] = await db.execute(
      'SELECT id FROM produits WHERE id = ? AND statut = "actif"',
      [productId]
    );
    console.log('Produit trouvé:', product);

    console.log('Test 2: Insérer dans statistiques_produits...');
    await db.execute(`
      INSERT INTO statistiques_produits (produit_id, date, vues, created_at)
      VALUES (?, ?, 1, NOW())
      ON DUPLICATE KEY UPDATE vues = vues + 1
    `, [productId, today]);
    console.log('✅ Insertion réussie');

    console.log('Test 3: Insérer dans vues_produits_detaillees...');
    await db.execute(`
      INSERT INTO vues_produits_detaillees (produit_id, utilisateur_id, ip_address, user_agent)
      VALUES (?, ?, ?, ?)
    `, [productId, null, '127.0.0.1', 'Test Agent']);
    console.log('✅ Insertion réussie');

    console.log('Test 4: Mettre à jour les vues_30j...');
    await db.execute(`
      UPDATE produits 
      SET vues_30j = (
        SELECT COALESCE(SUM(vues), 0)
        FROM statistiques_produits 
        WHERE produit_id = ? 
        AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ),
      derniere_activite = NOW()
      WHERE id = ?
    `, [productId, productId]);
    console.log('✅ Mise à jour réussie');

    console.log('Test 5: Vérifier les résultats...');
    const [stats] = await db.execute(
      'SELECT vues FROM statistiques_produits WHERE produit_id = ? AND date = ?',
      [productId, today]
    );
    console.log('Statistiques:', stats);

    const [productStats] = await db.execute(
      'SELECT vues_30j, derniere_activite FROM produits WHERE id = ?',
      [productId]
    );
    console.log('Produit mis à jour:', productStats);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Code:', error.code);
  } finally {
    await db.end();
  }
}

testAnalyticsDebug();


