const express = require('express');
const { authenticateToken, requireAdmin } = require('./middleware/auth');
const router = express.Router();

// Route de test simple
router.get('/test', authenticateToken, requireAdmin, (req, res) => {
    res.json({ message: 'Route admin notifications fonctionne !' });
});

module.exports = router;
