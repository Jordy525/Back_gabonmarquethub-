const express = require('express');
const router = express.Router();
const db = require('../config/database');

// =====================================================
// ROUTES POUR LE BLOG
// =====================================================

// GET /api/blog/featured - Récupérer les articles à la une
router.get('/featured', async (req, res) => {
  try {
    const { 
      limit = 2,
      published = 'true'
    } = req.query;

    let query = `
      SELECT 
        ab.*,
        CASE 
          WHEN ab.temps_lecture = 0 THEN 
            CEIL(CHAR_LENGTH(ab.contenu) / 200)
          ELSE ab.temps_lecture
        END as temps_lecture_estime
      FROM articles_blog ab
      WHERE ab.est_publie = TRUE 
        AND ab.est_a_la_une = TRUE
        AND ab.date_publication <= NOW()
    `;

    const params = [];

    if (published === 'true') {
      query += ` AND ab.est_publie = TRUE`;
    }

    query += ` ORDER BY ab.date_publication DESC LIMIT ?`;
    params.push(parseInt(limit));

    const [articles] = await db.execute(query, params);

    res.json({
      success: true,
      articles: articles,
      total: articles.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des articles à la une:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des articles à la une',
      error: error.message
    });
  }
});

// GET /api/blog/recent - Récupérer les articles récents
router.get('/recent', async (req, res) => {
  try {
    const { 
      limit = 6,
      category = 'all',
      published = 'true',
      sort = 'date_desc'
    } = req.query;

    let query = `
      SELECT 
        ab.*,
        CASE 
          WHEN ab.temps_lecture = 0 THEN 
            CEIL(CHAR_LENGTH(ab.contenu) / 200)
          ELSE ab.temps_lecture
        END as temps_lecture_estime
      FROM articles_blog ab
      WHERE ab.est_publie = TRUE
    `;

    const params = [];

    if (category !== 'all') {
      query += ` AND ab.categorie = ?`;
      params.push(category);
    }

    if (published === 'true') {
      query += ` AND ab.est_publie = TRUE`;
    }

    // Tri
    if (sort === 'date_desc') {
      query += ` ORDER BY ab.date_publication DESC`;
    } else if (sort === 'date_asc') {
      query += ` ORDER BY ab.date_publication ASC`;
    } else if (sort === 'views_desc') {
      query += ` ORDER BY ab.nombre_vues DESC`;
    } else if (sort === 'likes_desc') {
      query += ` ORDER BY ab.nombre_likes DESC`;
    } else {
      query += ` ORDER BY ab.date_publication DESC`;
    }

    query += ` LIMIT ?`;
    params.push(parseInt(limit));

    const [articles] = await db.execute(query, params);

    res.json({
      success: true,
      articles: articles,
      total: articles.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des articles récents:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des articles récents',
      error: error.message
    });
  }
});

// GET /api/blog/categories - Récupérer les catégories d'articles
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await db.execute(`
      SELECT DISTINCT categorie, COUNT(*) as count
      FROM articles_blog 
      WHERE est_publie = TRUE
      GROUP BY categorie
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      categories: categories.map(cat => cat.categorie),
      total: categories.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories',
      error: error.message
    });
  }
});

// GET /api/blog/:slug - Récupérer un article par slug
router.get('/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;

    const [articles] = await db.execute(`
      SELECT 
        ab.*,
        CASE 
          WHEN ab.temps_lecture = 0 THEN 
            CEIL(CHAR_LENGTH(ab.contenu) / 200)
          ELSE ab.temps_lecture
        END as temps_lecture_estime
      FROM articles_blog ab
      WHERE ab.slug = ? AND ab.est_publie = TRUE
    `, [slug]);

    if (articles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Incrémenter le compteur de vues
    await db.execute(
      'UPDATE articles_blog SET nombre_vues = nombre_vues + 1 WHERE slug = ?',
      [slug]
    );

    res.json({
      success: true,
      article: articles[0]
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'article:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'article',
      error: error.message
    });
  }
});

// POST /api/blog/:id/like - Liker un article
router.post('/:id/like', async (req, res) => {
  try {
    const articleId = req.params.id;

    // Vérifier que l'article existe
    const [articles] = await db.execute(
      'SELECT id FROM articles_blog WHERE id = ? AND est_publie = TRUE',
      [articleId]
    );

    if (articles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Incrémenter le compteur de likes
    await db.execute(
      'UPDATE articles_blog SET nombre_likes = nombre_likes + 1 WHERE id = ?',
      [articleId]
    );

    res.json({
      success: true,
      message: 'Like ajouté avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout du like:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du like',
      error: error.message
    });
  }
});

// POST /api/blog/:id/share - Partager un article
router.post('/:id/share', async (req, res) => {
  try {
    const articleId = req.params.id;
    const { platform } = req.body; // facebook, twitter, linkedin, etc.

    // Vérifier que l'article existe
    const [articles] = await db.execute(
      'SELECT id FROM articles_blog WHERE id = ? AND est_publie = TRUE',
      [articleId]
    );

    if (articles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Incrémenter le compteur de partages
    await db.execute(
      'UPDATE articles_blog SET nombre_partages = nombre_partages + 1 WHERE id = ?',
      [articleId]
    );

    res.json({
      success: true,
      message: 'Partage enregistré avec succès',
      platform: platform
    });

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du partage:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement du partage',
      error: error.message
    });
  }
});

module.exports = router;
