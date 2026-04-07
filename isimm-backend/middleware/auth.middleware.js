const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─────────────────────────────────────────────────────────────────────────────
// Middleware principal : vérifier le token JWT
// Utilisation : router.get('/route', auth, maFonction)
// ─────────────────────────────────────────────────────────────────────────────
const auth = async (req, res, next) => {
  try {

    // ── 1. Lire le token depuis le header Authorization ──────────────────────
    // Le frontend envoie : Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Accès refusé — token manquant',
      });
    }

    // Extraire le token — "Bearer eyJhbG..." → "eyJhbG..."
    const token = authHeader.split(' ')[1];

    // ── 2. Vérifier et décoder le token ──────────────────────────────────────
    // jwt.verify() lance une exception si :
    //   - le token est falsifié (mauvaise signature)
    //   - le token est expiré (expiresIn dépassé)
    //   - le token est malformé
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { id: '664f...', role: 'etudiant', email: '...', iat: ..., exp: ... }

    // ── 3. Vérifier que l'utilisateur existe toujours en base ────────────────
    // Cas possible : token valide mais utilisateur supprimé entre-temps
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: 'Utilisateur non trouvé — token invalide',
      });
    }

    // ── 4. Vérifier que le compte est actif ──────────────────────────────────
    if (!user.isActive) {
      return res.status(401).json({
        message: 'Ce compte a été désactivé',
      });
    }

    // ── 5. Attacher l'utilisateur à req pour les routes suivantes ────────────
    // Toutes les routes protégées peuvent accéder à req.user
    req.user = {
      id:    user._id,
      role:  user.role,
      email: user.email,
      nom:   user.nom,
      prenom: user.prenom,
    };

    // ── 6. Passer à la route suivante ────────────────────────────────────────
    next();

  } catch (err) {

    // Token expiré
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Session expirée — veuillez vous reconnecter',
      });
    }

    // Token falsifié ou malformé
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Token invalide',
      });
    }

    console.error('Erreur middleware auth :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Middleware : restreindre l'accès par rôle
// Utilisation : router.delete('/route', auth, autoriser('admin'), maFonction)
// ─────────────────────────────────────────────────────────────────────────────
const autoriser = (...roles) => {
  return (req, res, next) => {
    // autoriser() est toujours appelé après auth
    // donc req.user existe forcément ici
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Accès refusé — rôle requis : ${roles.join(' ou ')}`,
      });
    }
    next();
  };
};

module.exports = { auth, autoriser };