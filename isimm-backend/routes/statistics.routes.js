const express = require('express');
const router = express.Router();
const {
  generateStatistics,
  getStatistics,
  getAllStatistics,
} = require('../controllers/statisticsController');
const { auth, autoriser } = require('../middleware/auth.middleware');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/statistics/generate
// Générer les statistiques pour une année
// ─────────────────────────────────────────────────────────────────────────────
router.post('/generate', auth, autoriser('admin'), generateStatistics);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/statistics/:anneeUniversitaire
// Récupérer les statistiques d'une année
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:anneeUniversitaire', auth, autoriser('admin'), getStatistics);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/statistics/all
// Récupérer toutes les statistiques
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', auth, autoriser('admin'), getAllStatistics);

module.exports = router;
