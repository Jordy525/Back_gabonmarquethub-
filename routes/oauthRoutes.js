const express = require('express');
const passport = require('passport');
const router = express.Router();
const config = require('../config/environment');
const oauthService = require('../services/oauthService');

// Route pour l'authentification Google
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

// Callback Google
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: config.FRONTEND.URL + config.REDIRECT.OAUTH_ERROR 
  }),
  async (req, res) => {
    try {
      const user = req.user;
      const token = oauthService.generateToken(user);
      
      // Rediriger vers le frontend avec le token
      const frontendUrl = config.FRONTEND.URL;
      const userData = encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role_id: user.role_id,
        photo_profil: user.photo_profil
      }));
      
      // Rediriger directement vers le dashboard selon le rôle
      let dashboardUrl = '/';
      if (user.role_id === 1) {
        dashboardUrl = config.REDIRECT.ADMIN_DASHBOARD;
      } else if (user.role_id === 2) {
        dashboardUrl = config.REDIRECT.SUPPLIER_DASHBOARD;
      } else {
        dashboardUrl = config.REDIRECT.DASHBOARD;
      }
      
      res.redirect(`${frontendUrl}${dashboardUrl}?token=${token}&user=${userData}`);
    } catch (error) {
      console.error('Erreur callback Google:', error);
      res.redirect(config.FRONTEND.URL + config.REDIRECT.OAUTH_ERROR + '&error=oauth_error');
    }
  }
);

// Route pour l'authentification Facebook
router.get('/facebook',
  passport.authenticate('facebook', { 
    scope: ['email'] 
  })
);

// Callback Facebook
router.get('/facebook/callback',
  passport.authenticate('facebook', { 
    failureRedirect: config.FRONTEND.URL + config.REDIRECT.OAUTH_ERROR 
  }),
  async (req, res) => {
    try {
      const user = req.user;
      const token = oauthService.generateToken(user);
      
      // Rediriger vers le frontend avec le token
      const frontendUrl = config.FRONTEND.URL;
      const userData = encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role_id: user.role_id,
        photo_profil: user.photo_profil
      }));
      
      // Rediriger directement vers le dashboard selon le rôle
      let dashboardUrl = '/';
      if (user.role_id === 1) {
        dashboardUrl = config.REDIRECT.ADMIN_DASHBOARD;
      } else if (user.role_id === 2) {
        dashboardUrl = config.REDIRECT.SUPPLIER_DASHBOARD;
      } else {
        dashboardUrl = config.REDIRECT.DASHBOARD;
      }
      
      res.redirect(`${frontendUrl}${dashboardUrl}?token=${token}&user=${userData}`);
    } catch (error) {
      console.error('Erreur callback Facebook:', error);
      res.redirect(config.FRONTEND.URL + config.REDIRECT.OAUTH_ERROR + '&error=oauth_error');
    }
  }
);

// Route de déconnexion
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors de la déconnexion' });
    }
    res.json({ message: 'Déconnexion réussie' });
  });
});

// Route pour obtenir les informations de l'utilisateur connecté
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      user: req.user,
      isAuthenticated: true
    });
  } else {
    res.json({
      user: null,
      isAuthenticated: false
    });
  }
});

module.exports = router;
