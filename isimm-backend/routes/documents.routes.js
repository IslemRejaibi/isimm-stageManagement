const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth.middleware');
const Document = require('../models/Document');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', 'uploads', 'documents');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${timestamp}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Seuls les fichiers PDF sont autorisés'));
    }
    cb(null, true);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/documents
// Récupérer tous les documents de l'utilisateur
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const documents = await Document.find({ proprietaire: req.user.id, isArchived: false })
      .populate('stage', 'titre')
      .populate('pfe', 'titre')
      .sort({ createdAt: -1 });

    res.status(200).json({
      total: documents.length,
      documents,
    });
  } catch (err) {
    console.error('Erreur GET /documents :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/documents/upload
// Téléverser un document PDF
// Body: form-data { file, nom?, stageId?, pfeId?, categorie? }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Fichier PDF requis' });
    }

    const { nom, stageId, pfeId, categorie } = req.body;
    const url = `/uploads/documents/${req.file.filename}`;

    const document = await Document.create({
      nom: nom || req.file.originalname,
      url,
      nomFichier: req.file.originalname,
      taille: req.file.size,
      proprietaire: req.user.id,
      stage: stageId || null,
      pfe: pfeId || null,
      categorie: categorie || 'autre',
    });

    res.status(201).json({
      message: 'Fichier téléversé avec succès',
      document,
    });
  } catch (err) {
    console.error('Erreur POST /documents/upload :', err);
    res.status(500).json({ message: err.message || 'Erreur serveur' });
  }
});

module.exports = router;
