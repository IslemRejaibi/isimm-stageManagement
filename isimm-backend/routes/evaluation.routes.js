const express = require('express');
const router = express.Router();
const {
  createEvaluation,
  updateEvaluation,
  submitEvaluation,
  getEvaluations,
  getEvaluationById,
} = require('../controllers/evaluationController');
const { auth, autoriser } = require('../middleware/auth.middleware');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/evaluations
// Créer une fiche d'évaluation
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', auth, createEvaluation);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/evaluations/:id
// Mettre à jour une fiche d'évaluation
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id', auth, updateEvaluation);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/evaluations/:id/submit
// Soumettre une évaluation
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/submit', auth, submitEvaluation);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/evaluations?stageId=xxx&evaluateurType=tuteur_universitaire
// Récupérer les évaluations d'un stage
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', auth, getEvaluations);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/evaluations/:id
// Récupérer une évaluation spécifique
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', auth, getEvaluationById);

module.exports = router;
