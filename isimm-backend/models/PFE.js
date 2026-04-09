const mongoose = require('mongoose');

// ─── Constantes ──────────────────────────────────────────────────────────────
const STATUTS_PFE = ['soumis', 'en_revision', 'validé', 'refusé'];

const TYPES_PFE = ['académique', 'professionnel', 'recherche'];

const SPECIALITES = ['GL', 'RS', 'IIA', 'GE', 'GM', 'GC', 'autre'];

// ─── Schéma ──────────────────────────────────────────────────────────────────
const PFESchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: [true, 'Le titre du PFE est obligatoire'],
      trim: true,
      minlength: [5, 'Le titre doit contenir au moins 5 caractères'],
      maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères'],
    },

    description: {
      type: String,
      required: [true, 'La description est obligatoire'],
      trim: true,
      minlength: [20, 'La description doit contenir au moins 20 caractères'],
      maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères'],
    },

    // ── Références utilisateurs ──────────────────────────────────────────────
    etudiant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "L'étudiant associé au PFE est obligatoire"],
    },

    encadrant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "L'encadrant associé au PFE est obligatoire"],
    },

    // Jury de soutenance (optionnel, renseigné plus tard)
    jury: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // ── Informations académiques ─────────────────────────────────────────────
    specialite: {
      type: String,
      enum: {
        values: SPECIALITES,
        message: 'La spécialité "{VALUE}" n\'est pas reconnue',
      },
      required: [true, 'La spécialité est obligatoire'],
    },

    type: {
      type: String,
      enum: {
        values: TYPES_PFE,
        message: 'Le type "{VALUE}" n\'est pas valide',
      },
      default: 'académique',
    },

    anneeUniversitaire: {
      type: String,
      required: [true, "L'année universitaire est obligatoire"],
      match: [
        /^\d{4}-\d{4}$/,
        "L'année universitaire doit être au format 2025-2026",
      ],
      default: () => {
        const now = new Date();
        const y = now.getFullYear();
        return now.getMonth() >= 8
          ? `${y}-${y + 1}`   // à partir de septembre
          : `${y - 1}-${y}`;
      },
    },

    // ── Statut et workflow ───────────────────────────────────────────────────
    statut: {
      type: String,
      enum: {
        values: STATUTS_PFE,
        message: 'Le statut "{VALUE}" n\'est pas valide',
      },
      default: 'soumis',
    },

    // Historique des changements de statut
    historiqueStatuts: [
      {
        statut: {
          type: String,
          enum: STATUTS_PFE,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        commentaire: {
          type: String,
          trim: true,
          default: null,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],

    // ── Note et évaluation ───────────────────────────────────────────────────
    note: {
      type: Number,
      min: [0, 'La note ne peut pas être inférieure à 0'],
      max: [20, 'La note ne peut pas dépasser 20'],
      default: null,
    },

    mention: {
      type: String,
      enum: ['Passable', 'Assez bien', 'Bien', 'Très bien', 'Excellent', null],
      default: null,
    },

    dateSoutenance: {
      type: Date,
      default: null,
    },

    // ── Rapport intermédiaire PDF ───────────────────────────────────────────
    rapportIntermediaire: {
      url: {
        type: String,
        trim: true,
        default: null,
      },
      nomFichier: {
        type: String,
        trim: true,
        default: null,
      },
      taille: {
        type: Number,
        default: null,
      },
      dateDepot: {
        type: Date,
        default: null,
      },
    },
    // ── Rapport final PDF ─────────────────────────────────────────────────────
    rapportFinal: {
      url: {
        type: String,
        trim: true,
        default: null,
      },
      nomFichier: {
        type: String,
        trim: true,
        default: null,
      },
      taille: {
        type: Number,
        default: null,
      },
      dateDepot: {
        type: Date,
        default: null,
      },
    },

    // ── Commentaires encadrant ───────────────────────────────────────────────
    commentaires: [
      {
        auteur: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        contenu: {
          type: String,
          required: true,
          trim: true,
          maxlength: [1000, 'Le commentaire ne peut pas dépasser 1000 caractères'],
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,   // createdAt + updatedAt automatiques
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


// Un étudiant ne peut avoir qu'un seul PFE actif par année universitaire
PFESchema.index(
  { etudiant: 1, anneeUniversitaire: 1 },
  { unique: true }
);

// ─── Virtuel : rapport déposé ─────────────────────────────────────────────────
// pfe.aRapport → true / false
PFESchema.virtual('aRapport').get(function () {
  return !!(this.rapport && this.rapport.url);
});

// ─── Virtuel : taille lisible ────────────────────────────────────────────────
// pfe.tailleRapport → "2.1 Mo"
PFESchema.virtual('tailleRapport').get(function () {
  if (!this.rapport?.taille) return null;
  const mo = this.rapport.taille / (1024 * 1024);
  return `${mo.toFixed(1)} Mo`;
});

// ─── Middleware pre-save : mention automatique ────────────────────────────────
// Calcule la mention dès qu'une note est enregistrée
PFESchema.pre('save', function (next) {
  if (this.isModified('note') && this.note !== null) {
    if (this.note >= 18)      this.mention = 'Excellent';
    else if (this.note >= 16) this.mention = 'Très bien';
    else if (this.note >= 14) this.mention = 'Bien';
    else if (this.note >= 12) this.mention = 'Assez bien';
    else if (this.note >= 10) this.mention = 'Passable';
    else                      this.mention = null;
  }
  next();
});

// ─── Méthode : changer le statut avec historique ──────────────────────────────
// Utilisation :
//   await pfe.changerStatut('validé', userId, 'Excellent travail')
PFESchema.methods.changerStatut = async function (nouveauStatut, userId, commentaire = null) {
  this.statut = nouveauStatut;
  this.historiqueStatuts.push({
    statut: nouveauStatut,
    date: new Date(),
    commentaire,
    changedBy: userId,
  });
  return this.save();
};

// ─── Méthode statique : PFE par encadrant ────────────────────────────────────
// Utilisation :
//   const liste = await PFE.parEncadrant(encadrantId)
PFESchema.statics.parEncadrant = function (encadrantId) {
  return this.find({ encadrant: encadrantId, isArchived: false })
    .populate('etudiant', 'nom prenom email numeroEtudiant')
    .sort({ createdAt: -1 });
};

// ─── Méthode statique : PFE par statut ───────────────────────────────────────
PFESchema.statics.parStatut = function (statut) {
  return this.find({ statut, isArchived: false })
    .populate('etudiant', 'nom prenom email')
    .populate('encadrant', 'nom prenom email')
    .sort({ updatedAt: -1 });
};

module.exports = mongoose.model('PFE', PFESchema);