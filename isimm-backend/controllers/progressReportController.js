const ProgressReport = require('../models/ProgressReport');
const Stage = require('../models/Stage');
const User = require('../models/User');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/progress-reports
// Créer/soumettre un rapport d'avancement
// Accessible : étudiant (crée pour son stage), tuteur (valide), admin
// ─────────────────────────────────────────────────────────────────────────────
exports.createProgressReport = async (req, res) => {
  try {
    const { stageId, semaine, tachesRealises, difficultesRencontrees, tachesPreves, observations } = req.body;

    // Vérifier que le stage existe
    const stage = await Stage.findById(stageId);
    if (!stage) {
      return res.status(404).json({ message: 'Stage non trouvé' });
    }

    // Vérifier les permissions
    if (
      req.user.role === 'etudiant' &&
      stage.etudiant.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Accès refusé : ce n\'est pas votre stage' });
    }

    // Vérifier qu'un rapport n'existe pas déjà pour cette semaine
    const rapportExistant = await ProgressReport.findOne({
      stage: stageId,
      semaine,
    });
    if (rapportExistant) {
      return res.status(400).json({ message: `Un rapport existe déjà pour la semaine ${semaine}` });
    }

    const rapportData = {
      stage: stageId,
      semaine,
      tachesRealises,
      difficultesRencontrees,
      tachesPreves,
      observations,
      auteur: req.user.id,
      dateRemisePrevu: new Date(), // ou calculé depuis les dates du stage
      statut: 'brouillon',
    };

    const rapport = new ProgressReport(rapportData);
    await rapport.save();

    await rapport.populate('auteur', 'nom prenom email');
    await rapport.populate('stage', 'titre etudiant tuteur');

    res.status(201).json({
      message: 'Rapport d\'avancement créé avec succès',
      rapport,
    });
  } catch (err) {
    console.error('Erreur POST /progress-reports :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/progress-reports/:id/submit
// Soumettre un rapport (passer de brouillon à soumis)
// ─────────────────────────────────────────────────────────────────────────────
exports.submitProgressReport = async (req, res) => {
  try {
    const rapport = await ProgressReport.findById(req.params.id);
    if (!rapport) {
      return res.status(404).json({ message: 'Rapport non trouvé' });
    }

    // Vérifier les permissions
    if (rapport.auteur.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    if (rapport.statut !== 'brouillon') {
      return res.status(400).json({ message: 'Le rapport ne peut être soumis que depuis le brouillon' });
    }

    rapport.statut = 'soumis';
    rapport.dateRemiseReel = new Date();
    await rapport.save();

    res.status(200).json({
      message: 'Rapport soumis avec succès',
      rapport,
    });
  } catch (err) {
    console.error('Erreur PATCH /progress-reports/:id/submit :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/progress-reports?stageId=xxx
// Récupérer les rapports d'un stage
// ─────────────────────────────────────────────────────────────────────────────
exports.getProgressReports = async (req, res) => {
  try {
    const { stageId } = req.query;

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

    const rapports = await ProgressReport.find({ stage: stageId })
      .populate('auteur', 'nom prenom email')
      .sort({ semaine: 1 });

    res.status(200).json({
      total: rapports.length,
      rapports,
    });
  } catch (err) {
    console.error('Erreur GET /progress-reports :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/progress-reports/:id/comment-tuteur
// Ajouter un commentaire du tuteur
// Accessible : tuteur du stage, admin
// ─────────────────────────────────────────────────────────────────────────────
exports.addTuteurComment = async (req, res) => {
  try {
    const { texte } = req.body;
    const rapport = await ProgressReport.findById(req.params.id).populate('stage');

    if (!rapport) {
      return res.status(404).json({ message: 'Rapport non trouvé' });
    }

    // Vérifier que l'utilisateur est tuteur de ce stage
    if (
      req.user.role === 'tuteur' &&
      rapport.stage.tuteur.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Accès refusé : vous n\'êtes pas tuteur de ce stage' });
    }

    rapport.commentaireTuteur = {
      texte,
      date: new Date(),
    };

    rapport.statut = 'vu_tuteur';
    await rapport.save();

    res.status(200).json({
      message: 'Commentaire du tuteur ajouté',
      rapport,
    });
  } catch (err) {
    console.error('Erreur PATCH /progress-reports/:id/comment-tuteur :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/progress-reports/:id
// Supprimer un rapport (seulement si brouillon)
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteProgressReport = async (req, res) => {
  try {
    const rapport = await ProgressReport.findById(req.params.id);
    if (!rapport) {
      return res.status(404).json({ message: 'Rapport non trouvé' });
    }

    // Vérifier les permissions
    if (
      rapport.auteur.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    if (rapport.statut !== 'brouillon') {
      return res.status(400).json({ message: 'Seuls les brouillons peuvent être supprimés' });
    }

    await ProgressReport.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Rapport supprimé' });
  } catch (err) {
    console.error('Erreur DELETE /progress-reports/:id :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
