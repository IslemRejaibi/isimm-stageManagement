const mongoose = require('mongoose');

// ─── Statistiques et archivage (Phase 7) ──────────────────────────────────────

const StageStatisticsSchema = new mongoose.Schema(
  {
    // Identifiant unique pour une année universitaire
    anneeUniversitaire: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{4}$/, "Format attendu : 2025-2026"],
      unique: true,
    },

    // ─── Totaux ───────────────────────────────────────────────────────────────
    totalStages: {
      type: Number,
      default: 0,
    },

    stagesValides: {
      type: Number,
      default: 0,
    },

    stagesRefuses: {
      type: Number,
      default: 0,
    },

    stagesEnCours: {
      type: Number,
      default: 0,
    },

    // ─── Taux de validation par spécialité ──────────────────────────────────
    parSpecialite: [
      {
        specialite: String, // GL, RS, IIA, GE, GM, GC
        totalStages: { type: Number, default: 0 },
        stagesValides: { type: Number, default: 0 },
        tauxValidation: { type: Number, default: 0 }, // %
        noteMoyenne: { type: Number, default: 0 },
        dureeMovenneJours: { type: Number, default: 0 },
      },
    ],

    // ─── Durée moyenne des stages ─────────────────────────────────────────
    dureeMovenneDays: {
      type: Number,
      default: 0,
    },

    dureeMinimumDays: {
      type: Number,
      default: null,
    },

    dureeMaximumDays: {
      type: Number,
      default: null,
    },

    // ─── Notes ────────────────────────────────────────────────────────────
    noteMoyenneGlobale: {
      type: Number,
      default: 0,
      min: 0,
      max: 20,
    },

    distributionNotes: [
      {
        plage: String, // "0-5", "6-10", "11-15", "16-20"
        nombre: { type: Number, default: 0 },
      },
    ],

    // ─── Entreprises partenaires ──────────────────────────────────────────
    entreprisesRecurrentes: [
      {
        nomEntreprise: String,
        nombreStages: { type: Number, default: 0 },
        tauxValidation: { type: Number, default: 0 },
        noteMoyenne: { type: Number, default: 0 },
      },
    ],

    // ─── Répartition par type de stage ────────────────────────────────────
    parType: [
      {
        type: String, // stage_initiation, stage_perfectionnement, stage_pfe
        totalStages: { type: Number, default: 0 },
        tauxValidation: { type: Number, default: 0 },
        noteMoyenne: { type: Number, default: 0 },
      },
    ],

    // ─── Répartition par tuteur ───────────────────────────────────────────
    parTuteur: [
      {
        tuteur: mongoose.Schema.Types.ObjectId,
        nomTuteur: String,
        nombreStages: { type: Number, default: 0 },
        tauxValidation: { type: Number, default: 0 },
        tauxSoumissionRapports: { type: Number, default: 0 },
      },
    ],

    // ─── Indicateurs clés ─────────────────────────────────────────────────
    indicateurs: {
      tauxCompletionGlobal: { type: Number, default: 0 }, // % d'étudiants ayant un stage validé
      tauxSoumissionDocuments: { type: Number, default: 0 },
      nombreTuteurs: { type: Number, default: 0 },
      nombreEntreprises: { type: Number, default: 0 },
      nombreEtudiants: { type: Number, default: 0 },
    },

    // ─── Problèmes identifiés ────────────────────────────────────────────
    problemes: [
      {
        description: String,
        nombre: { type: Number, default: 0 },
        // Ex : "Retards de soumission", "Rejets itérés", "Notes insuffisantes"
      },
    ],

    // ─── Recommandations ─────────────────────────────────────────────────
    recommandations: [String],

    // Dernière mise à jour
    dateCalcul: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StageStatistics', StageStatisticsSchema);
