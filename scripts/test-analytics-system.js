const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
};

// Test data
const TEST_PRODUCT_ID = 10; // Utiliser un produit qui existe
const TEST_USER_ID = 1;

class AnalyticsSystemTester {
  constructor() {
    this.connection = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async connectDB() {
    try {
      this.connection = await mysql.createConnection(DB_CONFIG);
      console.log('✅ Connexion à la base de données réussie');
    } catch (error) {
      console.error('❌ Erreur de connexion à la base de données:', error.message);
      throw error;
    }
  }

  async runTest(testName, testFunction) {
    try {
      console.log(`\n🧪 Test: ${testName}`);
      await testFunction();
      this.testResults.passed++;
      this.testResults.tests.push({ name: testName, status: 'PASSED' });
      console.log(`✅ ${testName} - RÉUSSI`);
    } catch (error) {
      this.testResults.failed++;
      this.testResults.tests.push({ name: testName, status: 'FAILED', error: error.message });
      console.log(`❌ ${testName} - ÉCHOUÉ: ${error.message}`);
    }
  }

  // Test 1: Vérifier que les tables existent
  async testTablesExist() {
    const tables = [
      'statistiques_produits',
      'vues_produits_detaillees',
      'avis_produits',
      'reponses_avis',
      'signalements_avis'
    ];

    for (const table of tables) {
      const [rows] = await this.connection.execute(
        `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?`,
        [DB_CONFIG.database, table]
      );
      
      if (rows[0].count === 0) {
        throw new Error(`Table ${table} n'existe pas`);
      }
    }
  }

  // Test 2: Vérifier les colonnes ajoutées aux produits
  async testProductColumns() {
    const columns = [
      'vues_30j',
      'score_popularite',
      'note_moyenne',
      'nombre_avis',
      'derniere_activite',
      'prix_promo',
      'date_debut_promo',
      'date_fin_promo',
      'est_en_offre',
      'type_offre'
    ];

    for (const column of columns) {
      const [rows] = await this.connection.execute(
        `SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = ? AND table_name = 'produits' AND column_name = ?`,
        [DB_CONFIG.database, column]
      );
      
      if (rows[0].count === 0) {
        throw new Error(`Colonne ${column} n'existe pas dans la table produits`);
      }
    }
  }

  // Test 3: Tester l'enregistrement d'une vue
  async testTrackProductView() {
    const response = await axios.post(`${API_BASE_URL}/analytics/products/${TEST_PRODUCT_ID}/view`);
    
    if (response.status !== 200) {
      throw new Error(`Status code incorrect: ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error('La réponse ne contient pas success: true');
    }

    // Vérifier que la vue a été enregistrée en base
    const [rows] = await this.connection.execute(
      'SELECT vues FROM statistiques_produits WHERE produit_id = ? AND date = CURDATE()',
      [TEST_PRODUCT_ID]
    );
    
    if (rows.length === 0 || rows[0].vues < 1) {
      throw new Error('La vue n\'a pas été enregistrée en base de données');
    }
  }

  // Test 4: Tester l'enregistrement d'un clic
  async testTrackProductClick() {
    const response = await axios.post(`${API_BASE_URL}/analytics/products/${TEST_PRODUCT_ID}/click`, {
      action: 'favorite'
    });
    
    if (response.status !== 200) {
      throw new Error(`Status code incorrect: ${response.status}`);
    }
    
    if (!response.data.success) {
      throw new Error('La réponse ne contient pas success: true');
    }

    // Vérifier que le clic a été enregistré en base
    const [rows] = await this.connection.execute(
      'SELECT ajouts_favoris FROM statistiques_produits WHERE produit_id = ? AND date = CURDATE()',
      [TEST_PRODUCT_ID]
    );
    
    if (rows.length === 0 || rows[0].ajouts_favoris < 1) {
      throw new Error('Le clic n\'a pas été enregistré en base de données');
    }
  }

  // Test 5: Tester la récupération des statistiques d'un produit
  async testGetProductStats() {
    const response = await axios.get(`${API_BASE_URL}/analytics/products/${TEST_PRODUCT_ID}/stats?period=30d`);
    
    if (response.status !== 200) {
      throw new Error(`Status code incorrect: ${response.status}`);
    }
    
    const data = response.data;
    
    if (!data.stats || !data.product) {
      throw new Error('La réponse ne contient pas les données attendues');
    }
    
    if (typeof data.stats.total_vues !== 'number') {
      throw new Error('total_vues n\'est pas un nombre');
    }
  }

  // Test 6: Tester la récupération des statistiques globales
  async testGetGlobalStats() {
    const response = await axios.get(`${API_BASE_URL}/analytics/stats/global?period=30d`);
    
    if (response.status !== 200) {
      throw new Error(`Status code incorrect: ${response.status}`);
    }
    
    const data = response.data;
    
    if (!data.global || !data.topProducts || !data.categoryStats) {
      throw new Error('La réponse ne contient pas les données attendues');
    }
  }

  // Test 7: Tester l'ajout d'un avis (sans authentification pour l'instant)
  async testAddReview() {
    // Note: Ce test nécessiterait une authentification réelle
    // Pour l'instant, on teste juste que l'endpoint existe
    try {
      await axios.post(`${API_BASE_URL}/reviews`, {
        produit_id: TEST_PRODUCT_ID,
        note: 5,
        commentaire: 'Test commentaire pour vérifier le système'
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // C'est normal, l'utilisateur n'est pas authentifié
        console.log('   ℹ️  Test d\'authentification réussi (401 attendu)');
        return;
      }
      throw error;
    }
  }

  // Test 8: Tester la récupération des avis d'un produit
  async testGetProductReviews() {
    const response = await axios.get(`${API_BASE_URL}/reviews/product/${TEST_PRODUCT_ID}`);
    
    if (response.status !== 200) {
      throw new Error(`Status code incorrect: ${response.status}`);
    }
    
    const data = response.data;
    
    if (!data.reviews || !data.pagination || !data.ratingStats) {
      throw new Error('La réponse ne contient pas les données attendues');
    }
  }

  // Test 9: Tester l'ajout aux favoris
  async testAddToFavorites() {
    try {
      const response = await axios.post(`${API_BASE_URL}/users/favorites`, {
        produit_id: TEST_PRODUCT_ID
      });
      
      if (response.status !== 201) {
        throw new Error(`Status code incorrect: ${response.status}`);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('   ℹ️  Test d\'authentification réussi (401 attendu)');
        return;
      }
      throw error;
    }
  }

  // Test 10: Vérifier les triggers et procédures stockées
  async testTriggersAndProcedures() {
    // Vérifier que les triggers existent
    const [triggers] = await this.connection.execute(
      `SELECT TRIGGER_NAME FROM information_schema.triggers WHERE TRIGGER_SCHEMA = ? AND TRIGGER_NAME IN ('tr_update_vues_produit', 'tr_calculate_popularity_score')`,
      [DB_CONFIG.database]
    );
    
    if (triggers.length < 2) {
      throw new Error('Les triggers ne sont pas tous présents');
    }

    // Vérifier que les procédures stockées existent
    const [procedures] = await this.connection.execute(
      `SELECT ROUTINE_NAME FROM information_schema.routines WHERE ROUTINE_SCHEMA = ? AND ROUTINE_NAME = 'sp_update_daily_stats'`,
      [DB_CONFIG.database]
    );
    
    if (procedures.length === 0) {
      throw new Error('La procédure stockée sp_update_daily_stats n\'existe pas');
    }
  }

  // Test 11: Vérifier les vues
  async testViews() {
    const views = [
      'vue_produits_en_offre',
      'vue_produits_populaires',
      'vue_evenements_a_venir',
      'vue_articles_a_la_une'
    ];

    for (const view of views) {
      const [rows] = await this.connection.execute(
        `SELECT COUNT(*) as count FROM information_schema.views WHERE table_schema = ? AND table_name = ?`,
        [DB_CONFIG.database, view]
      );
      
      if (rows[0].count === 0) {
        throw new Error(`Vue ${view} n'existe pas`);
      }
    }
  }

  // Test 12: Tester les statistiques des favoris
  async testFavoriteStats() {
    const response = await axios.get(`${API_BASE_URL}/users/favorites/stats/${TEST_PRODUCT_ID}?period=30d`);
    
    if (response.status !== 200) {
      throw new Error(`Status code incorrect: ${response.status}`);
    }
    
    const data = response.data;
    
    if (!data.productId || typeof data.totalFavorites !== 'number') {
      throw new Error('La réponse ne contient pas les données attendues');
    }
  }

  async runAllTests() {
    console.log('🚀 Démarrage des tests du système d\'analytics et de suivi\n');
    
    await this.connectDB();

    // Tests de base de données
    await this.runTest('Vérification des tables', () => this.testTablesExist());
    await this.runTest('Vérification des colonnes produits', () => this.testProductColumns());
    await this.runTest('Vérification des triggers et procédures', () => this.testTriggersAndProcedures());
    await this.runTest('Vérification des vues', () => this.testViews());

    // Tests d'API
    await this.runTest('Enregistrement d\'une vue', () => this.testTrackProductView());
    await this.runTest('Enregistrement d\'un clic', () => this.testTrackProductClick());
    await this.runTest('Récupération des statistiques produit', () => this.testGetProductStats());
    await this.runTest('Récupération des statistiques globales', () => this.testGetGlobalStats());
    await this.runTest('Ajout d\'un avis', () => this.testAddReview());
    await this.runTest('Récupération des avis produit', () => this.testGetProductReviews());
    await this.runTest('Ajout aux favoris', () => this.testAddToFavorites());
    await this.runTest('Statistiques des favoris', () => this.testFavoriteStats());

    await this.connection.end();
    this.printResults();
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSULTATS DES TESTS');
    console.log('='.repeat(60));
    
    console.log(`✅ Tests réussis: ${this.testResults.passed}`);
    console.log(`❌ Tests échoués: ${this.testResults.failed}`);
    console.log(`📈 Taux de réussite: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);
    
    if (this.testResults.failed > 0) {
      console.log('\n❌ Tests échoués:');
      this.testResults.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`   - ${test.name}: ${test.error}`);
        });
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (this.testResults.failed === 0) {
      console.log('🎉 Tous les tests sont passés avec succès !');
      console.log('✨ Le système d\'analytics et de suivi est opérationnel.');
    } else {
      console.log('⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.');
    }
  }
}

// Exécution des tests
if (require.main === module) {
  const tester = new AnalyticsSystemTester();
  tester.runAllTests().catch(error => {
    console.error('💥 Erreur fatale lors des tests:', error);
    process.exit(1);
  });
}

module.exports = AnalyticsSystemTester;
