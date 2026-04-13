const mongoose = require('mongoose');

// ─── Rapport d'avancement du stage (Phases 3) ────────────────────────────────

const ProgressReportSchema = new mongoose.Schema(
  {
    stage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stage',
      required: [true, 'Le stage associé est obligatoire'],
    },

    semaine: {
      type: Number,
      required: [true, 'Le numéro de semaine est obligatoire'],
      min: [1, 'Minimum 1 semaine'],
      max: [52, 'Maximum 52 semaines'],
    },

    // Contenu du rapport
    tachesRealises: {
      type: String,
      required: [true, 'Les tâches réalisées sont obligatoires'],
      minlength: [20, 'Minimum 20 caractères'],
      maxlength: [2000, 'Maximum 2000 caractères'],
    },

    difficultesRencontrees: {
      type: String,
      trim: true,
      maxlength: [1000, 'Maximum 1000 caractères'],
      default: null,
    },

    tachesPreves: {
      type: String,
      trim: true,
      maxlength: [1000, 'Maximum 1000 caractères'],
      default: null,
    },

    observations: {
      type: String,
      trim: true,
      maxlength: [1000, 'Maximum 1000 caractères'],
      default: null,
    },

    // Statut du rapport
    statut: {
      type: String,
      enum: ['brouillon', 'soumis', 'vu_tuteur', 'vu_admin'],
      default: 'brouillon',
    },

    // Commentaires du tuteur
    commentaireTuteur: {
      texte: { type: String, trim: true, default: null },
      date: { type: Date, default: null },
    },

    // Feedback du tuteur (envoyé par email)
    feedbackEnvoyeAuTuteur: {
      type: Boolean,
      default: false,
    },

    dateRemisePrevu: {
      type: Date,
      required: true,
    },

    dateRemiseReel: {
      type: Date,
      default: null,
    },

    fichierJoint: {
      url: { type: String, trim: true, default: null },
      nomFichier: { type: String, trim: true, default: null },
      taille: { type: Number, default: null },
      typeDocument: { type: String, enum: ['rapport', 'captures', 'autre'], default: null },
    },

    auteur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index : un étudiant ne peut soumettre qu'un rapport par semaine par stage
ProgressReportSchema.index({ stage: 1, semaine: 1 }, { unique: true });

module.exports = mongoose.model('ProgressReport', ProgressReportSchema);
