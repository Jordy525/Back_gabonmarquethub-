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

class SmartDatabaseMigration {
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

  async checkColumnExists(tableName, columnName) {
    const [rows] = await this.connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.columns 
      WHERE table_schema = ? AND table_name = ? AND column_name = ?
    `, [DB_CONFIG.database, tableName, columnName]);
    return rows[0].count > 0;
  }

  async checkTableExists(tableName) {
    const [rows] = await this.connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = ?
    `, [DB_CONFIG.database, tableName]);
    return rows[0].count > 0;
  }

  async checkIndexExists(tableName, indexName) {
    const [rows] = await this.connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.statistics 
      WHERE table_schema = ? AND table_name = ? AND index_name = ?
    `, [DB_CONFIG.database, tableName, indexName]);
    return rows[0].count > 0;
  }

  async checkConstraintExists(tableName, constraintName) {
    const [rows] = await this.connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.table_constraints 
      WHERE table_schema = ? AND table_name = ? AND constraint_name = ?
    `, [DB_CONFIG.database, tableName, constraintName]);
    return rows[0].count > 0;
  }

  async checkTriggerExists(triggerName) {
    const [rows] = await this.connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.triggers 
      WHERE trigger_schema = ? AND trigger_name = ?
    `, [DB_CONFIG.database, triggerName]);
    return rows[0].count > 0;
  }

  async checkViewExists(viewName) {
    const [rows] = await this.connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.views 
      WHERE table_schema = ? AND table_name = ?
    `, [DB_CONFIG.database, viewName]);
    return rows[0].count > 0;
  }

  async runMigration() {
    try {
      console.log('🚀 Démarrage de la migration intelligente...\n');

      // 1. Ajouter les colonnes manquantes à la table produits
      console.log('📊 Mise à jour de la table produits...');
      
      const columnsToAdd = [
        { name: 'prix_promo', sql: 'ADD COLUMN `prix_promo` DECIMAL(10,2) NULL DEFAULT NULL COMMENT \'Prix promotionnel\'' },
        { name: 'date_debut_promo', sql: 'ADD COLUMN `date_debut_promo` DATETIME NULL DEFAULT NULL COMMENT \'Date de début de la promotion\'' },
        { name: 'date_fin_promo', sql: 'ADD COLUMN `date_fin_promo` DATETIME NULL DEFAULT NULL COMMENT \'Date de fin de la promotion\'' },
        { name: 'pourcentage_reduction', sql: 'ADD COLUMN `pourcentage_reduction` DECIMAL(5,2) NULL DEFAULT NULL COMMENT \'Pourcentage de réduction\'' },
        { name: 'est_en_offre', sql: 'ADD COLUMN `est_en_offre` BOOLEAN DEFAULT FALSE COMMENT \'Indique si le produit est en offre\'' },
        { name: 'type_offre', sql: 'ADD COLUMN `type_offre` ENUM(\'reduction\', \'flash_sale\', \'bundle\', \'clearance\') NULL DEFAULT NULL COMMENT \'Type d\\\'offre\'' },
        { name: 'quantite_offre', sql: 'ADD COLUMN `quantite_offre` INT NULL DEFAULT NULL COMMENT \'Quantité disponible pour l\\\'offre\'' },
        { name: 'vues_30j', sql: 'ADD COLUMN `vues_30j` INT DEFAULT 0 COMMENT \'Nombre de vues sur les 30 derniers jours\'' },
        { name: 'ventes_30j', sql: 'ADD COLUMN `ventes_30j` INT DEFAULT 0 COMMENT \'Nombre de ventes sur les 30 derniers jours\'' },
        { name: 'score_popularite', sql: 'ADD COLUMN `score_popularite` DECIMAL(5,2) DEFAULT 0.00 COMMENT \'Score de popularité calculé\'' },
        { name: 'derniere_activite', sql: 'ADD COLUMN `derniere_activite` DATETIME NULL DEFAULT NULL COMMENT \'Dernière activité (vue, vente, etc.)\'' },
        { name: 'note_moyenne', sql: 'ADD COLUMN `note_moyenne` DECIMAL(3,2) DEFAULT 0.00 COMMENT \'Note moyenne des avis\'' },
        { name: 'nombre_avis', sql: 'ADD COLUMN `nombre_avis` INT DEFAULT 0 COMMENT \'Nombre total d\'avis\'' }
      ];

      for (const column of columnsToAdd) {
        const exists = await this.checkColumnExists('produits', column.name);
        if (!exists) {
          console.log(`   ➕ Ajout de la colonne ${column.name}...`);
          await this.connection.execute(`ALTER TABLE \`produits\` ${column.sql}`);
          console.log(`   ✅ Colonne ${column.name} ajoutée`);
        } else {
          console.log(`   ⚠️  Colonne ${column.name} existe déjà`);
        }
      }

      // 2. Créer les index manquants
      console.log('\n📇 Création des index...');
      
      const indexesToCreate = [
        { name: 'idx_produits_offres', sql: 'CREATE INDEX `idx_produits_offres` ON `produits` (`est_en_offre`, `date_fin_promo`)' },
        { name: 'idx_produits_popularite', sql: 'CREATE INDEX `idx_produits_popularite` ON `produits` (`score_popularite` DESC, `vues_30j` DESC)' },
        { name: 'idx_produits_activite', sql: 'CREATE INDEX `idx_produits_activite` ON `produits` (`derniere_activite` DESC)' },
        { name: 'idx_produits_ventes_30j', sql: 'CREATE INDEX `idx_produits_ventes_30j` ON `produits` (`ventes_30j` DESC)' }
      ];

      for (const index of indexesToCreate) {
        const exists = await this.checkIndexExists('produits', index.name);
        if (!exists) {
          console.log(`   ➕ Création de l'index ${index.name}...`);
          await this.connection.execute(index.sql);
          console.log(`   ✅ Index ${index.name} créé`);
        } else {
          console.log(`   ⚠️  Index ${index.name} existe déjà`);
        }
      }

      // 3. Créer les tables manquantes
      console.log('\n🗄️  Création des tables...');
      
      // Table statistiques_produits
      if (!(await this.checkTableExists('statistiques_produits'))) {
        console.log('   ➕ Création de la table statistiques_produits...');
        await this.connection.execute(`
          CREATE TABLE \`statistiques_produits\` (
            \`id\` INT PRIMARY KEY AUTO_INCREMENT,
            \`produit_id\` INT NOT NULL,
            \`date\` DATE NOT NULL,
            \`vues\` INT DEFAULT 0,
            \`clics\` INT DEFAULT 0,
            \`ajouts_favoris\` INT DEFAULT 0,
            \`partages\` INT DEFAULT 0,
            \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            UNIQUE KEY \`unique_produit_date\` (\`produit_id\`, \`date\`),
            INDEX \`idx_stats_produit\` (\`produit_id\`),
            INDEX \`idx_stats_date\` (\`date\`),
            
            FOREIGN KEY (\`produit_id\`) REFERENCES \`produits\`(\`id\`) ON DELETE CASCADE
          )
        `);
        console.log('   ✅ Table statistiques_produits créée');
      } else {
        console.log('   ⚠️  Table statistiques_produits existe déjà');
      }

      // Table vues_produits_detaillees
      if (!(await this.checkTableExists('vues_produits_detaillees'))) {
        console.log('   ➕ Création de la table vues_produits_detaillees...');
        await this.connection.execute(`
          CREATE TABLE \`vues_produits_detaillees\` (
            \`id\` INT PRIMARY KEY AUTO_INCREMENT,
            \`produit_id\` INT NOT NULL,
            \`utilisateur_id\` INT NULL,
            \`ip_address\` VARCHAR(45),
            \`user_agent\` TEXT,
            \`referrer\` VARCHAR(500),
            \`timestamp\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            INDEX \`idx_vues_produit\` (\`produit_id\`),
            INDEX \`idx_vues_utilisateur\` (\`utilisateur_id\`),
            INDEX \`idx_vues_timestamp\` (\`timestamp\`),
            
            FOREIGN KEY (\`produit_id\`) REFERENCES \`produits\`(\`id\`) ON DELETE CASCADE
          )
        `);
        console.log('   ✅ Table vues_produits_detaillees créée');
      } else {
        console.log('   ⚠️  Table vues_produits_detaillees existe déjà');
      }

      // Table reponses_avis
      if (!(await this.checkTableExists('reponses_avis'))) {
        console.log('   ➕ Création de la table reponses_avis...');
        await this.connection.execute(`
          CREATE TABLE \`reponses_avis\` (
            \`id\` INT PRIMARY KEY AUTO_INCREMENT,
            \`avis_id\` INT NOT NULL,
            \`fournisseur_id\` INT NOT NULL,
            \`reponse\` TEXT NOT NULL,
            \`date_reponse\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            INDEX \`idx_reponses_avis\` (\`avis_id\`),
            INDEX \`idx_reponses_fournisseur\` (\`fournisseur_id\`),
            
            FOREIGN KEY (\`avis_id\`) REFERENCES \`avis_produits\`(\`id\`) ON DELETE CASCADE
          )
        `);
        console.log('   ✅ Table reponses_avis créée');
      } else {
        console.log('   ⚠️  Table reponses_avis existe déjà');
      }

      // Table signalements_avis
      if (!(await this.checkTableExists('signalements_avis'))) {
        console.log('   ➕ Création de la table signalements_avis...');
        await this.connection.execute(`
          CREATE TABLE \`signalements_avis\` (
            \`id\` INT PRIMARY KEY AUTO_INCREMENT,
            \`avis_id\` INT NOT NULL,
            \`utilisateur_id\` INT NOT NULL,
            \`raison\` ENUM('inapproprié', 'spam', 'faux', 'autre') NOT NULL,
            \`description\` TEXT,
            \`date_signalement\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            \`statut\` ENUM('en_attente', 'traite', 'rejete') DEFAULT 'en_attente',
            
            INDEX \`idx_signalements_avis\` (\`avis_id\`),
            INDEX \`idx_signalements_utilisateur\` (\`utilisateur_id\`),
            
            FOREIGN KEY (\`avis_id\`) REFERENCES \`avis_produits\`(\`id\`) ON DELETE CASCADE
          )
        `);
        console.log('   ✅ Table signalements_avis créée');
      } else {
        console.log('   ⚠️  Table signalements_avis existe déjà');
      }

      // 4. Créer les triggers manquants
      console.log('\n⚡ Création des triggers...');
      
      if (!(await this.checkTriggerExists('tr_update_vues_produit'))) {
        console.log('   ➕ Création du trigger tr_update_vues_produit...');
        await this.connection.execute(`
          CREATE TRIGGER \`tr_update_vues_produit\` 
          AFTER INSERT ON \`statistiques_produits\`
          FOR EACH ROW
          BEGIN
            UPDATE \`produits\` 
            SET 
              \`vues_30j\` = (
                SELECT COALESCE(SUM(\`vues\`), 0) 
                FROM \`statistiques_produits\` 
                WHERE \`produit_id\` = NEW.\`produit_id\` 
                AND \`date\` >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
              ),
              \`derniere_activite\` = NOW()
            WHERE \`id\` = NEW.\`produit_id\`;
          END
        `);
        console.log('   ✅ Trigger tr_update_vues_produit créé');
      } else {
        console.log('   ⚠️  Trigger tr_update_vues_produit existe déjà');
      }

      if (!(await this.checkTriggerExists('tr_calculate_popularity_score'))) {
        console.log('   ➕ Création du trigger tr_calculate_popularity_score...');
        await this.connection.execute(`
          CREATE TRIGGER \`tr_calculate_popularity_score\`
          AFTER UPDATE ON \`produits\`
          FOR EACH ROW
          BEGIN
            IF NEW.\`vues_30j\` != OLD.\`vues_30j\` OR NEW.\`ventes_30j\` != OLD.\`ventes_30j\` THEN
              SET @score = (
                (NEW.\`vues_30j\` * 0.3) + 
                (NEW.\`ventes_30j\` * 0.7) + 
                (NEW.\`note_moyenne\` * 10) + 
                (NEW.\`nombre_avis\` * 0.5)
              );
              
              UPDATE \`produits\` 
              SET \`score_popularite\` = @score 
              WHERE \`id\` = NEW.\`id\`;
            END IF;
          END
        `);
        console.log('   ✅ Trigger tr_calculate_popularity_score créé');
      } else {
        console.log('   ⚠️  Trigger tr_calculate_popularity_score existe déjà');
      }

      // 5. Créer les vues manquantes
      console.log('\n👁️  Création des vues...');
      
      const viewsToCreate = [
        {
          name: 'vue_produits_en_offre',
          sql: `
            CREATE VIEW \`vue_produits_en_offre\` AS
            SELECT 
              p.*,
              e.nom_entreprise as fournisseur_nom,
              c.nom as categorie_nom,
              CASE 
                WHEN p.\`prix_promo\` IS NOT NULL THEN p.\`prix_promo\`
                ELSE p.\`prix_unitaire\`
              END as prix_final,
              CASE 
                WHEN p.\`prix_promo\` IS NOT NULL THEN 
                  ROUND(((p.\`prix_unitaire\` - p.\`prix_promo\`) / p.\`prix_unitaire\`) * 100, 2)
                ELSE 0
              END as pourcentage_economie,
              DATEDIFF(p.\`date_fin_promo\`, NOW()) as jours_restants
            FROM \`produits\` p
            LEFT JOIN \`entreprises\` e ON p.\`fournisseur_id\` = e.\`id\`
            LEFT JOIN \`categories\` c ON p.\`categorie_id\` = c.\`id\`
            WHERE p.\`est_en_offre\` = TRUE 
              AND p.\`date_fin_promo\` > NOW()
              AND p.\`statut\` = 'actif'
            ORDER BY p.\`pourcentage_reduction\` DESC, p.\`date_fin_promo\` ASC
          `
        },
        {
          name: 'vue_produits_populaires',
          sql: `
            CREATE VIEW \`vue_produits_populaires\` AS
            SELECT 
              p.*,
              e.nom_entreprise as fournisseur_nom,
              c.nom as categorie_nom,
              CASE 
                WHEN p.\`prix_promo\` IS NOT NULL AND p.\`date_fin_promo\` > NOW() THEN p.\`prix_promo\`
                ELSE p.\`prix_unitaire\`
              END as prix_final
            FROM \`produits\` p
            LEFT JOIN \`entreprises\` e ON p.\`fournisseur_id\` = e.\`id\`
            LEFT JOIN \`categories\` c ON p.\`categorie_id\` = c.\`id\`
            WHERE p.\`statut\` = 'actif'
              AND p.\`score_popularite\` > 0
            ORDER BY p.\`score_popularite\` DESC, p.\`vues_30j\` DESC
          `
        }
      ];

      for (const view of viewsToCreate) {
        const exists = await this.checkViewExists(view.name);
        if (!exists) {
          console.log(`   ➕ Création de la vue ${view.name}...`);
          await this.connection.execute(view.sql);
          console.log(`   ✅ Vue ${view.name} créée`);
        } else {
          console.log(`   ⚠️  Vue ${view.name} existe déjà`);
        }
      }

      console.log('\n🎉 Migration intelligente terminée avec succès !');
      
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
        AND table_name IN ('statistiques_produits', 'vues_produits_detaillees', 'reponses_avis', 'signalements_avis')
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
        AND table_name IN ('vue_produits_en_offre', 'vue_produits_populaires')
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
  const migration = new SmartDatabaseMigration();
  migration.run();
}

module.exports = SmartDatabaseMigration;
