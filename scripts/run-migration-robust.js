const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration de la base de données
const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
};

class RobustDatabaseMigration {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      this.connection = await mysql.createConnection(DB_CONFIG);
      console.log('✅ Connexion à la base de données réussie');
    } catch (error) {
      console.error('❌ Erreur de connexion à la base de données:', error.message);
      throw error;
    }
  }

  parseSQLFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const queries = [];
    let currentQuery = '';
    let inDelimiter = false;
    let delimiter = ';';
    
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Ignorer les commentaires
      if (line.startsWith('--') || line === '') {
        continue;
      }
      
      // Gérer les délimiteurs
      if (line.startsWith('DELIMITER')) {
        const parts = line.split(' ');
        if (parts.length > 1) {
          delimiter = parts[1];
          inDelimiter = true;
        }
        continue;
      }
      
      // Ajouter la ligne à la requête courante
      currentQuery += line + '\n';
      
      // Vérifier si on a atteint le délimiteur
      if (line.endsWith(delimiter)) {
        // Retirer le délimiteur de la fin
        const query = currentQuery.replace(new RegExp(delimiter + '$'), '').trim();
        if (query.length > 0) {
          queries.push(query);
        }
        currentQuery = '';
        inDelimiter = false;
        delimiter = ';';
      }
    }
    
    // Ajouter la dernière requête si elle existe
    if (currentQuery.trim().length > 0) {
      queries.push(currentQuery.trim());
    }
    
    return queries;
  }

  async runMigration() {
    try {
      console.log('🚀 Démarrage de la migration...\n');

      // Lire le fichier de migration
      const migrationPath = path.join(__dirname, '..', 'migrations', 'update_products_table_for_offers.sql');
      
      if (!fs.existsSync(migrationPath)) {
        throw new Error('Fichier de migration non trouvé');
      }

      const queries = this.parseSQLFile(migrationPath);
      console.log(`📝 ${queries.length} requêtes à exécuter\n`);

      // Exécuter chaque requête
      for (let i = 0; i < queries.length; i++) {
        const query = queries[i];
        
        if (query.trim()) {
          try {
            console.log(`⏳ Exécution de la requête ${i + 1}/${queries.length}...`);
            console.log(`   ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`);
            
            await this.connection.execute(query);
            console.log(`✅ Requête ${i + 1} exécutée avec succès`);
          } catch (error) {
            // Ignorer certaines erreurs communes
            if (error.code === 'ER_DUP_FIELDNAME' || 
                error.code === 'ER_DUP_KEYNAME' || 
                error.code === 'ER_TABLE_EXISTS_ERROR' ||
                error.code === 'ER_DUP_ENTRY' ||
                error.code === 'ER_TRG_ALREADY_EXISTS') {
              console.log(`⚠️  Requête ${i + 1} ignorée (déjà existant): ${error.message}`);
            } else {
              console.error(`❌ Erreur requête ${i + 1}: ${error.message}`);
              console.error(`   Requête: ${query.substring(0, 200)}...`);
              throw error;
            }
          }
        }
      }

      console.log('\n🎉 Migration terminée avec succès !');
      
    } catch (error) {
      console.error('💥 Erreur lors de la migration:', error.message);
      throw error;
    }
  }

  async verifyMigration() {
    try {
      console.log('\n🔍 Vérification de la migration...\n');

      // Vérifier les nouvelles colonnes dans la table produits
      const [columns] = await this.connection.execute(`
        SELECT COLUMN_NAME 
        FROM information_schema.columns 
        WHERE table_schema = ? AND table_name = 'produits' 
        AND column_name IN ('vues_30j', 'score_popularite', 'note_moyenne', 'prix_promo', 'est_en_offre')
      `, [DB_CONFIG.database]);

      console.log('📊 Nouvelles colonnes dans la table produits:');
      columns.forEach(col => {
        console.log(`   ✅ ${col.COLUMN_NAME}`);
      });

      // Vérifier les nouvelles tables
      const [tables] = await this.connection.execute(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = ? 
        AND table_name IN ('statistiques_produits', 'vues_produits_detaillees', 'reponses_avis', 'signalements_avis', 'evenements_commerciaux', 'articles_blog')
      `, [DB_CONFIG.database]);

      console.log('\n🗄️  Nouvelles tables créées:');
      tables.forEach(table => {
        console.log(`   ✅ ${table.table_name}`);
      });

      // Vérifier les triggers
      const [triggers] = await this.connection.execute(`
        SELECT TRIGGER_NAME 
        FROM information_schema.triggers 
        WHERE TRIGGER_SCHEMA = ? 
        AND TRIGGER_NAME IN ('tr_update_vues_produit', 'tr_calculate_popularity_score')
      `, [DB_CONFIG.database]);

      console.log('\n⚡ Triggers créés:');
      triggers.forEach(trigger => {
        console.log(`   ✅ ${trigger.TRIGGER_NAME}`);
      });

      // Vérifier les vues
      const [views] = await this.connection.execute(`
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = ? 
        AND table_name IN ('vue_produits_en_offre', 'vue_produits_populaires', 'vue_evenements_a_venir', 'vue_articles_a_la_une')
      `, [DB_CONFIG.database]);

      console.log('\n👁️  Vues créées:');
      views.forEach(view => {
        console.log(`   ✅ ${view.table_name}`);
      });

      console.log('\n✅ Vérification terminée avec succès !');

    } catch (error) {
      console.error('❌ Erreur lors de la vérification:', error.message);
      throw error;
    }
  }

  async insertSampleData() {
    try {
      console.log('\n📝 Insertion de données d\'exemple...\n');

      // Insérer quelques statistiques d'exemple
      const today = new Date().toISOString().split('T')[0];
      
      await this.connection.execute(`
        INSERT IGNORE INTO statistiques_produits (produit_id, date, vues, clics, ajouts_favoris, partages)
        VALUES 
        (1, ?, 25, 8, 3, 1),
        (2, ?, 18, 5, 2, 0),
        (3, ?, 32, 12, 5, 2)
      `, [today, today, today]);

      console.log('✅ Données d\'exemple insérées');

    } catch (error) {
      console.log('⚠️  Impossible d\'insérer les données d\'exemple:', error.message);
    }
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
      console.log('🔌 Connexion fermée');
    }
  }

  async run() {
    try {
      await this.connect();
      await this.runMigration();
      await this.verifyMigration();
      await this.insertSampleData();
      
      console.log('\n🎉 MIGRATION COMPLÈTE TERMINÉE !');
      console.log('\n📋 PROCHAINES ÉTAPES:');
      console.log('   1. Démarrer le serveur backend: npm start');
      console.log('   2. Tester les nouvelles fonctionnalités');
      console.log('   3. Exécuter les tests: node scripts/test-analytics-system.js');
      
    } catch (error) {
      console.error('💥 Migration échouée:', error.message);
      process.exit(1);
    } finally {
      await this.close();
    }
  }
}

// Exécution de la migration
if (require.main === module) {
  const migration = new RobustDatabaseMigration();
  migration.run();
}

module.exports = RobustDatabaseMigration;


