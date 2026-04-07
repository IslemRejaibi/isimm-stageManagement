const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true,
      minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
      maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères'],
    },

    prenom: {
      type: String,
      required: [true, 'Le prénom est obligatoire'],
      trim: true,
      minlength: [2, 'Le prénom doit contenir au moins 2 caractères'],
      maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères'],
    },

    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Veuillez fournir un email valide',
      ],
    },

    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire'],
      minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
      select: false, // jamais renvoyé dans les requêtes par défaut
    },

    role: {
      type: String,
      enum: {
        values: ['etudiant', 'tuteur', 'enseignant', 'admin'],
        message: 'Le rôle {VALUE} n\'est pas autorisé',
      },
      default: 'etudiant',
    },

    // Champs spécifiques aux étudiants
    numeroEtudiant: {
      type: String,
      trim: true,
      sparse: true, // index partiel — unique seulement si la valeur existe
      unique: true,
    },

    specialite: {
      type: String,
      trim: true,
      enum: ['GL', 'RS', 'IIA', 'GE', 'GM', 'GC', 'autre', null],
      default: null,
    },

    niveau: {
      type: String,
      enum: ['L1', 'L2', 'L3', 'M1', 'M2', null],
      default: null,
    },

    // Champs spécifiques aux enseignants / tuteurs
    departement: {
      type: String,
      trim: true,
      default: null,
    },

    telephone: {
      type: String,
      trim: true,
      match: [/^[0-9]{8}$/, 'Le numéro de téléphone doit contenir 8 chiffres'],
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    avatar: {
      type: String, // URL vers la photo de profil
      default: null,
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true, // ajoute createdAt et updatedAt automatiquement
  }
);

// ─── Middleware pre-save : hachage du mot de passe ───────────────────────────
// Exécuté avant chaque .save()
// On ne rehache que si le champ password a été modifié
// ✅ Modern Mongoose — no next needed
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// ─── Méthode d'instance : comparer le mot de passe saisi ────────────────────
// Utilisation : const ok = await user.comparePassword('monMotDePasse')
UserSchema.methods.comparePassword = async function (motDePasseSaisi) {
  return await bcrypt.compare(motDePasseSaisi, this.password);
};

// ─── Méthode virtuelle : nom complet ────────────────────────────────────────
// user.nomComplet → "Ben Ali Mohamed"
UserSchema.virtual('nomComplet').get(function () {
  return `${this.nom} ${this.prenom}`;
});

// ─── Méthode toJSON : exclure les champs sensibles ──────────────────────────
// Retire automatiquement __v et les champs de reset quand on fait JSON.stringify
UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpire;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', UserSchema);