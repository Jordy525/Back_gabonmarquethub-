#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 === LANCEMENT DES TESTS DES NOUVELLES FONCTIONNALITÉS ===\n');

// Vérifier que le serveur est démarré
async function checkServerStatus() {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    if (response.ok) {
      console.log('✅ Serveur backend accessible');
      return true;
    }
  } catch (error) {
    console.log('❌ Serveur backend non accessible');
    console.log('💡 Assurez-vous que le serveur est démarré avec: npm run dev');
    return false;
  }
}

// Lancer les tests
async function runTests() {
  const serverRunning = await checkServerStatus();
  
  if (!serverRunning) {
    console.log('\n🛑 Impossible de lancer les tests sans serveur backend');
    process.exit(1);
  }

  console.log('\n🧪 Lancement des tests...\n');

  const testScript = path.join(__dirname, 'test-new-features.js');
  
  const child = spawn('node', [testScript], {
    stdio: 'inherit',
    cwd: __dirname
  });

  child.on('close', (code) => {
    if (code === 0) {
      console.log('\n🎉 Tous les tests sont terminés avec succès !');
    } else {
      console.log(`\n❌ Les tests se sont terminés avec le code d'erreur: ${code}`);
    }
    process.exit(code);
  });

  child.on('error', (error) => {
    console.error('❌ Erreur lors du lancement des tests:', error);
    process.exit(1);
  });
}

// Gestion des signaux
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt des tests...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt des tests...');
  process.exit(0);
});

// Lancer les tests
runTests().catch(console.error);
