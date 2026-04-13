const mongoose = require('mongoose');

// ─── Attestation de validation et ECTS (Phase 6) ────────────────────────────

const ValidationAttestationSchema = new mongoose.Schema(
  {
    stage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stage',
      required: [true, 'Le stage est obligatoire'],
      unique: true,
    },

    etudiant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Note finale calculée
    noteFinale: {
      type: Number,
      min: 0,
      max: 20,
      required: true,
    },

    // Crédit ECTS attribué
    creditsECTS: {
      type: Number,
      min: 0,
      max: 30,
      required: true,
    },

    // Mention obtenue
    mention: {
      type: String,
      enum: ['Très Bien', 'Bien', 'Assez Bien', 'Passable'],
      required: true,
    },

    // Statut de validation
    statut: {
      type: String,
      enum: ['en_attente', 'valide', 'rejete'],
      default: 'en_attente',
    },

    // Conditions pour validation
    criteres: {
      noteMinimale: {
        type: Boolean,
        required: true,
      },
      documentsComplets: {
        type: Boolean,
        required: true,
      },
      evaluationsTerminees: {
        type: Boolean,
        required: true,
      },
      tuteurAsigne: {
        type: Boolean,
        required: true,
      },
    },

    // Dates clés
    dateDecision: {
      type: Date,
      default: Date.now,
    },

    dateValidation: {
      type: Date,
      default: null,
    },

    // Validé par (admin)
    validePar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Raison du rejet
    raisonRejet: {
      type: String,
      trim: true,
      maxlength: [500, 'Maximum 500 caractères'],
      default: null,
    },

    // Attestation officielle
    attestation: {
      url: { type: String, trim: true, default: null },
      nomFichier: { type: String, trim: true, default: null },
      genereeDate: { type: Date, default: null },
      signature: { type: String, default: null }, // Placeholder pour signature numérique
    },

    // Relevé de notes
    releveNotes: {
      url: { type: String, trim: true, default: null },
      nomFichier: { type: String, trim: true, default: null },
    },

    // Envoyé à l'étudiant
    notificationEnvoyee: {
      type: Boolean,
      default: false,
    },

    dateNotification: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ValidationAttestation', ValidationAttestationSchema);
