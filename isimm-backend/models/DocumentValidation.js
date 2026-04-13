const mongoose = require('mongoose');

// ─── Validation des documents (Phase 4) ───────────────────────────────────────

const DocumentValidationSchema = new mongoose.Schema(
  {
    stage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stage',
      required: [true, 'Le stage est obligatoire'],
    },

    typeDocument: {
      type: String,
      enum: ['rapport_stage', 'attestation_stage', 'convention', 'lettre_motivation', 'fiche_evaluation', 'autre'],
      required: [true, 'Le type de document est obligatoire'],
    },

    // Document soumis par l'étudiant ou l'admin
    document: {
      url: {
        type: String,
        trim: true,
        required: [true, 'L\'URL du document est obligatoire'],
      },
      nomFichier: {
        type: String,
        trim: true,
        required: true,
      },
      taille: {
        type: Number,
        default: null,
      },
      mimeType: {
        type: String,
        default: 'application/pdf',
      },
    },

    // Status de validation
    statut: {
      type: String,
      enum: ['soumis', 'en_examen', 'approuve', 'rejete'],
      default: 'soumis',
    },

    // Commentaires de rejet ou d'approbation
    commentaireValidation: {
      texte: { type: String, trim: true, default: null },
      date: { type: Date, default: null },
    },

    // Qui a validé/rejeté
    validationPar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    dateValidation: {
      type: Date,
      default: null,
    },

    // Soumis par
    soumisJointu: {
      type: String,
      enum: ['etudiant', 'tuteur', 'admin'],
      required: true,
    },

    // Raison de rejet
    raisonRejet: {
      type: String,
      enum: [
        'format_incorrect',
        'contenu_incomplet',
        'fichier_corrompu',
        'non_conforme',
        'duplication',
        'autre'
      ],
      default: null,
    },

    dateRemiseInitiale: {
      type: Date,
      required: true,
    },

    // Nombre de tentatives de soumission
    tentatives: {
      type: Number,
      default: 1,
    },

    // Notifications envoyées
    notificationEnvoyee: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DocumentValidation', DocumentValidationSchema);
