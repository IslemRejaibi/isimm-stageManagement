const mongoose = require('mongoose');

// ─── Constantes ───────────────────────────────────────────────────────────────
const STATUTS_STAGE = ['en_attente', 'en_cours', 'terminé', 'validé', 'refusé'];

const TYPES_STAGE = ['stage_initiation', 'stage_perfectionnement', 'stage_pfe'];

const SPECIALITES = ['GL', 'RS', 'IIA', 'GE', 'GM', 'GC', 'autre'];

// ─── Schéma ───────────────────────────────────────────────────────────────────
const StageSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: [true, 'Le titre du stage est obligatoire'],
      trim: true,
      minlength: [5, 'Le titre doit contenir au moins 5 caractères'],
      maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères'],
      default: null,
    },

    // ── Entreprise ────────────────────────────────────────────────────────────
    entreprise: {
      nom: {
        type: String,
        required: [true, "Le nom de l'entreprise est obligatoire"],
        trim: true,
      },
      adresse: {
        type: String,
        trim: true,
        default: null,
      },
      secteur: {
        type: String,
        trim: true,
        default: null,
      },
      emailContact: {
        type: String,
        trim: true,
        lowercase: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          'Email de contact invalide',
        ],
        default: null,
      },
      telephoneContact: {
        type: String,
        trim: true,
        default: null,
      },
    },

    // ── Références utilisateurs ───────────────────────────────────────────────
    etudiant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "L'étudiant associé au stage est obligatoire"],
    },

    tuteur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,           // assigné plus tard par l'admin
    },

    encadrantEntreprise: {
      nom: {
        type: String,
        trim: true,
        default: null,
      },
      poste: {
        type: String,
        trim: true,
        default: null,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: null,
      },
    },

    // ── Informations académiques ──────────────────────────────────────────────
    type: {
      type: String,
      enum: {
        values: TYPES_STAGE,
        message: 'Le type "{VALUE}" n\'est pas valide',
      },
      required: [true, 'Le type de stage est obligatoire'],
    },

    specialite: {
      type: String,
      enum: {
        values: SPECIALITES,
        message: 'La spécialité "{VALUE}" n\'est pas reconnue',
      },
      required: [true, 'La spécialité est obligatoire'],
    },

    anneeUniversitaire: {
      type: String,
      required: [true, "L'année universitaire est obligatoire"],
      match: [
        /^\d{4}-\d{4}$/,
        "Format attendu : 2025-2026",
      ],
      default: () => {
        const now = new Date();
        const y = now.getFullYear();
        return now.getMonth() >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
      },
    },

    // ── Dates ─────────────────────────────────────────────────────────────────
    dateDebut: {
      type: Date,
      required: [true, 'La date de début est obligatoire'],
    },

    dateFin: {
      type: Date,
      required: [true, 'La date de fin est obligatoire'],
    },

    // ── Statut ────────────────────────────────────────────────────────────────
    statut: {
      type: String,
      enum: {
        values: STATUTS_STAGE,
        message: 'Le statut "{VALUE}" n\'est pas valide',
      },
      default: 'en_attente',
    },

    historiqueStatuts: [
      {
        statut: { type: String, enum: STATUTS_STAGE },
        date: { type: Date, default: Date.now },
        commentaire: { type: String, trim: true, default: null },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],

    // ── Évaluation ────────────────────────────────────────────────────────────
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

    // ── Rapport de stage ──────────────────────────────────────────────────────
    rapport: {
      url:        { type: String, trim: true, default: null },
      nomFichier: { type: String, trim: true, default: null },
      taille:     { type: Number, default: null },   // en octets
      dateDepot:  { type: Date, default: null },
    },

    // ── Attestation de stage ──────────────────────────────────────────────────
    attestation: {
      url:        { type: String, trim: true, default: null },
      dateDepot:  { type: Date, default: null },
    },

    // ── Commentaires ──────────────────────────────────────────────────────────
    commentaires: [
      {
        auteur:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        contenu: { type: String, required: true, trim: true, maxlength: 1000 },
        date:    { type: Date, default: Date.now },
      },
    ],

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Validation : dateFin après dateDebut ─────────────────────────────────────
StageSchema.pre('save', function (next) {
  if (this.dateDebut && this.dateFin && this.dateFin <= this.dateDebut) {
    return next(new Error('La date de fin doit être après la date de début'));
  }
  next();
});

// ─── Middleware : mention automatique depuis la note ──────────────────────────
StageSchema.pre('save', function (next) {
  if (this.isModified('note') && this.note !== null) {
    if      (this.note >= 18) this.mention = 'Excellent';
    else if (this.note >= 16) this.mention = 'Très bien';
    else if (this.note >= 14) this.mention = 'Bien';
    else if (this.note >= 12) this.mention = 'Assez bien';
    else if (this.note >= 10) this.mention = 'Passable';
    else                      this.mention = null;
  }
  next();
});

// ─── Virtuel : durée en semaines ──────────────────────────────────────────────
// stage.dureeSemaines → 8
StageSchema.virtual('dureeSemaines').get(function () {
  if (!this.dateDebut || !this.dateFin) return null;
  const ms = this.dateFin - this.dateDebut;
  return Math.ceil(ms / (1000 * 60 * 60 * 24 * 7));
});

// ─── Index ────────────────────────────────────────────────────────────────────
StageSchema.index({ etudiant: 1 });
StageSchema.index({ tuteur: 1 });
StageSchema.index({ statut: 1 });

// ─── Méthode d'instance : changer le statut ───────────────────────────────────
// await stage.changerStatut('validé', userId, 'Stage conforme')
StageSchema.methods.changerStatut = async function (nouveauStatut, userId, commentaire = null) {
  this.statut = nouveauStatut;
  this.historiqueStatuts.push({
    statut: nouveauStatut,
    date: new Date(),
    commentaire,
    changedBy: userId,
  });
  return this.save();
};

// ─── Méthode statique : stages par tuteur ─────────────────────────────────────
// await Stage.parTuteur(tuteurId)
StageSchema.statics.parTuteur = function (tuteurId) {
  return this.find({ tuteur: tuteurId, isArchived: false })
    .populate('etudiant', 'nom prenom email numeroEtudiant specialite')
    .sort({ dateDebut: -1 });
};

// ─── Méthode statique : stages par statut ─────────────────────────────────────
// await Stage.parStatut('en_cours')
StageSchema.statics.parStatut = function (statut) {
  return this.find({ statut, isArchived: false })
    .populate('etudiant', 'nom prenom email')
    .populate('tuteur',   'nom prenom email')
    .sort({ updatedAt: -1 });
};

module.exports = mongoose.model('Stage', StageSchema);