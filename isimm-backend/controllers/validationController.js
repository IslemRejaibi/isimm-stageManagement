const ValidationAttestation = require('../models/ValidationAttestation');
const EvaluationForm = require('../models/EvaluationForm');
const DocumentValidation = require('../models/DocumentValidation');
const Stage = require('../models/Stage');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/validations/auto-check
// Vérifier automatiquement les critères de validation et créer l'attestation
// Accessible : admin
// ─────────────────────────────────────────────────────────────────────────────
exports.autoCheckValidation = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : admin seulement' });
    }

    const { stageId } = req.body;
    const stage = await Stage.findById(stageId);

    if (!stage) {
      return res.status(404).json({ message: 'Stage non trouvé' });
    }

    // Vérifier les 4 critères
    const noteMinimale = stage.note && stage.note >= 10 ? true : false;

    // Vérifier les documents
    const docsApprouves = await DocumentValidation.countDocuments({
      stage: stageId,
      statut: 'approuve',
    });
    const documentsComplets = docsApprouves >= 2 ? true : false; // Au moins rapport + attestation

    // Vérifier les évaluations
    const evalsSubmises = await EvaluationForm.countDocuments({
      stage: stageId,
      statut: 'soumise',
    });
    const evaluationsTerminees = evalsSubmises >= 2 ? true : false; // Au moins tuteur + entreprise

    const tuteurAsigne = stage.tuteur !== null ? true : false;

    // Calculer la note finale (moyenne des 2 évaluations)
    const evals = await EvaluationForm.find({
      stage: stageId,
      statut: 'soumise',
    });

    const noteFinale =
      evals.length > 0
        ? (evals.reduce((sum, e) => sum + (e.noteMoyenne || 0), 0) / evals.length).toFixed(2)
        : stage.note;

    // Déterminer la mention
    let mention = 'Passable';
    if (noteFinale >= 16) mention = 'Très Bien';
    else if (noteFinale >= 14) mention = 'Bien';
    else if (noteFinale >= 12) mention = 'Assez Bien';

    // Crédits ECTS basé sur la durée du stage
    const dateDebut = new Date(stage.dateDebut);
    const dateFin = new Date(stage.dateFin);
    const durationDays = Math.ceil((dateFin - dateDebut) / (1000 * 60 * 60 * 24));
    const creditsECTS = Math.ceil(durationDays / 30) * 3; // 3 ECTS par mois

    const criteres = {
      noteMinimale: {
        required: true,
        atteinte: noteMinimale,
      },
      documentsComplets: {
        required: true,
        atteinte: documentsComplets,
      },
      evaluationsTerminees: {
        required: true,
        atteinte: evaluationsTerminees,
      },
      tuteurAsigne: {
        required: true,
        atteinte: tuteurAsigne,
      },
    };

    // Déterminer le statut final
    const tousLesCriteresSatisfaits = Object.values(criteres).every((c) => c.atteinte);
    const statut = tousLesCriteresSatisfaits ? 'valide' : 'en_attente';

    // Vérifier s'une attestation existe déjà
    let attestation = await ValidationAttestation.findOne({ stage: stageId });

    if (!attestation) {
      attestation = new ValidationAttestation({
        stage: stageId,
        etudiant: stage.etudiant,
        noteFinale: parseFloat(noteFinale),
        creditsECTS,
        mention,
        statut,
        criteres,
        validePar: req.user.id,
      });
    } else {
      attestation.noteFinale = parseFloat(noteFinale);
      attestation.creditsECTS = creditsECTS;
      attestation.mention = mention;
      attestation.statut = statut;
      attestation.criteres = criteres;
      attestation.validePar = req.user.id;
    }

    await attestation.save();

    // Mettre à jour le stage
    stage.note = parseFloat(noteFinale);
    stage.mention = mention;
    stage.statut = statut === 'valide' ? 'validé' : 'en_attente';
    await stage.save();

    res.status(200).json({
      message: 'Vérification de validation complétée',
      attestation,
      criteres,
    });
  } catch (err) {
    console.error('Erreur POST /validations/auto-check :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/validations/:id/approve
// Approuver la validation et générer l'attestation
// Accessible : admin
// ─────────────────────────────────────────────────────────────────────────────
exports.approveValidation = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const attestation = await ValidationAttestation.findById(req.params.id);
    if (!attestation) {
      return res.status(404).json({ message: 'Attestation non trouvée' });
    }

    attestation.statut = 'valide';
    attestation.dateValidation = new Date();
    attestation.validePar = req.user.id;

    // Générer l'attestation (placeholders)
    attestation.attestation = {
      nomFichier: `attestation_validation_${attestation.stage}_${new Date().getTime()}.pdf`,
      genereeDate: new Date(),
      signature: 'Digital signature placeholder',
    };

    await attestation.save();

    // Mettre à jour le stage
    const stage = await Stage.findById(attestation.stage);
    stage.statut = 'validé';
    await stage.save();

    res.status(200).json({
      message: 'Validation approuvée et attestation générée',
      attestation,
    });
  } catch (err) {
    console.error('Erreur PATCH /validations/:id/approve :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/validations/:id/reject
// Rejeter la validation
// Accessible : admin
// ─────────────────────────────────────────────────────────────────────────────
exports.rejectValidation = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { raisonRejet } = req.body;
    const attestation = await ValidationAttestation.findById(req.params.id);

    if (!attestation) {
      return res.status(404).json({ message: 'Attestation non trouvée' });
    }

    attestation.statut = 'rejete';
    attestation.raisonRejet = raisonRejet;
    attestation.dateValidation = new Date();

    await attestation.save();

    res.status(200).json({
      message: 'Validation rejetée',
      attestation,
    });
  } catch (err) {
    console.error('Erreur PATCH /validations/:id/reject :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/validations/:stageId
// Récupérer l'attestation de validation d'un stage
// ─────────────────────────────────────────────────────────────────────────────
exports.getValidationAttestation = async (req, res) => {
  try {
    const { stageId } = req.params;

    const attestation = await ValidationAttestation.findOne({ stage: stageId })
      .populate('etudiant', 'nom prenom email numeroEtudiant')
      .populate('stage', 'titre dateDebut dateFin')
      .populate('validePar', 'nom prenom email');

    if (!attestation) {
      return res.status(404).json({ message: 'Aucune validation trouvée pour ce stage' });
    }

    res.status(200).json({ attestation });
  } catch (err) {
    console.error('Erreur GET /validations/:stageId :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/validations/pending/all
// Récupérer toutes les validations en attente
// Accessible : admin
// ─────────────────────────────────────────────────────────────────────────────
exports.getPendingValidations = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const attestations = await ValidationAttestation.find({ statut: 'en_attente' })
      .populate('etudiant', 'nom prenom email numeroEtudiant specialite')
      .populate('stage', 'titre dateDebut dateFin type')
      .sort({ createdAt: 1 });

    res.status(200).json({
      total: attestations.length,
      validations: attestations,
    });
  } catch (err) {
    console.error('Erreur GET /validations/pending/all :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
