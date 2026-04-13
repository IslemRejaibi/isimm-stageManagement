const PFE = require('../models/PFE');
const path = require('path');
const fs = require('fs');

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/pfe/:id/details
// Mettre à jour les détails structurés du PFE
// ─────────────────────────────────────────────────────────────────────────────
exports.updatePFEDetails = async (req, res) => {
  try {
    const { domaine, objectifsGeneraux, objectifsPedagogiques, technologiesUtilisees, methodologie, resultatAttendu, livrables } = req.body;

    const pfe = await PFE.findById(req.params.id);
    if (!pfe) {
      return res.status(404).json({ message: 'PFE non trouvé' });
    }

    // Vérifier les permissions
    if (
      req.user.role === 'etudiant' &&
      pfe.etudiant.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Mettre à jour
    if (domaine) pfe.detailsProjet.domaine = domaine;
    if (objectifsGeneraux) pfe.detailsProjet.objectifsGeneraux = objectifsGeneraux;
    if (objectifsPedagogiques) pfe.detailsProjet.objectifsPedagogiques = objectifsPedagogiques;
    if (technologiesUtilisees) pfe.detailsProjet.technologiesUtilisees = technologiesUtilisees;
    if (methodologie) pfe.detailsProjet.methodologie = methodologie;
    if (resultatAttendu) pfe.detailsProjet.resultatAttendu = resultatAttendu;
    if (livrables) pfe.detailsProjet.livrables = livrables;

    await pfe.save();

    res.status(200).json({
      message: 'Détails du PFE mis à jour',
      pfe,
    });
  } catch (err) {
    console.error('Erreur PATCH /pfe/:id/details :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/pfe/:id/soutenance/schedule
// Planifier la soutenance
// ─────────────────────────────────────────────────────────────────────────────
exports.scheduleSoutenance = async (req, res) => {
  try {
    const { dateSoutenance, lieuSoutenance, salleNum, heureSoutenance, dureeEstimee, urlVisio, commentairesOrganisation } = req.body;

    const pfe = await PFE.findById(req.params.id);
    if (!pfe) {
      return res.status(404).json({ message: 'PFE non trouvé' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'enseignant') {
      return res.status(403).json({ message: 'Accès refusé : seul admin ou enseignant peut planifier' });
    }

    // Mettre à jour les infos de soutenance
    pfe.soutenance.dateSoutenance = new Date(dateSoutenance);
    pfe.soutenance.lieuSoutenance = lieuSoutenance;
    pfe.soutenance.salleNum = salleNum;
    pfe.soutenance.heureSoutenance = heureSoutenance;
    if (dureeEstimee) pfe.soutenance.dureeEstimee = dureeEstimee;
    if (urlVisio) pfe.soutenance.urlVisio = urlVisio;
    if (commentairesOrganisation) pfe.soutenance.commentairesOrganisation = commentairesOrganisation;
    pfe.soutenance.statut = 'planifiee';

    await pfe.save();

    res.status(200).json({
      message: 'Soutenance planifiée',
      soutenance: pfe.soutenance,
    });
  } catch (err) {
    console.error('Erreur PATCH /pfe/:id/soutenance/schedule :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pfe/:id/upload-report
// Uploader un rapport (intermédiaire ou final)
// ─────────────────────────────────────────────────────────────────────────────
exports.uploadReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    const { typeRapport } = req.body; // 'intermediaire' ou 'final'

    const pfe = await PFE.findById(req.params.id);
    if (!pfe) {
      return res.status(404).json({ message: 'PFE non trouvé' });
    }

    // Vérifier les permissions
    if (
      req.user.role === 'etudiant' &&
      pfe.etudiant.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Vérifier le format
    if (req.file.mimetype !== 'application/pdf') {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Seul les fichiers PDF sont acceptés' });
    }

    const reportType = typeRapport === 'intermediaire' ? 'rapportIntermediaire' : 'rapportFinal';
    const oldReport = pfe[reportType];

    // Supprimer l'ancien rapport s'il existe
    if (oldReport && oldReport.url) {
      const oldPath = path.join(__dirname, '..', oldReport.url);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Sauvegarder le nouveau rapport
    pfe[reportType] = {
      url: `/uploads/pfe/reports/${req.file.filename}`,
      nomFichier: req.file.originalname,
      taille: req.file.size,
      dateDepot: new Date(),
      statut: 'depose',
    };

    await pfe.save();

    res.status(200).json({
      message: `Rapport ${typeRapport} uploaded`,
      rapport: pfe[reportType],
    });
  } catch (err) {
    console.error('Erreur POST /pfe/:id/upload-report :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pfe/:id/upload-presentation
// Uploader la présentation PowerPoint
// ─────────────────────────────────────────────────────────────────────────────
exports.uploadPresentation = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    const pfe = await PFE.findById(req.params.id);
    if (!pfe) {
      return res.status(404).json({ message: 'PFE non trouvé' });
    }

    // Vérifier les permissions
    if (
      req.user.role === 'etudiant' &&
      pfe.etudiant.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Vérifier le format (PowerPoint ou PDF)
    const allowedMimes = ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/pdf'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Format accepté : PowerPoint ou PDF' });
    }

    // Supprimer l'ancienne présentation si elle existe
    if (pfe.presentation && pfe.presentation.url) {
      const oldPath = path.join(__dirname, '..', pfe.presentation.url);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    pfe.presentation = {
      url: `/uploads/pfe/presentations/${req.file.filename}`,
      nomFichier: req.file.originalname,
      dateDepot: new Date(),
    };

    await pfe.save();

    res.status(200).json({
      message: 'Présentation uploadée',
      presentation: pfe.presentation,
    });
  } catch (err) {
    console.error('Erreur POST /pfe/:id/upload-presentation :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/pfe/:id/evaluation
// Évaluer la soutenance
// ─────────────────────────────────────────────────────────────────────────────
exports.evaluateSoutenance = async (req, res) => {
  try {
    const {
      clartePresentation,
      qualiteTechnique,
      innovationOriginalite,
      reponseQuestions,
      autonomieRigueur,
      pointsForts,
      axesAmelioration,
      recommandation,
      feedbackJury,
    } = req.body;

    const pfe = await PFE.findById(req.params.id);
    if (!pfe) {
      return res.status(404).json({ message: 'PFE non trouvé' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'enseignant') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Mettre à jour l'évaluation
    if (clartePresentation) pfe.evaluationSoutenance.clartePresentation = clartePresentation;
    if (qualiteTechnique) pfe.evaluationSoutenance.qualiteTechnique = qualiteTechnique;
    if (innovationOriginalite) pfe.evaluationSoutenance.innovationOriginalite = innovationOriginalite;
    if (reponseQuestions) pfe.evaluationSoutenance.reponseQuestions = reponseQuestions;
    if (autonomieRigueur) pfe.evaluationSoutenance.autonomieRigueur = autonomieRigueur;
    if (pointsForts) pfe.evaluationSoutenance.pointsForts = pointsForts;
    if (axesAmelioration) pfe.evaluationSoutenance.axesAmelioration = axesAmelioration;
    if (recommandation) pfe.evaluationSoutenance.recommandation = recommandation;
    if (feedbackJury) pfe.evaluationSoutenance.feedbackJury = feedbackJury;

    // Calculer la note moyenne
    const notes = [
      clartePresentation?.note,
      qualiteTechnique?.note,
      innovationOriginalite?.note,
      reponseQuestions?.note,
      autonomieRigueur?.note,
    ].filter(n => n !== null && n !== undefined);

    if (notes.length > 0) {
      pfe.evaluationSoutenance.note = (notes.reduce((a, b) => a + b) / notes.length).toFixed(2);
      pfe.note = parseFloat(pfe.evaluationSoutenance.note);

      // Calculer la mention
      if (pfe.note >= 18) pfe.mention = 'Excellent';
      else if (pfe.note >= 16) pfe.mention = 'Très bien';
      else if (pfe.note >= 14) pfe.mention = 'Bien';
      else if (pfe.note >= 12) pfe.mention = 'Assez bien';
      else if (pfe.note >= 10) pfe.mention = 'Passable';
    }

    pfe.evaluationSoutenance.dateEvaluation = new Date();
    pfe.evaluationSoutenance.evaluePar = req.user.id;

    // Déterminer le statut final basé sur la recommandation
    if (recommandation === 'valide' || recommandation === 'valide_mention') {
      pfe.statut = 'validé';
      pfe.creditsECTS = 12; // Crédits standards pour PFE
    } else if (recommandation === 'valide_conditions') {
      pfe.statut = 'validé';
      pfe.creditsECTS = 12;
    }

    await pfe.save();

    res.status(200).json({
      message: 'Évaluation de soutenance enregistrée',
      evaluation: pfe.evaluationSoutenance,
      note: pfe.note,
      mention: pfe.mention,
      statut: pfe.statut,
    });
  } catch (err) {
    console.error('Erreur PATCH /pfe/:id/evaluation :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/pfe/:id/summary
// Résumé complet du PFE
// ─────────────────────────────────────────────────────────────────────────────
exports.getPFESummary = async (req, res) => {
  try {
    const pfe = await PFE.findById(req.params.id)
      .populate('etudiant', 'nom prenom email numeroEtudiant specialite')
      .populate('encadrant', 'nom prenom email departement')
      .populate('jury', 'nom prenom email')
      .populate('evaluationSoutenance.evaluePar', 'nom prenom email');

    if (!pfe) {
      return res.status(404).json({ message: 'PFE non trouvé' });
    }

    // Vérifier les permissions
    if (
      req.user.role === 'etudiant' &&
      pfe.etudiant._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    res.status(200).json({
      pfe,
      completionStatus: {
        detailsRemplis: !!(pfe.detailsProjet.objectifsGeneraux && pfe.detailsProjet.objectifsPedagogiques),
        rapportIntermediaireDepose: !!pfe.rapportIntermediaire.url,
        rapportFinalDepose: !!pfe.rapportFinal.url,
        presentationReady: !!pfe.presentation.url,
        soutenancePlanifiee: pfe.soutenance.statut === 'planifiee',
        evalueeExectuee: !!pfe.evaluationSoutenance.note,
      },
    });
  } catch (err) {
    console.error('Erreur GET /pfe/:id/summary :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
