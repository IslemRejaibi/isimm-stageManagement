const express = require('express');
const router = express.Router();
const {
  autoCheckValidation,
  approveValidation,
  rejectValidation,
  getValidationAttestation,
  getPendingValidations,
} = require('../controllers/validationController');
const { auth, autoriser } = require('../middleware/auth.middleware');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/validations/auto-check
// Vérifier automatiquement et créer l'attestation
// ─────────────────────────────────────────────────────────────────────────────
router.post('/auto-check', auth, autoriser('admin'), autoCheckValidation);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/validations/:id/approve
// Approuver la validation
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/approve', auth, autoriser('admin'), approveValidation);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/validations/:id/reject
// Rejeter la validation
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/reject', auth, autoriser('admin'), rejectValidation);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/validations/:stageId
// Récupérer l'attestation de validation
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:stageId', auth, getValidationAttestation);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/validations/pending/all
// Récupérer toutes les validations en attente
// ─────────────────────────────────────────────────────────────────────────────
router.get('/pending/all', auth, autoriser('admin'), getPendingValidations);

module.exports = router;
