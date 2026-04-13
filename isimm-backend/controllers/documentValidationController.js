const DocumentValidation = require('../models/DocumentValidation');
const Stage = require('../models/Stage');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/document-validations
// Créer une validation de document
// Accessible : étudiant, tuteur, admin
// ─────────────────────────────────────────────────────────────────────────────
exports.createDocumentValidation = async (req, res) => {
  try {
    const { stageId, typeDocument, documentUrl, nomFichier, mimeType, soumisJointu } = req.body;

    const stage = await Stage.findById(stageId);
    if (!stage) {
      return res.status(404).json({ message: 'Stage non trouvé' });
    }

    // Vérifier les permissions
    if (
      req.user.role === 'etudiant' &&
      stage.etudiant.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const docValidation = new DocumentValidation({
      stage: stageId,
      typeDocument,
      document: {
        url: documentUrl,
        nomFichier,
        mimeType: mimeType || 'application/pdf',
      },
      soumisJointu,
      dateRemiseInitiale: new Date(),
      statut: 'soumis',
    });

    await docValidation.save();
    await docValidation.populate('stage', 'titre etudiant');

    res.status(201).json({
      message: 'Document soumis pour validation',
      document: docValidation,
    });
  } catch (err) {
    console.error('Erreur POST /document-validations :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/document-validations/:id/approve
// Approuver un document
// Accessible : admin, tuteur
// ─────────────────────────────────────────────────────────────────────────────
exports.approveDocument = async (req, res) => {
  try {
    const { commentaire } = req.body;
    const docValidation = await DocumentValidation.findById(req.params.id);

    if (!docValidation) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'tuteur') {
      return res.status(403).json({ message: 'Accès refusé : seul l\'admin ou tuteur peut approuver' });
    }

    docValidation.statut = 'approuve';
    docValidation.validationPar = req.user.id;
    docValidation.dateValidation = new Date();
    if (commentaire) {
      docValidation.commentaireValidation = {
        texte: commentaire,
        date: new Date(),
      };
    }

    await docValidation.save();
    await docValidation.populate('validationPar', 'nom prenom email');

    res.status(200).json({
      message: 'Document approuvé',
      document: docValidation,
    });
  } catch (err) {
    console.error('Erreur PATCH /document-validations/:id/approve :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/document-validations/:id/reject
// Rejeter un document
// Accessible : admin, tuteur
// ─────────────────────────────────────────────────────────────────────────────
exports.rejectDocument = async (req, res) => {
  try {
    const { raisonRejet, commentaire } = req.body;
    const docValidation = await DocumentValidation.findById(req.params.id);

    if (!docValidation) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'tuteur') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    docValidation.statut = 'rejete';
    docValidation.raisonRejet = raisonRejet;
    docValidation.validationPar = req.user.id;
    docValidation.dateValidation = new Date();
    docValidation.tentatives += 1;

    if (commentaire) {
      docValidation.commentaireValidation = {
        texte: commentaire,
        date: new Date(),
      };
    }

    await docValidation.save();

    res.status(200).json({
      message: 'Document rejeté',
      document: docValidation,
    });
  } catch (err) {
    console.error('Erreur PATCH /document-validations/:id/reject :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/document-validations?stageId=xxx
// Récupérer les validations de documents d'un stage
// ─────────────────────────────────────────────────────────────────────────────
exports.getDocumentValidations = async (req, res) => {
  try {
    const { stageId, statut } = req.query;

    const stage = await Stage.findById(stageId);
    if (!stage) {
      return res.status(404).json({ message: 'Stage non trouvé' });
    }

    const filter = { stage: stageId };
    if (statut) filter.statut = statut;

    const docs = await DocumentValidation.find(filter)
      .populate('validationPar', 'nom prenom email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      total: docs.length,
      documents: docs,
    });
  } catch (err) {
    console.error('Erreur GET /document-validations :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/document-validations/admin/pending
// Récupérer tous les documents en attente de validation (admin)
// ─────────────────────────────────────────────────────────────────────────────
exports.getPendingDocuments = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : admin seulement' });
    }

    const docs = await DocumentValidation.find({ statut: { $in: ['soumis', 'en_examen'] } })
      .populate('stage', 'titre etudiant')
      .populate('stage.etudiant', 'nom prenom email numeroEtudiant')
      .sort({ createdAt: 1 });

    res.status(200).json({
      total: docs.length,
      documents: docs,
    });
  } catch (err) {
    console.error('Erreur GET /document-validations/admin/pending :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
