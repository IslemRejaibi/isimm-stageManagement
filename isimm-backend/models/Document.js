const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom du document est obligatoire'],
      trim: true,
    },

    url: {
      type: String,
      required: [true, 'L\'URL du document est obligatoire'],
    },

    nomFichier: {
      type: String,
      required: true,
      trim: true,
    },

    taille: {
      type: Number,
      default: 0, // en octets
    },

    // Référence à l'utilisateur qui a uploadé
    proprietaire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Optionnel : lier à un stage ou PFE
    stage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stage',
      default: null,
    },

    pfe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PFE',
      default: null,
    },

    categorie: {
      type: String,
      enum: ['stage', 'pfe', 'autre'],
      default: 'autre',
    },

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Document', DocumentSchema);
