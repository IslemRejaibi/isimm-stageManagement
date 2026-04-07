const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Utilitaire : générer un token JWT ───────────────────────────────────────
const genererToken = (user) => {
  return jwt.sign(
    {
      id:    user._id,
      role:  user.role,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }   // token valide 7 jours
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// Créer un nouveau compte
// Body : { nom, prenom, email, password, role, numeroEtudiant, specialite, niveau }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const {
      nom,
      prenom,
      email,
      password,
      role,
      numeroEtudiant,
      specialite,
      niveau,
      departement,
      telephone,
    } = req.body;

    // ── 1. Vérifier que les champs obligatoires sont présents ────────────────
    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({
        message: 'Nom, prénom, email et mot de passe sont obligatoires',
      });
    }

    // ── 2. Vérifier que l'email n'est pas déjà utilisé ───────────────────────
    const emailExistant = await User.findOne({ email: email.toLowerCase() });
    if (emailExistant) {
      return res.status(400).json({
        message: 'Cet email est déjà utilisé',
      });
    }

    // ── 3. Vérifier que le numéro étudiant n'est pas déjà utilisé ────────────
    if (numeroEtudiant) {
      const numExistant = await User.findOne({ numeroEtudiant });
      if (numExistant) {
        return res.status(400).json({
          message: 'Ce numéro étudiant est déjà utilisé',
        });
      }
    }

    // ── 4. Créer l'utilisateur ────────────────────────────────────────────────
    // Le mot de passe est haché automatiquement par le middleware pre('save')
    // déclaré dans User.js — tu n'as pas à le faire ici
    const user = await User.create({
      nom,
      prenom,
      email,
      password,
      role:            role          || 'etudiant',
      numeroEtudiant:  numeroEtudiant || undefined,
      specialite:      specialite    || null,
      niveau:          niveau        || null,
      departement:     departement   || null,
      telephone:       telephone     || null,
    });

    // ── 5. Générer le token JWT ───────────────────────────────────────────────
    const token = genererToken(user);

    // ── 6. Renvoyer le token et l'utilisateur (sans le mot de passe) ─────────
    // toJSON() retire automatiquement le password grâce à la config dans User.js
    res.status(201).json({
      message: 'Compte créé avec succès',
      token,
      user: user.toJSON(),
    });

  } catch (err) {

    // Erreur de validation Mongoose (champ requis manquant, enum invalide...)
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }

    // Erreur d'index unique MongoDB (email ou numeroEtudiant en double)
    if (err.code === 11000) {
      const champ = Object.keys(err.keyValue)[0];
      return res.status(400).json({
        message: `La valeur du champ "${champ}" est déjà utilisée`,
      });
    }

    console.error('Erreur register :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Se connecter avec email + mot de passe
// Body : { email, password }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── 1. Vérifier que les champs sont présents ─────────────────────────────
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email et mot de passe sont obligatoires',
      });
    }

    // ── 2. Chercher l'utilisateur par email ──────────────────────────────────
    // .select('+password') est obligatoire car password a select: false dans User.js
    // sans ça, le champ password ne sera pas dans le document retourné
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      // Message volontairement vague — ne pas indiquer si c'est l'email ou le mdp
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // ── 3. Vérifier que le compte est actif ──────────────────────────────────
    if (!user.isActive) {
      return res.status(401).json({ message: 'Ce compte a été désactivé' });
    }

    // ── 4. Comparer le mot de passe saisi avec le hash stocké ────────────────
    // comparePassword() est la méthode d'instance déclarée dans User.js
    const motDePasseCorrect = await user.comparePassword(password);
    if (!motDePasseCorrect) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // ── 5. Générer le token JWT ───────────────────────────────────────────────
    const token = genererToken(user);

    // ── 6. Renvoyer le token et l'utilisateur ────────────────────────────────
    res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: user.toJSON(),
    });

  } catch (err) {
    console.error('Erreur login :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// Récupérer le profil de l'utilisateur connecté
// Header : Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────────────────────
const { auth } = require('../middleware/auth.middleware');

router.get('/me', auth, async (req, res) => {
  try {
    // req.user.id est injecté par auth.middleware après vérification du token
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.status(200).json({ user: user.toJSON() });

  } catch (err) {
    console.error('Erreur /me :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;