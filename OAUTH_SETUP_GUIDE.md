# Guide de configuration OAuth - GabonMarketHub

## URLs de redirection à configurer

### Google OAuth Console
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet
3. Allez dans "APIs & Services" > "Credentials"
4. Cliquez sur votre OAuth 2.0 Client ID
5. Dans "Authorized redirect URIs", ajoutez :
   ```
   https://back-gabonmarquethub.onrender.com/auth/google/callback
   ```

### Facebook OAuth Console
1. Allez sur [Facebook Developers](https://developers.facebook.com/)
2. Sélectionnez votre application
3. Allez dans "Facebook Login" > "Settings"
4. Dans "Valid OAuth Redirect URIs", ajoutez :
   ```
   https://back-gabonmarquethub.onrender.com/auth/facebook/callback
   ```

## Variables d'environnement sur Render

Assurez-vous que ces variables sont configurées dans votre dashboard Render :

```
GOOGLE_CLIENT_ID=votre-google-client-id
GOOGLE_CLIENT_SECRET=votre-google-client-secret
GOOGLE_CALLBACK_URL=https://back-gabonmarquethub.onrender.com/auth/google/callback

FACEBOOK_APP_ID=votre-facebook-app-id
FACEBOOK_APP_SECRET=votre-facebook-app-secret
FACEBOOK_CALLBACK_URL=https://back-gabonmarquethub.onrender.com/auth/facebook/callback

API_BASE_URL=https://back-gabonmarquethub.onrender.com
FRONTEND_URL=https://front-gabonmarkethub1.vercel.app
```

## Test des URLs

Après configuration, testez ces URLs :
- **Google** : https://back-gabonmarquethub.onrender.com/auth/google
- **Facebook** : https://back-gabonmarquethub.onrender.com/auth/facebook
- **Configuration** : https://back-gabonmarquethub.onrender.com/api/oauth-config

## Erreurs courantes et solutions

### Facebook : "URL Blocked"
- **Cause** : L'URI de redirection n'est pas dans la whitelist
- **Solution** : Ajouter `https://back-gabonmarquethub.onrender.com/auth/facebook/callback` dans les Valid OAuth Redirect URIs

### Google : "Missing required parameter: scope"
- **Cause** : Le scope n'est pas défini dans la stratégie
- **Solution** : ✅ Corrigé dans le code (scope ajouté)

### Erreur 500 sur les callbacks
- **Cause** : Variables d'environnement manquantes
- **Solution** : Vérifier que toutes les variables OAuth sont définies sur Render
