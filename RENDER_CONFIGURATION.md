# Configuration Render pour GabonMarketHub

## Variables d'environnement requises

Pour que l'authentification OAuth fonctionne, vous devez configurer ces variables d'environnement dans votre dashboard Render :

### 1. Variables de base de données (déjà configurées)
```
DB_HOST=mysql-zigh-portfolio.alwaysdata.net
DB_USER=404304
DB_PASSWORD=Campement@2024
DB_NAME=zigh-portfolio_gabmarkethub
DB_PORT=3306
```

### 2. Variables API (déjà configurées)
```
API_BASE_URL=https://back-gabonmarquethub.onrender.com
FRONTEND_URL=https://front-gabonmarkethub1.vercel.app
NODE_ENV=production
```

### 3. Variables JWT (déjà configurées)
```
JWT_SECRET=votre-secret-jwt-super-securise
JWT_EXPIRES_IN=24h
```

### 4. Variables OAuth (À CONFIGURER)
```
GOOGLE_CLIENT_ID=votre-google-client-id
GOOGLE_CLIENT_SECRET=votre-google-client-secret
GOOGLE_CALLBACK_URL=https://back-gabonmarquethub.onrender.com/auth/google/callback

FACEBOOK_APP_ID=votre-facebook-app-id
FACEBOOK_APP_SECRET=votre-facebook-app-secret
FACEBOOK_CALLBACK_URL=https://back-gabonmarquethub.onrender.com/auth/facebook/callback
```

### 5. Variables CORS (déjà configurées)
```
CORS_ORIGIN=https://front-gabonmarkethub1.vercel.app,https://gabon-trade-hub.vercel.app
```

## Configuration des consoles OAuth

### Google OAuth Console
1. Allez sur https://console.developers.google.com/
2. Créez un projet ou sélectionnez un projet existant
3. Activez l'API Google+ et l'API Gmail
4. Créez des identifiants OAuth 2.0
5. Configurez les URI de redirection autorisées :
   - `https://back-gabonmarquethub.onrender.com/auth/google/callback`
6. Copiez le Client ID et Client Secret dans les variables d'environnement

### Facebook OAuth Console
1. Allez sur https://developers.facebook.com/
2. Créez une nouvelle application
3. Ajoutez le produit "Connexion Facebook"
4. Configurez les URI de redirection OAuth valides :
   - `https://back-gabonmarquethub.onrender.com/auth/facebook/callback`
5. Copiez l'ID de l'application et la clé secrète dans les variables d'environnement

## Test de la configuration

Une fois les variables configurées, vous pouvez tester la configuration en visitant :
- `https://back-gabonmarquethub.onrender.com/api/oauth-config`

Cette route vous montrera l'état de configuration de toutes les variables OAuth.

## URLs de test OAuth

Après configuration, testez ces URLs :
- Google : `https://back-gabonmarquethub.onrender.com/auth/google`
- Facebook : `https://back-gabonmarquethub.onrender.com/auth/facebook`

## Dépannage

Si les redirections OAuth ne fonctionnent pas :
1. Vérifiez que toutes les variables d'environnement sont définies
2. Vérifiez que les URLs de callback dans les consoles OAuth correspondent exactement
3. Vérifiez les logs du serveur pour les erreurs
4. Testez la route `/api/oauth-config` pour voir l'état de la configuration
