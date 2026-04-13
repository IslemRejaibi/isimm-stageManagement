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

    // ── Détails structurés du PFE (Phase 8 - enrichissements) ─────────────────
    detailsProjet: {
      domaine: {
        type: String,
        trim: true,
        default: null,
      },

      objectifsGeneraux: {
        type: String,
        trim: true,
        maxlength: [1500, 'Maximum 1500 caractères'],
        default: null,
      },

      objectifsPedagogiques: {
        type: String,
        trim: true,
        maxlength: [1500, 'Maximum 1500 caractères'],
        default: null,
      },

      technologiesUtilisees: [String], // ['Node.js', 'React', 'MongoDB']

      methodologie: {
        type: String,
        trim: true,
        maxlength: [1000, 'Maximum 1000 caractères'],
        default: null,
      },

      resultatAttendu: {
        type: String,
        trim: true,
        maxlength: [1000, 'Maximum 1000 caractères'],
        default: null,
      },

      // Livrables prévus
      livrables: [
        {
          nom: String,
          description: String,
          datePrevisionnelle: Date,
          statut: {
            type: String,
            enum: ['non_commence', 'en_cours', 'termine', 'delivered'],
            default: 'non_commence',
          },
        },
      ],
    },

    // ── Planification de soutenance (Phase 8) ──────────────────────────────────
    soutenance: {
      dateSoutenance: {
        type: Date,
        default: null,
      },

      lieuSoutenance: {
        type: String,
        trim: true,
        default: null,
      },

      salleNum: {
        type: String,
        trim: true,
        default: null,
      },

      heureSoutenance: {
        type: String,
        trim: true,
        match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format HH:MM invalide'],
        default: null,
      },

      dureeEstimee: {
        type: Number, // en minutes
        default: 30,
      },

      // URLs de visioconférence (si soutenance hybride)
      urlVisio: {
        type: String,
        trim: true,
        default: null,
      },

      statut: {
        type: String,
        enum: ['non_planifiee', 'planifiee', 'annulee', 'reportee', 'effectuee'],
        default: 'non_planifiee',
      },

      commentairesOrganisation: {
        type: String,
        trim: true,
        default: null,
      },
    },

    // ── Rapports et documents (Phase 8) ──────────────────────────────────────
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
      statut: {
        type: String,
        enum: ['non_depose', 'depose', 'approuve', 'rejete'],
        default: 'non_depose',
      },
    },

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
      statut: {
        type: String,
        enum: ['non_depose', 'depose', 'approuve', 'rejete'],
        default: 'non_depose',
      },
    },

    // Présentation PowerPoint / slides
    presentation: {
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
      dateDepot: {
        type: Date,
        default: null,
      },
    },

    // Code source / dépôt Git
    codeSource: {
      urlRepository: {
        type: String,
        trim: true,
        default: null,
      },
      descriptionRepo: {
        type: String,
        trim: true,
        default: null,
      },
    },

    // ── Évaluation de soutenance (Phase 8) ────────────────────────────────────
    evaluationSoutenance: {
      // Note générale
      note: {
        type: Number,
        min: 0,
        max: 20,
        default: null,
      },

      // Critères d'évaluation
      clartePresentation: {
        note: { type: Number, min: 0, max: 20, default: null },
        commentaire: String,
      },

      qualiteTechnique: {
        note: { type: Number, min: 0, max: 20, default: null },
        commentaire: String,
      },

      innovationOriginalite: {
        note: { type: Number, min: 0, max: 20, default: null },
        commentaire: String,
      },

      reponseQuestions: {
        note: { type: Number, min: 0, max: 20, default: null },
        commentaire: String,
      },

      autonomieRigueur: {
        note: { type: Number, min: 0, max: 20, default: null },
        commentaire: String,
      },

      // Observations générales
      pointsForts: {
        type: String,
        trim: true,
        default: null,
      },

      axesAmelioration: {
        type: String,
        trim: true,
        default: null,
      },

      // Recommandation du jury
      recommandation: {
        type: String,
        enum: ['non_valide', 'valide_conditions', 'valide', 'valide_mention'],
        default: null,
      },

      // Feedback collectif
      feedbackJury: {
        type: String,
        trim: true,
        default: null,
      },

      dateEvaluation: {
        type: Date,
        default: null,
      },

      evaluePar: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Généralement le coordinateur ou un représentant du jury
        default: null,
      },
    },

    // ── Statut et validation (Phase 8) ───────────────────────────────────────
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

    // ── Note et mention ─────────────────────────────────────────────────────
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

    creditsECTS: {
      type: Number,
      min: 0,
      max: 30,
      default: null,
    },

    // ── Commentaires encadrant et jury ───────────────────────────────────────
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

    // ── Étapes et validation ──────────────────────────────────────────────────
    etape: {
      type: Number,
      default: 1,
      min: 1,
      max: 4,
    },

    valideeParEncadrant: {
      type: Boolean,
      default: false,
    },

    dateValidationEncadrant: {
      type: Date,
      default: null,
    },

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
PFESchema.pre('save', function () {
  if (this.isModified('note') && this.note !== null) {
    if (this.note >= 18)      this.mention = 'Excellent';
    else if (this.note >= 16) this.mention = 'Très bien';
    else if (this.note >= 14) this.mention = 'Bien';
    else if (this.note >= 12) this.mention = 'Assez bien';
    else if (this.note >= 10) this.mention = 'Passable';
    else                      this.mention = null;
  }
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