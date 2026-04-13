const mongoose = require('mongoose');

// ─── Fiche d'évaluation du stage (Phase 5) ─────────────────────────────────────

const EvaluationFormSchema = new mongoose.Schema(
  {
    stage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stage',
      required: [true, 'Le stage est obligatoire'],
    },

    // Type d'évaluateur
    evaluateurType: {
      type: String,
      enum: ['encadrant_entreprise', 'tuteur_universitaire', 'admin'],
      required: [true, 'Le type d\'évaluateur est obligatoire'],
    },

    evaluateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ─── Critères d'évaluation ────────────────────────────────────────────────
    // Chaque critère est noté de 1 à 20

    competencesTechniques: {
      note: { type: Number, min: 0, max: 20, default: null },
      commentaire: { type: String, trim: true, default: null },
    },

    autonomie: {
      note: { type: Number, min: 0, max: 20, default: null },
      commentaire: { type: String, trim: true, default: null },
    },

    rigueur: {
      note: { type: Number, min: 0, max: 20, default: null },
      commentaire: { type: String, trim: true, default: null },
    },

    capaciteCommunication: {
      note: { type: Number, min: 0, max: 20, default: null },
      commentaire: { type: String, trim: true, default: null },
    },

    travailEnEquipe: {
      note: { type: Number, min: 0, max: 20, default: null },
      commentaire: { type: String, trim: true, default: null },
    },

    qualiteTravail: {
      note: { type: Number, min: 0, max: 20, default: null },
      commentaire: { type: String, trim: true, default: null },
    },

    progressionLearning: {
      note: { type: Number, min: 0, max: 20, default: null },
      commentaire: { type: String, trim: true, default: null },
    },

    // Remarques générales
    remarquesGenerales: {
      type: String,
      trim: true,
      maxlength: [2000, 'Maximum 2000 caractères'],
      default: null,
    },

    // Points forts
    pointsForts: {
      type: String,
      trim: true,
      maxlength: [1000, 'Maximum 1000 caractères'],
      default: null,
    },

    // Axes d'amélioration
    axesAmelioration: {
      type: String,
      trim: true,
      maxlength: [1000, 'Maximum 1000 caractères'],
      default: null,
    },

    // Recommandation finale
    recommandation: {
      type: String,
      enum: ['non_valide', 'a_retravailler', 'valide', 'excellent'],
      default: null,
    },

    // Statut
    statut: {
      type: String,
      enum: ['brouillon', 'soumise', 'validee'],
      default: 'brouillon',
    },

    dateRemise: {
      type: Date,
      default: null,
    },

    // Calcul automatique de la moyenne
    noteMoyenne: {
      type: Number,
      min: 0,
      max: 20,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware : calcul automatique de la moyenne
EvaluationFormSchema.pre('save', function (next) {
  const notes = [
    this.competencesTechniques.note,
    this.autonomie.note,
    this.rigueur.note,
    this.capaciteCommunication.note,
    this.travailEnEquipe.note,
    this.qualiteTravail.note,
    this.progressionLearning.note,
  ].filter(n => n !== null && n !== undefined);

  if (notes.length > 0) {
    this.noteMoyenne = (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(2);
  }

  next();
});

module.exports = mongoose.model('EvaluationForm', EvaluationFormSchema);
