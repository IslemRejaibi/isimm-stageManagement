const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ─── Middlewares globaux ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // pour les formulaires

// ─── Import des routes ────────────────────────────────────────────────────────
const authRoutes  = require('./routes/auth.routes');
const stageRoutes = require('./routes/stage.routes');
const pfeRoutes   = require('./routes/pfe.routes');

// ─── Branchement des routes ───────────────────────────────────────────────────
//
// Toutes les routes auth  → /api/auth/register, /api/auth/login, /api/auth/me
// Toutes les routes stage → /api/stages, /api/stages/:id ...
// Toutes les routes pfe   → /api/pfe,    /api/pfe/:id    ...
//
app.use('/api/auth',   authRoutes);
app.use('/api/stages', stageRoutes);
app.use('/api/pfe',    pfeRoutes);
app.use('/uploads',    express.static(path.join(__dirname, 'uploads')));

// ─── Route de santé ───────────────────────────────────────────────────────────
// Tester que le serveur tourne : GET http://localhost:5000/api/health
app.get('/api/health', (req, res) => {
  res.json({
    status:    'ok',
    message:   'Serveur ISIMM opérationnel',
    timestamp: new Date().toISOString(),
  });
});

// ─── Route inconnue (404) ─────────────────────────────────────────────────────
// Toute URL qui ne correspond à aucune route définie
app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} introuvable`,
  });
});

// ─── Gestionnaire d'erreurs global ───────────────────────────────────────────
// Intercepte toutes les erreurs non gérées dans les routes
app.use((err, req, res, next) => {
  console.error('Erreur non gérée :', err);
  res.status(500).json({
    message: 'Erreur serveur interne',
  });
});

// ─── Connexion MongoDB puis démarrage du serveur ──────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connecté');
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Serveur lancé sur http://localhost:${process.env.PORT}`);
      console.log(`📋 Routes disponibles :`);
      console.log(`   POST   http://localhost:${process.env.PORT}/api/auth/register`);
      console.log(`   POST   http://localhost:${process.env.PORT}/api/auth/login`);
      console.log(`   GET    http://localhost:${process.env.PORT}/api/auth/me`);
      console.log(`   GET    http://localhost:${process.env.PORT}/api/stages`);
      console.log(`   GET    http://localhost:${process.env.PORT}/api/pfe`);
      console.log(`   GET    http://localhost:${process.env.PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ Erreur de connexion MongoDB :', err.message);
    process.exit(1); // arrêter le processus si MongoDB est inaccessible
  });