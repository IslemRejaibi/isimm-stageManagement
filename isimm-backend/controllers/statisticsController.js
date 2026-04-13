const StageStatistics = require('../models/StageStatistics');
const Stage = require('../models/Stage');
const User = require('../models/User');
const EvaluationForm = require('../models/EvaluationForm');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/statistics/generate
// Générer les statistiques pour une année universitaire
// Accessible : admin
// ─────────────────────────────────────────────────────────────────────────────
exports.generateStatistics = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : admin seulement' });
    }

    const { anneeUniversitaire } = req.body;

    // Récupérer tous les stages de l'année
    const stages = await Stage.find({ anneeUniversitaire, isArchived: false })
      .populate('etudiant', 'nom prenom specialite')
      .populate('tuteur', 'nom prenom email')
      .populate('commentaires.auteur', 'nom prenom');

    if (stages.length === 0) {
      return res.status(400).json({
        message: `Aucun stage trouvé pour l'année ${anneeUniversitaire}`,
      });
    }

    // ─── Calcul des totaux ────────────────────────────────────────────────
    const totalStages = stages.length;
    const stagesValides = stages.filter((s) => s.statut === 'validé').length;
    const stagesRefuses = stages.filter((s) => s.statut === 'refusé').length;
    const stagesEnCours = stages.filter((s) => s.statut === 'en_cours').length;

    // ─── Taux de validation par spécialité ────────────────────────────────
    const specialites = ['GL', 'RS', 'IIA', 'GE', 'GM', 'GC'];
    const parSpecialite = specialites.map((spec) => {
      const stagesSpec = stages.filter((s) => s.specialite === spec);
      const stagesSpecValides = stagesSpec.filter((s) => s.statut === 'validé').length;
      const notesSpec = stagesSpec.filter((s) => s.note).map((s) => s.note);
      const noteMoyenne = notesSpec.length > 0 ? (notesSpec.reduce((a, b) => a + b) / notesSpec.length).toFixed(2) : 0;

      // Durée moyenne
      const dureMins = stagesSpec.map((s) => {
        const debut = new Date(s.dateDebut);
        const fin = new Date(s.dateFin);
        return Math.ceil((fin - debut) / (1000 * 60 * 60 * 24));
      });
      const dureeMovenneJours = dureMins.length > 0 ? (dureMins.reduce((a, b) => a + b) / dureMins.length).toFixed(0) : 0;

      return {
        specialite: spec,
        totalStages: stagesSpec.length,
        stagesValides: stagesSpecValides,
        tauxValidation: stagesSpec.length > 0 ? ((stagesSpecValides / stagesSpec.length) * 100).toFixed(2) : 0,
        noteMoyenne: parseFloat(noteMoyenne),
        dureeMovenneJours: parseInt(dureeMovenneJours),
      };
    });

    // ─── Durée moyenne générale ───────────────────────────────────────────
    const durees = stages.map((s) => {
      const debut = new Date(s.dateDebut);
      const fin = new Date(s.dateFin);
      return Math.ceil((fin - debut) / (1000 * 60 * 60 * 24));
    });
    const dureeMovenneDays = durees.length > 0 ? (durees.reduce((a, b) => a + b) / durees.length).toFixed(0) : 0;
    const dureeMinimumDays = durees.length > 0 ? Math.min(...durees) : null;
    const dureeMaximumDays = durees.length > 0 ? Math.max(...durees) : null;

    // ─── Notes ────────────────────────────────────────────────────────────
    const notes = stages.filter((s) => s.note).map((s) => s.note);
    const noteMoyenneGlobale = notes.length > 0 ? (notes.reduce((a, b) => a + b) / notes.length).toFixed(2) : 0;

    const distributionNotes = [
      {
        plage: '0-5',
        nombre: notes.filter((n) => n >= 0 && n < 6).length,
      },
      {
        plage: '6-10',
        nombre: notes.filter((n) => n >= 6 && n < 11).length,
      },
      {
        plage: '11-15',
        nombre: notes.filter((n) => n >= 11 && n < 16).length,
      },
      {
        plage: '16-20',
        nombre: notes.filter((n) => n >= 16 && n <= 20).length,
      },
    ];

    // ─── Entreprises récurrentes ──────────────────────────────────────────
    const entrepriseMap = {};
    stages.forEach((s) => {
      const nom = s.entreprise.nom;
      if (!entrepriseMap[nom]) {
        entrepriseMap[nom] = {
          nomEntreprise: nom,
          nombreStages: 0,
          notes: [],
        };
      }
      entrepriseMap[nom].nombreStages++;
      if (s.note) {
        entrepriseMap[nom].notes.push(s.note);
      }
    });

    const entreprisesRecurrentes = Object.values(entrepriseMap)
      .map((e) => ({
        nomEntreprise: e.nomEntreprise,
        nombreStages: e.nombreStages,
        tauxValidation: (
          (stages.filter((s) => s.entreprise.nom === e.nomEntreprise && s.statut === 'validé').length /
            e.nombreStages) *
          100
        ).toFixed(2),
        noteMoyenne: e.notes.length > 0 ? (e.notes.reduce((a, b) => a + b) / e.notes.length).toFixed(2) : 0,
      }))
      .sort((a, b) => b.nombreStages - a.nombreStages);

    // ─── Par type de stage ────────────────────────────────────────────────
    const types = ['stage_initiation', 'stage_perfectionnement', 'stage_pfe'];
    const parType = types.map((type) => {
      const stagesType = stages.filter((s) => s.type === type);
      const stagesTypeValides = stagesType.filter((s) => s.statut === 'validé').length;
      const notesType = stagesType.filter((s) => s.note).map((s) => s.note);
      const noteMoyenne = notesType.length > 0 ? (notesType.reduce((a, b) => a + b) / notesType.length).toFixed(2) : 0;

      return {
        type,
        totalStages: stagesType.length,
        tauxValidation: stagesType.length > 0 ? ((stagesTypeValides / stagesType.length) * 100).toFixed(2) : 0,
        noteMoyenne: parseFloat(noteMoyenne),
      };
    });

    // ─── Par tuteur ───────────────────────────────────────────────────────
    const tuteurMap = {};
    stages.forEach((s) => {
      if (s.tuteur) {
        const tuteurId = s.tuteur._id.toString();
        if (!tuteurMap[tuteurId]) {
          tuteurMap[tuteurId] = {
            tuteur: s.tuteur._id,
            nomTuteur: `${s.tuteur.nom} ${s.tuteur.prenom}`,
            nombreStages: 0,
            stagesValides: 0,
            rapports: 0,
          };
        }
        tuteurMap[tuteurId].nombreStages++;
        if (s.statut === 'validé') {
          tuteurMap[tuteurId].stagesValides++;
        }
      }
    });

    const parTuteur = Object.values(tuteurMap).map((t) => ({
      tuteur: t.tuteur,
      nomTuteur: t.nomTuteur,
      nombreStages: t.nombreStages,
      tauxValidation: t.nombreStages > 0 ? ((t.stagesValides / t.nombreStages) * 100).toFixed(2) : 0,
      tauxSoumissionRapports: 0, // TODO : compter les rapports soumis
    }));

    // ─── Indicateurs clés ──────────────────────────────────────────────
    const indicateurs = {
      tauxCompletionGlobal: ((stagesValides / totalStages) * 100).toFixed(2),
      tauxSoumissionDocuments: 0, // TODO : à calculer
      nombreTuteurs: Object.keys(tuteurMap).length,
      nombreEntreprises: Object.keys(entrepriseMap).length,
      nombreEtudiants: new Set(stages.map((s) => s.etudiant._id.toString())).size,
    };

    // Créer ou mettre à jour les statistiques
    let stats = await StageStatistics.findOne({ anneeUniversitaire });
    if (!stats) {
      stats = new StageStatistics({
        anneeUniversitaire,
        totalStages,
        stagesValides,
        stagesRefuses,
        stagesEnCours,
        parSpecialite,
        dureeMovenneDays: parseInt(dureeMovenneDays),
        dureeMinimumDays,
        dureeMaximumDays,
        noteMoyenneGlobale: parseFloat(noteMoyenneGlobale),
        distributionNotes,
        entreprisesRecurrentes,
        parType,
        parTuteur,
        indicateurs,
      });
    } else {
      stats.totalStages = totalStages;
      stats.stagesValides = stagesValides;
      stats.stagesRefuses = stagesRefuses;
      stats.stagesEnCours = stagesEnCours;
      stats.parSpecialite = parSpecialite;
      stats.dureeMovenneDays = parseInt(dureeMovenneDays);
      stats.dureeMinimumDays = dureeMinimumDays;
      stats.dureeMaximumDays = dureeMaximumDays;
      stats.noteMoyenneGlobale = parseFloat(noteMoyenneGlobale);
      stats.distributionNotes = distributionNotes;
      stats.entreprisesRecurrentes = entreprisesRecurrentes;
      stats.parType = parType;
      stats.parTuteur = parTuteur;
      stats.indicateurs = indicateurs;
      stats.dateCalcul = new Date();
    }

    await stats.save();

    res.status(200).json({
      message: 'Statistiques générées avec succès',
      statistics: stats,
    });
  } catch (err) {
    console.error('Erreur POST /statistics/generate :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/statistics/:anneeUniversitaire
// Récupérer les statistiques d'une année
// Accessible : admin
// ─────────────────────────────────────────────────────────────────────────────
exports.getStatistics = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : admin seulement' });
    }

    const { anneeUniversitaire } = req.params;

    const stats = await StageStatistics.findOne({ anneeUniversitaire })
      .populate('parTuteur.tuteur', 'nom prenom email');

    if (!stats) {
      return res.status(404).json({ message: `Aucunes statistiques trouvées pour ${anneeUniversitaire}` });
    }

    res.status(200).json({ statistics: stats });
  } catch (err) {
    console.error('Erreur GET /statistics/:anneeUniversitaire :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/statistics/all
// Récupérer toutes les statistiques
// Accessible : admin
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllStatistics = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : admin seulement' });
    }

    const stats = await StageStatistics.find().sort({ anneeUniversitaire: -1 });

    res.status(200).json({
      total: stats.length,
      statistics: stats,
    });
  } catch (err) {
    console.error('Erreur GET /statistics/all :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
