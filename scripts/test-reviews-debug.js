const mysql = require('mysql2/promise');
require('dotenv').config();

async function testReviewsDebug() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    const productId = 10;
    
    console.log('Test 1: Vérifier que le produit existe...');
    const [product] = await db.execute(
      'SELECT id FROM produits WHERE id = ? AND statut = "actif"',
      [productId]
    );
    console.log('Produit trouvé:', product);

    console.log('Test 2: Vérifier la structure de la table avis_produits...');
    const [avisStructure] = await db.execute('DESCRIBE avis_produits');
    console.log('Colonnes avis_produits:', avisStructure.map(col => col.Field));

    console.log('Test 3: Vérifier s\'il y a des avis pour ce produit...');
    const [avis] = await db.execute(
      'SELECT COUNT(*) as count FROM avis_produits WHERE produit_id = ?',
      [productId]
    );
    console.log('Nombre d\'avis:', avis[0].count);

    console.log('Test 4: Tester la requête complète...');
    const [reviews] = await db.execute(`
      SELECT 
        a.id,
        a.note,
        a.commentaire,
        a.achat_verifie,
        a.date_creation,
        a.statut,
        CONCAT(u.nom, ' ', COALESCE(u.prenom, '')) as utilisateur_nom,
        NULL as avatar_url,
        r.reponse,
        r.date_reponse,
        e.nom_entreprise as fournisseur_nom
      FROM avis_produits a
      JOIN utilisateurs u ON a.utilisateur_id = u.id
      LEFT JOIN reponses_avis r ON a.id = r.avis_id
      LEFT JOIN entreprises e ON r.fournisseur_id = e.id
      WHERE a.produit_id = ? AND a.statut = 'approuve'
      ORDER BY a.date_creation DESC
      LIMIT 10
    `, [productId]);
    console.log('Avis trouvés:', reviews);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Code:', error.code);
    console.error('SQL State:', error.sqlState);
  } finally {
    await db.end();
  }
}

testReviewsDebug();
