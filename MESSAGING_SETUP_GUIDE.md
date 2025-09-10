# 🚀 Guide de démarrage rapide - Système de messagerie

## 📋 Prérequis

- Node.js 16+ installé
- MySQL 8.0+ installé et configuré
- Base de données `gabon_trade_hub` créée
- Tables `conversations` et `messages` existantes

## 🔧 Configuration

### 1. Variables d'environnement

Créez un fichier `.env` dans le dossier `Backend_Ecommerce` :

```bash
# Configuration du serveur
NODE_ENV=development
PORT=3000

# Configuration de la base de données
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gabon_trade_hub
DB_USER=root
DB_PASSWORD=votre_mot_de_passe

# Configuration JWT
JWT_SECRET=votre_secret_jwt_tres_securise_ici
JWT_EXPIRES_IN=24h

# Configuration Socket.IO
FRONTEND_URL=http://localhost:5173
```

### 2. Installation des dépendances

```bash
cd Backend_Ecommerce
npm install
```

## 🚀 Démarrage

### 1. Démarrer le serveur

```bash
npm start
```

Le serveur démarre sur `http://localhost:3000`

### 2. Vérifier le système

```bash
node scripts/test-messaging-system.js
```

## 📱 Test du frontend

### 1. Démarrer le frontend

```bash
cd ../gabon-trade-hub
npm run dev
```

Le frontend démarre sur `http://localhost:5173`

### 2. Tester la messagerie

1. Connectez-vous avec un compte utilisateur
2. Allez dans la section messagerie
3. Créez une nouvelle conversation
4. Envoyez des messages
5. Vérifiez les notifications en temps réel

## 🔌 Fonctionnalités Socket.IO

### Événements disponibles

- `conversation:join` - Rejoindre une conversation
- `conversation:leave` - Quitter une conversation
- `typing:start` - Démarrer la frappe
- `typing:stop` - Arrêter la frappe
- `message:new` - Nouveau message
- `messages:read` - Messages marqués comme lus
- `message:deleted` - Message supprimé

### Authentification

Les connexions Socket.IO nécessitent un token JWT valide :

```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'votre_token_jwt' }
});
```

## 📊 Structure de la base de données

### Table `conversations`

```sql
CREATE TABLE `conversations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `acheteur_id` int(11) NOT NULL,
  `fournisseur_id` int(11) NOT NULL,
  `produit_id` int(11) DEFAULT NULL,
  `sujet` varchar(255) DEFAULT NULL,
  `statut` enum('ouverte','fermee') DEFAULT 'ouverte',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `derniere_activite` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `messages_non_lus_acheteur` int(11) DEFAULT 0,
  `messages_non_lus_fournisseur` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
);
```

### Table `messages`

```sql
CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conversation_id` int(11) NOT NULL,
  `expediteur_id` int(11) NOT NULL,
  `contenu` text NOT NULL,
  `lu` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `type` enum('texte','image','fichier','systeme') DEFAULT 'texte',
  `fichier_url` varchar(500) DEFAULT NULL,
  `fichier_nom` varchar(255) DEFAULT NULL,
  `fichier_taille` int(11) DEFAULT NULL,
  `fichier_type` varchar(100) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);
```

## 🛠️ API Endpoints

### Conversations

- `GET /api/conversations` - Liste des conversations
- `POST /api/conversations` - Créer une conversation

### Messages

- `GET /api/conversations/:id/messages` - Récupérer les messages
- `POST /api/conversations/:id/messages` - Envoyer un message
- `POST /api/conversations/:id/messages/read` - Marquer comme lu
- `DELETE /api/conversations/:id/messages/:messageId` - Supprimer un message

## 🔍 Dépannage

### Problèmes courants

1. **Erreur de connexion à la base de données**
   - Vérifiez les variables d'environnement
   - Assurez-vous que MySQL est démarré

2. **Erreur Socket.IO**
   - Vérifiez que le serveur est démarré
   - Vérifiez la configuration CORS

3. **Messages non reçus en temps réel**
   - Vérifiez la connexion Socket.IO
   - Vérifiez l'authentification JWT

### Logs

Les logs sont disponibles dans la console du serveur et dans le dossier `logs/`.

## 📚 Ressources supplémentaires

- [Documentation Socket.IO](https://socket.io/docs/)
- [Documentation MySQL2](https://github.com/sidorares/node-mysql2)
- [Documentation Express](https://expressjs.com/)

## 🆘 Support

En cas de problème :

1. Vérifiez les logs du serveur
2. Exécutez le script de test
3. Vérifiez la configuration de la base de données
4. Consultez la documentation des composants

---

**🎉 Votre système de messagerie est maintenant prêt à l'utilisation !**
