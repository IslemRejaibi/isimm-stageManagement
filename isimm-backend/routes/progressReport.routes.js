const express = require('express');
const router = express.Router();
const {
  createProgressReport,
  submitProgressReport,
  getProgressReports,
  addTuteurComment,
  deleteProgressReport,
} = require('../controllers/progressReportController');
const { auth, autoriser } = require('../middleware/auth.middleware');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/progress-reports
// Créer un rapport d'avancement
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', auth, autoriser('etudiant', 'admin'), createProgressReport);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/progress-reports/:id/submit
// Soumettre un rapport
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/submit', auth, submitProgressReport);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/progress-reports?stageId=xxx
// Récupérer les rapports d'un stage
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', auth, getProgressReports);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/progress-reports/:id/comment-tuteur
// Ajouter un commentaire du tuteur
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/comment-tuteur', auth, autoriser('tuteur', 'admin'), addTuteurComment);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/progress-reports/:id
// Supprimer un rapport
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', auth, deleteProgressReport);

module.exports = router;
