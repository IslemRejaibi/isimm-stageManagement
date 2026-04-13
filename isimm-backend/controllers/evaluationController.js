const EvaluationForm = require('../models/EvaluationForm');
const Stage = require('../models/Stage');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/evaluations
// Créer une fiche d'évaluation
// Accessible : encadrant entreprise, tuteur universitaire, admin
// ─────────────────────────────────────────────────────────────────────────────
exports.createEvaluation = async (req, res) => {
  try {
    const { stageId, evaluateurType } = req.body;

    const stage = await Stage.findById(stageId);
    if (!stage) {
      return res.status(404).json({ message: 'Stage non trouvé' });
    }

    // Vérifier les permissions
    if (evaluateurType === 'tuteur_universitaire') {
      if (
        req.user.role === 'tuteur' &&
        stage.tuteur.toString() !== req.user.id
      ) {
        return res.status(403).json({ message: 'Vous n\'êtes pas tuteur de ce stage' });
      }
    }

    // Vérifier qu'une évaluation n'existe pas déjà
    const evalExistante = await EvaluationForm.findOne({
      stage: stageId,
      evaluateurType,
      evaluateur: req.user.id,
    });

    if (evalExistante) {
      return res.status(400).json({ message: 'Une évaluation existe déjà pour ce stage et cet évaluateur' });
    }

    const evaluation = new EvaluationForm({
      stage: stageId,
      evaluateurType,
      evaluateur: req.user.id,
      statut: 'brouillon',
    });

    await evaluation.save();
    res.status(201).json({
      message: 'Fiche d\'évaluation créée',
      evaluation,
    });
  } catch (err) {
    console.error('Erreur POST /evaluations :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/evaluations/:id
// Mettre à jour une fiche d'évaluation
// ─────────────────────────────────────────────────────────────────────────────
exports.updateEvaluation = async (req, res) => {
  try {
    const evaluation = await EvaluationForm.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: 'Évaluation non trouvée' });
    }

    // Vérifier les permissions
    if (evaluation.evaluateur.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Mettre à jour les critères
    const {
      competencesTechniques,
      autonomie,
      rigueur,
      capaciteCommunication,
      travailEnEquipe,
      qualiteTravail,
      progressionLearning,
      remarquesGenerales,
      pointsForts,
      axesAmelioration,
      recommandation,
    } = req.body;

    if (competencesTechniques) {
      evaluation.competencesTechniques = { ...evaluation.competencesTechniques, ...competencesTechniques };
    }
    if (autonomie) {
      evaluation.autonomie = { ...evaluation.autonomie, ...autonomie };
    }
    if (rigueur) {
      evaluation.rigueur = { ...evaluation.rigueur, ...rigueur };
    }
    if (capaciteCommunication) {
      evaluation.capaciteCommunication = { ...evaluation.capaciteCommunication, ...capaciteCommunication };
    }
    if (travailEnEquipe) {
      evaluation.travailEnEquipe = { ...evaluation.travailEnEquipe, ...travailEnEquipe };
    }
    if (qualiteTravail) {
      evaluation.qualiteTravail = { ...evaluation.qualiteTravail, ...qualiteTravail };
    }
    if (progressionLearning) {
      evaluation.progressionLearning = { ...evaluation.progressionLearning, ...progressionLearning };
    }

    if (remarquesGenerales) evaluation.remarquesGenerales = remarquesGenerales;
    if (pointsForts) evaluation.pointsForts = pointsForts;
    if (axesAmelioration) evaluation.axesAmelioration = axesAmelioration;
    if (recommandation) evaluation.recommandation = recommandation;

    await evaluation.save(); // Le middleware pré-save calculera la moyenne

    res.status(200).json({
      message: 'Évaluation mise à jour',
      evaluation,
    });
  } catch (err) {
    console.error('Erreur PATCH /evaluations/:id :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/evaluations/:id/submit
// Soumettre une évaluation
// ─────────────────────────────────────────────────────────────────────────────
exports.submitEvaluation = async (req, res) => {
  try {
    const evaluation = await EvaluationForm.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: 'Évaluation non trouvée' });
    }

    // Vérifier les permissions
    if (evaluation.evaluateur.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    if (evaluation.statut !== 'brouillon') {
      return res.status(400).json({ message: 'Seul un brouillon peut être soumis' });
    }

    // Vérifier que tous les critères sont remplis
    if (
      !evaluation.competencesTechniques.note ||
      !evaluation.autonomie.note ||
      !evaluation.rigueur.note ||
      !evaluation.capaciteCommunication.note ||
      !evaluation.travailEnEquipe.note ||
      !evaluation.qualiteTravail.note ||
      !evaluation.progressionLearning.note
    ) {
      return res.status(400).json({ message: 'Tous les critères doivent avoir une note' });
    }

    evaluation.statut = 'soumise';
    evaluation.dateRemise = new Date();
    await evaluation.save();

    res.status(200).json({
      message: 'Évaluation soumise',
      evaluation,
    });
  } catch (err) {
    console.error('Erreur PATCH /evaluations/:id/submit :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/evaluations?stageId=xxx
// Récupérer les évaluations d'un stage
// ─────────────────────────────────────────────────────────────────────────────
exports.getEvaluations = async (req, res) => {
  try {
    const { stageId, evaluateurType } = req.query;

    const stage = await Stage.findById(stageId);
    if (!stage) {
      return res.status(404).json({ message: 'Stage non trouvé' });
    }

    const filter = { stage: stageId };
    if (evaluateurType) filter.evaluateurType = evaluateurType;

    const evals = await EvaluationForm.find(filter)
      .populate('evaluateur', 'nom prenom email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      total: evals.length,
      evaluations: evals,
    });
  } catch (err) {
    console.error('Erreur GET /evaluations :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/evaluations/:id
// Récupérer une évaluation spécifique
// ─────────────────────────────────────────────────────────────────────────────
exports.getEvaluationById = async (req, res) => {
  try {
    const evaluation = await EvaluationForm.findById(req.params.id)
      .populate('stage', 'titre etudiant')
      .populate('evaluateur', 'nom prenom email role');

    if (!evaluation) {
      return res.status(404).json({ message: 'Évaluation non trouvée' });
    }

    res.status(200).json({ evaluation });
  } catch (err) {
    console.error('Erreur GET /evaluations/:id :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
