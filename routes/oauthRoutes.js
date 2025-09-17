const express = require('express');
const passport = require('passport');
const router = express.Router();

// Route pour l'authentification Google
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

// Callback Google
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Redirection après connexion réussie
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
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
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    // Redirection après connexion réussie
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
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
