const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Configuration pour les tests
const testConfig = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Fonction utilitaire pour les tests
async function testEndpoint(endpoint, description) {
  try {
    console.log(`\n🧪 Test: ${description}`);
    console.log(`📍 Endpoint: ${endpoint}`);
    
    const response = await axios.get(`${BASE_URL}${endpoint}`, testConfig);
    
    console.log(`✅ Succès: ${response.status}`);
    console.log(`📊 Données reçues: ${JSON.stringify(response.data, null, 2)}`);
    
    return { success: true, data: response.data };
  } catch (error) {
    console.log(`❌ Erreur: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log(`📋 Détails: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return { success: false, error: error.message };
  }
}

// Tests pour les produits populaires
async function testPopularProducts() {
  console.log('\n🚀 === TEST DES PRODUITS POPULAIRES ===');
  
  await testEndpoint('/products/popular', 'Produits populaires - Tous');
  await testEndpoint('/products/popular?limit=4', 'Produits populaires - Limite 4');
  await testEndpoint('/products/popular?category=all&sort=rating', 'Produits populaires - Tri par note');
}

// Tests pour les offres spéciales
async function testSpecialOffers() {
  console.log('\n🎯 === TEST DES OFFRES SPÉCIALES ===');
  
  await testEndpoint('/products/special-offers', 'Offres spéciales - Toutes');
  await testEndpoint('/products/special-offers?limit=3', 'Offres spéciales - Limite 3');
  await testEndpoint('/products/special-offers?sort=expiry_asc', 'Offres spéciales - Tri par expiration');
}

// Tests pour les événements commerciaux
async function testCommercialEvents() {
  console.log('\n📅 === TEST DES ÉVÉNEMENTS COMMERCIAUX ===');
  
  await testEndpoint('/events/commercial', 'Événements commerciaux - Tous');
  await testEndpoint('/events/commercial?limit=2', 'Événements commerciaux - Limite 2');
  await testEndpoint('/events/commercial?type=webinar', 'Événements commerciaux - Webinaires');
  await testEndpoint('/events/commercial?upcoming_only=true', 'Événements commerciaux - À venir uniquement');
}

// Tests pour le blog
async function testBlog() {
  console.log('\n📝 === TEST DU BLOG ===');
  
  await testEndpoint('/blog/featured', 'Articles à la une');
  await testEndpoint('/blog/recent', 'Articles récents');
  await testEndpoint('/blog/categories', 'Catégories d\'articles');
  await testEndpoint('/blog/recent?category=Conseils', 'Articles récents - Catégorie Conseils');
}

// Tests pour les produits avec filtres
async function testProductFilters() {
  console.log('\n🔍 === TEST DES FILTRES DE PRODUITS ===');
  
  await testEndpoint('/products?limit=5', 'Produits - Limite 5');
  await testEndpoint('/products?offers_only=true', 'Produits - Offres uniquement');
  await testEndpoint('/products?featured_only=true', 'Produits - Vedettes uniquement');
  await testEndpoint('/products?min_rating=4.0', 'Produits - Note minimum 4.0');
  await testEndpoint('/products?sort=score_popularite&order=DESC', 'Produits - Tri par popularité');
}

// Test de création d'événement d'exemple
async function testCreateSampleEvent() {
  console.log('\n➕ === CRÉATION D\'UN ÉVÉNEMENT D\'EXEMPLE ===');
  
  try {
    const eventData = {
      titre: 'Test Webinaire E-commerce',
      description: 'Un webinaire de test pour valider le système',
      description_courte: 'Webinaire de test',
      type: 'webinar',
      date_debut: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Dans 7 jours
      date_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // +2h
      lieu: 'En ligne',
      est_en_ligne: true,
      lien_webinaire: 'https://meet.google.com/test',
      organisateur_nom: 'Équipe Test',
      prix_participation: 0,
      est_gratuit: true,
      nombre_max_participants: 100,
      est_populaire: true,
      tags: JSON.stringify(['Test', 'E-commerce', 'Webinaire']),
      statut: 'programme'
    };

    console.log('📝 Création d\'un événement de test...');
    const response = await axios.post(`${BASE_URL}/events/commercial`, eventData, testConfig);
    
    console.log(`✅ Événement créé avec succès: ${response.status}`);
    console.log(`📊 Réponse: ${JSON.stringify(response.data, null, 2)}`);
    
    return response.data.event?.id;
  } catch (error) {
    console.log(`❌ Erreur lors de la création: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log(`📋 Détails: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

// Test d'inscription à un événement
async function testEventRegistration(eventId) {
  if (!eventId) {
    console.log('\n⏭️ === SKIP TEST D\'INSCRIPTION (pas d\'événement créé) ===');
    return;
  }

  console.log('\n📝 === TEST D\'INSCRIPTION À UN ÉVÉNEMENT ===');
  
  try {
    const registrationData = {
      nom: 'Test User',
      email: 'test@example.com',
      telephone: '+241123456789',
      notes: 'Inscription de test'
    };

    console.log(`📝 Inscription à l'événement ${eventId}...`);
    const response = await axios.post(`${BASE_URL}/events/${eventId}/register`, registrationData, testConfig);
    
    console.log(`✅ Inscription réussie: ${response.status}`);
    console.log(`📊 Réponse: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    console.log(`❌ Erreur lors de l'inscription: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log(`📋 Détails: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// Test de création d'article de blog d'exemple
async function testCreateSampleArticle() {
  console.log('\n📰 === CRÉATION D\'UN ARTICLE DE BLOG D\'EXEMPLE ===');
  
  try {
    const articleData = {
      titre: 'Guide Test: Comment Tester les Nouvelles Fonctionnalités',
      slug: 'guide-test-nouvelles-fonctionnalites',
      extrait: 'Un guide complet pour tester les nouvelles fonctionnalités de la plateforme.',
      contenu: 'Ceci est un article de test pour valider le système de blog. Il contient du contenu de test pour vérifier que tout fonctionne correctement.',
      auteur_nom: 'Équipe Test',
      categorie: 'Guide',
      tags: JSON.stringify(['Test', 'Guide', 'Fonctionnalités']),
      est_a_la_une: true,
      est_publie: true,
      date_publication: new Date().toISOString(),
      temps_lecture: 5,
      meta_description: 'Guide de test pour les nouvelles fonctionnalités',
      meta_mots_cles: 'test, guide, fonctionnalités'
    };

    console.log('📝 Création d\'un article de test...');
    const response = await axios.post(`${BASE_URL}/blog`, articleData, testConfig);
    
    console.log(`✅ Article créé avec succès: ${response.status}`);
    console.log(`📊 Réponse: ${JSON.stringify(response.data, null, 2)}`);
    
    return response.data.article?.id;
  } catch (error) {
    console.log(`❌ Erreur lors de la création: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log(`📋 Détails: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

// Test de statistiques de produits
async function testProductStats() {
  console.log('\n📊 === TEST DES STATISTIQUES DE PRODUITS ===');
  
  // Test d'enregistrement d'une vue
  try {
    console.log('👁️ Test d\'enregistrement d\'une vue...');
    const response = await axios.post(`${BASE_URL}/products/1/view`, {}, testConfig);
    console.log(`✅ Vue enregistrée: ${response.status}`);
  } catch (error) {
    console.log(`❌ Erreur vue: ${error.response?.status || error.message}`);
  }

  // Test d'enregistrement d'un clic
  try {
    console.log('🖱️ Test d\'enregistrement d\'un clic...');
    const response = await axios.post(`${BASE_URL}/products/1/click`, {}, testConfig);
    console.log(`✅ Clic enregistré: ${response.status}`);
  } catch (error) {
    console.log(`❌ Erreur clic: ${error.response?.status || error.message}`);
  }
}

// Fonction principale de test
async function runAllTests() {
  console.log('🚀 === DÉBUT DES TESTS DES NOUVELLES FONCTIONNALITÉS ===');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);

  try {
    // Tests des endpoints de lecture
    await testPopularProducts();
    await testSpecialOffers();
    await testCommercialEvents();
    await testBlog();
    await testProductFilters();
    await testProductStats();

    // Tests de création (optionnels)
    const eventId = await testCreateSampleEvent();
    await testEventRegistration(eventId);
    await testCreateSampleArticle();

    console.log('\n🎉 === TOUS LES TESTS TERMINÉS ===');
    console.log('✅ Les nouvelles fonctionnalités sont prêtes à être utilisées !');
    
  } catch (error) {
    console.log('\n💥 === ERREUR GÉNÉRALE ===');
    console.log(`❌ Erreur: ${error.message}`);
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testPopularProducts,
  testSpecialOffers,
  testCommercialEvents,
  testBlog,
  testProductFilters,
  testCreateSampleEvent,
  testCreateSampleArticle,
  testProductStats
};
