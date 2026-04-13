const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  updateStageDetails,
  uploadLetterMotivation,
  uploadConvention,
  signConvention,
  getEnrichedStageSummary,
} = require('../controllers/stageEnrichmentController');
const { auth, autoriser } = require('../middleware/auth.middleware');

// ─────────────────────────────────────────────────────────────────────────────
// Configuration de multer pour les uploads
// ─────────────────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Déterminer le dossier selon le type de fichier
    let folder = 'uploads/documents/';
    if (req.path.includes('letter')) {
      folder = 'uploads/motivation_letters/';
    } else if (req.path.includes('convention')) {
      folder = 'uploads/conventions/';
    }

    // Créer le répertoire s'il n'existe pas
    const fs = require('fs');
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accepter uniquement PDF et documents Word
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non accepté. Utilisez PDF ou Word.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/stage-enrichment/:id/details
// Mettre à jour les détails structurés
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/details', auth, updateStageDetails);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/stage-enrichment/:id/upload-letter
// Uploader la lettre de motivation
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/upload-letter', auth, upload.single('file'), uploadLetterMotivation);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/stage-enrichment/:id/upload-convention
// Uploader la convention de stage
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/upload-convention', auth, upload.single('file'), uploadConvention);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/stage-enrichment/:id/convention/sign
// Signer la convention
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/convention/sign', auth, signConvention);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/stage-enrichment/:id/summary
// Résumé complet du stage enrichi
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/summary', auth, getEnrichedStageSummary);

module.exports = router;
