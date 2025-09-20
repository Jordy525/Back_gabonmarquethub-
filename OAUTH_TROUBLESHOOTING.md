# Guide de dépannage OAuth - GabonMarketHub

## Problèmes identifiés et solutions

### 1. Google OAuth : "Error 400: redirect_uri_mismatch"

**Problème** : L'URI de redirection dans Google Console ne correspond pas à celle utilisée par l'application.

**Solution** :
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet
3. Allez dans "APIs & Services" > "Credentials"
4. Cliquez sur votre OAuth 2.0 Client ID
5. Dans "Authorized redirect URIs", ajoutez EXACTEMENT :
   ```
   https://back-gabonmarquethub.onrender.com/auth/google/callback
   ```
6. Sauvegardez les modifications

### 2. Facebook OAuth : Redirection vers la page de connexion

**Problème** : L'URI de redirection Facebook n'est pas correctement configurée ou l'utilisateur n'est pas correctement traité.

**Solution** :
1. Allez sur [Facebook Developers](https://developers.facebook.com/)
2. Sélectionnez votre application
3. Allez dans "Facebook Login" > "Settings"
4. Dans "Valid OAuth Redirect URIs", ajoutez EXACTEMENT :
   ```
   https://back-gabonmarquethub.onrender.com/auth/facebook/callback
   ```
5. Sauvegardez les modifications

## URLs de test

Testez ces URLs après configuration :

### Google OAuth
- **URL d'authentification** : `https://back-gabonmarquethub.onrender.com/auth/google`
- **URL de callback** : `https://back-gabonmarquethub.onrender.com/auth/google/callback`

### Facebook OAuth
- **URL d'authentification** : `https://back-gabonmarquethub.onrender.com/auth/facebook`
- **URL de callback** : `https://back-gabonmarquethub.onrender.com/auth/facebook/callback`

### Configuration
- **URL de diagnostic** : `https://back-gabonmarquethub.onrender.com/api/oauth-config`

## Vérification des variables d'environnement

Assurez-vous que ces variables sont configurées sur Render :

```
API_BASE_URL=https://back-gabonmarquethub.onrender.com
FRONTEND_URL=https://front-gabonmarkethub1.vercel.app
GOOGLE_CLIENT_ID=votre-google-client-id
GOOGLE_CLIENT_SECRET=votre-google-client-secret
GOOGLE_CALLBACK_URL=https://back-gabonmarquethub.onrender.com/auth/google/callback
FACEBOOK_APP_ID=votre-facebook-app-id
FACEBOOK_APP_SECRET=votre-facebook-app-secret
FACEBOOK_CALLBACK_URL=https://back-gabonmarquethub.onrender.com/auth/facebook/callback
```

## Logs de debug

Après configuration, vous devriez voir dans les logs :
```
🔍 Tentative de connexion Google OAuth
🔧 Configuration Google: { clientId: 'Défini', clientSecret: 'Défini', callbackUrl: 'https://back-gabonmarquethub.onrender.com/auth/google/callback', frontendUrl: 'https://front-gabonmarkethub1.vercel.app' }
🌐 URL de redirection Google: https://back-gabonmarquethub.onrender.com/auth/google/callback
```

## Erreurs courantes

### "redirect_uri_mismatch"
- **Cause** : L'URI dans la console OAuth ne correspond pas exactement
- **Solution** : Vérifiez que l'URI est exactement `https://back-gabonmarquethub.onrender.com/auth/google/callback`

### Redirection vers la page de connexion Facebook
- **Cause** : Problème de configuration ou d'utilisateur
- **Solution** : Vérifiez les logs du callback Facebook pour voir l'erreur exacte

### "Invalid client"
- **Cause** : Client ID ou Secret incorrect
- **Solution** : Vérifiez les variables d'environnement sur Render
