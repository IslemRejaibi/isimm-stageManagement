const Stage = require('../models/Stage');
const DocumentValidation = require('../models/DocumentValidation');
const path = require('path');
const fs = require('fs');

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/stages/:id/details
// Mettre à jour les détails structurés du stage
// ─────────────────────────────────────────────────────────────────────────────
exports.updateStageDetails = async (req, res) => {
  try {
    const { missionsPrevues, technologiesUtilisees, objectifsPedagogiques, competencesVisees, dureeEstimeeJours, taillEquipe } = req.body;

    const stage = await Stage.findById(req.params.id);
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

    // Mettre à jour les détails
    if (missionsPrevues) stage.detailsStage.missionsPrevues = missionsPrevues;
    if (technologiesUtilisees) stage.detailsStage.technologiesUtilisees = technologiesUtilisees;
    if (objectifsPedagogiques) stage.detailsStage.objectifsPedagogiques = objectifsPedagogiques;
    if (competencesVisees) stage.detailsStage.competencesVisees = competencesVisees;
    if (dureeEstimeeJours) stage.detailsStage.dureeEstimeeJours = dureeEstimeeJours;
    if (taillEquipe) stage.detailsStage.taillEquipe = taillEquipe;

    await stage.save();

    res.status(200).json({
      message: 'Détails du stage mis à jour',
      stage,
    });
  } catch (err) {
    console.error('Erreur PATCH /stages/:id/details :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/stages/:id/upload-letter
// Uploader la lettre de motivation
// Accessible : étudiant
// ─────────────────────────────────────────────────────────────────────────────
exports.uploadLetterMotivation = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    const stage = await Stage.findById(req.params.id);
    if (!stage) {
      return res.status(404).json({ message: 'Stage non trouvé' });
    }

    // Vérifier les permissions
    if (stage.etudiant.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Vérifier le format du fichier
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      // Supprimer le fichier
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Format de fichier non accepté. Utilisez PDF ou Word.' });
    }

    // Si une lettre existe déjà, supprimer l'ancienne
    if (stage.lettreMotivation.url) {
      const oldPath = path.join(__dirname, '..', stage.lettreMotivation.url);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Sauvegarder les infos du fichier
    stage.lettreMotivation = {
      url: `/uploads/motivation_letters/${req.file.filename}`,
      nomFichier: req.file.originalname,
      taille: req.file.size,
      dateDepot: new Date(),
      mimeType: req.file.mimetype,
    };

    await stage.save();

    res.status(200).json({
      message: 'Lettre de motivation uploaded avec succès',
      lettreMotivation: stage.lettreMotivation,
    });
  } catch (err) {
    console.error('Erreur POST /stages/:id/upload-letter :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/stages/:id/upload-convention
// Uploader la convention de stage
// Accessible : étudiant, admin
// ─────────────────────────────────────────────────────────────────────────────
exports.uploadConvention = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    const stage = await Stage.findById(req.params.id);
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

    // Vérifier le format
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Format de fichier non accepté. Utilisez PDF ou Word.' });
    }

    // Si une convention existe déjà, supprimer l'ancienne
    if (stage.convention.url) {
      const oldPath = path.join(__dirname, '..', stage.convention.url);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    stage.convention = {
      url: `/uploads/conventions/${req.file.filename}`,
      nomFichier: req.file.originalname,
      taille: req.file.size,
      dateDepot: new Date(),
      statut: 'deposee',
      signatureEtudiant: false,
      signatureEntreprise: false,
      signatureUniversite: false,
    };

    await stage.save();

    res.status(200).json({
      message: 'Convention uploaded avec succès',
      convention: stage.convention,
    });
  } catch (err) {
    console.error('Erreur POST /stages/:id/upload-convention :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/stage-enrichment/:id/upload-stage-document
// Uploader un rapport ou une attestation et créer un contrôle de validation
// Accessible : étudiant, admin
// ─────────────────────────────────────────────────────────────────────────────
exports.uploadStageDocument = async (req, res) => {
  try {
    const { typeDocument } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }
    if (!['rapport_stage', 'attestation_stage'].includes(typeDocument)) {
      return res.status(400).json({ message: 'Type de document invalide' });
    }

    const stage = await Stage.findById(req.params.id);
    if (!stage) {
      return res.status(404).json({ message: 'Stage non trouvé' });
    }

    if (req.user.role === 'etudiant' && stage.etudiant.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const url = `/uploads/stage-documents/${req.file.filename}`;
    if (typeDocument === 'rapport_stage') {
      stage.rapport = {
        url,
        nomFichier: req.file.originalname,
        taille: req.file.size,
        dateDepot: new Date(),
      };
    } else if (typeDocument === 'attestation_stage') {
      stage.attestation = {
        url,
        dateDepot: new Date(),
      };
    }

    await stage.save();

    const validation = new DocumentValidation({
      stage: stage._id,
      typeDocument,
      document: {
        url,
        nomFichier: req.file.originalname,
        taille: req.file.size,
        mimeType: req.file.mimetype,
      },
      soumisJointu: req.user.role === 'admin' ? 'admin' : 'etudiant',
      dateRemiseInitiale: new Date(),
      statut: 'soumis',
    });

    await validation.save();

    res.status(201).json({
      message: 'Document soumis et envoyé pour validation',
      stage,
      validation,
    });
  } catch (err) {
    console.error('Erreur POST /stage-enrichment/:id/upload-stage-document :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/stages/:id/convention/sign
// Signer la convention
// Accessible : étudiant, admin (pour autres rôles), ou tuteur
// ─────────────────────────────────────────────────────────────────────────────
exports.signConvention = async (req, res) => {
  try {
    const { role: signerRole } = req.body; // 'etudiant', 'entreprise', 'universite'

    const stage = await Stage.findById(req.params.id);
    if (!stage) {
      return res.status(404).json({ message: 'Stage non trouvé' });
    }

    if (!stage.convention.url) {
      return res.status(400).json({ message: 'Aucune convention uploadée pour ce stage' });
    }

    // Vérifier les permissions basées sur le signerRole
    if (signerRole === 'etudiant') {
      if (stage.etudiant.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès refusé' });
      }
      stage.convention.signatureEtudiant = true;
    } else if (signerRole === 'universite') {
      if (req.user.role !== 'admin' && req.user.role !== 'tuteur') {
        return res.status(403).json({ message: 'Seul l\'admin ou tuteur peut signer pour l\'université' });
      }
      stage.convention.signatureUniversite = true;
    } else if (signerRole === 'entreprise') {
      // Entreprise signe par le formulaire web ou par email
      stage.convention.signatureEntreprise = true;
    }

    // Si tous les signataires ont signé, marquer comme signée
    if (
      stage.convention.signatureEtudiant &&
      stage.convention.signatureEntreprise &&
      stage.convention.signatureUniversite
    ) {
      stage.convention.statut = 'signee';
      stage.convention.dateSignature = new Date();
    }

    await stage.save();

    res.status(200).json({
      message: 'Convention signée',
      convention: stage.convention,
    });
  } catch (err) {
    console.error('Erreur PATCH /stages/:id/convention/sign :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/stages/:id/summary
// Résumé complet du stage avec tous les détails enrichis
// ─────────────────────────────────────────────────────────────────────────────
exports.getEnrichedStageSummary = async (req, res) => {
  try {
    const stage = await Stage.findById(req.params.id)
      .populate('etudiant', 'nom prenom email numeroEtudiant specialite')
      .populate('tuteur', 'nom prenom email departement')
      .populate('commentaires.auteur', 'nom prenom role');

    if (!stage) {
      return res.status(404).json({ message: 'Stage non trouvé' });
    }

    // Vérifier les permissions
    if (
      req.user.role === 'etudiant' &&
      stage.etudiant._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const summary = {
      stage: stage,
      completion: {
        detailsRemplis: !!(stage.detailsStage.missionsPrevues && stage.detailsStage.objectifsPedagogiques),
        lettreMotivationUploaded: !!stage.lettreMotivation.url,
        conventionUploaded: !!stage.convention.url,
        conventionSignee: stage.convention.statut === 'signee',
        tuteurAsigne: !!stage.tuteur,
      },
      pourcentageCompletion: calculateCompletion(stage),
    };

    res.status(200).json(summary);
  } catch (err) {
    console.error('Erreur GET /stages/:id/summary :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Fonction utilitaire pour calculer le pourcentage de complétion
function calculateCompletion(stage) {
  let completedItems = 0;
  let totalItems = 0;

  // Champs essentiels
  const essentialFields = [
    stage.titre,
    stage.description,
    stage.dateDebut,
    stage.dateFin,
    stage.entreprise.nom,
  ];

  totalItems += essentialFields.length;
  completedItems += essentialFields.filter((f) => f).length;

  // Détails structurés
  totalItems += 2;
  if (stage.detailsStage.missionsPrevues) completedItems++;
  if (stage.detailsStage.objectifsPedagogiques) completedItems++;

  // Fichiers
  totalItems += 2;
  if (stage.lettreMotivation.url) completedItems++;
  if (stage.convention.url) completedItems++;

  // Tuteur
  totalItems += 1;
  if (stage.tuteur) completedItems++;

  return Math.round((completedItems / totalItems) * 100);
}
