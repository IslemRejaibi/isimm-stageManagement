const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const {
  updatePFEDetails,
  scheduleSoutenance,
  uploadReport,
  uploadPresentation,
  evaluateSoutenance,
  getPFESummary,
} = require('../controllers/pfeEnrichmentController');
const { auth, autoriser } = require('../middleware/auth.middleware');

// ─────────────────────────────────────────────────────────────────────────────
// Configuration de multer
// ─────────────────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/pfe/reports/';
    if (req.path.includes('presentation')) {
      folder = 'uploads/pfe/presentations/';
    }

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (req.path.includes('presentation')) {
      // PowerPoint et PDF permis
      const allowedMimes = ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/pdf'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Seul PowerPoint et PDF sont acceptés'));
      }
    } else {
      // PDF pour les rapports
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Seul PDF est accepté'));
      }
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB pour les rapports volumineux
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/pfe-enrichment/:id/details
// Mettre à jour les détails du PFE
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/details', auth, updatePFEDetails);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/pfe-enrichment/:id/soutenance/schedule
// Planifier la soutenance
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/soutenance/schedule', auth, autoriser('admin', 'enseignant'), scheduleSoutenance);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pfe-enrichment/:id/upload-report
// Uploader un rapport
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/upload-report', auth, upload.single('file'), uploadReport);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pfe-enrichment/:id/upload-presentation
// Uploader la présentation
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/upload-presentation', auth, upload.single('file'), uploadPresentation);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/pfe-enrichment/:id/evaluation
// Évaluer la soutenance
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/evaluation', auth, autoriser('admin', 'enseignant'), evaluateSoutenance);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/pfe-enrichment/:id/summary
// Résumé du PFE
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/summary', auth, getPFESummary);

module.exports = router;
