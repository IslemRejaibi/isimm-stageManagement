const express = require('express');
const router = express.Router();
const {
  createDocumentValidation,
  approveDocument,
  rejectDocument,
  getDocumentValidations,
  getPendingDocuments,
} = require('../controllers/documentValidationController');
const { auth, autoriser } = require('../middleware/auth.middleware');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/document-validations
// Créer une validation de document
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', auth, createDocumentValidation);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/document-validations/:id/approve
// Approuver un document
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/approve', auth, autoriser('admin', 'tuteur'), approveDocument);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/document-validations/:id/reject
// Rejeter un document
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/reject', auth, autoriser('admin', 'tuteur'), rejectDocument);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/document-validations?stageId=xxx&statut=soumis
// Récupérer les validations de documents
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', auth, getDocumentValidations);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/document-validations/admin/pending
// Récupérer tous les documents en attente (admin)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/admin/pending', auth, autoriser('admin'), getPendingDocuments);

module.exports = router;
