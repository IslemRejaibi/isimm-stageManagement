const express = require('express');
const router = express.Router();
const PFE = require('../models/PFE');
const { auth, autoriser } = require('../middleware/auth.middleware');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/pfe
// Récupérer tous les PFE (filtres optionnels)
// Accessible : tous les rôles authentifiés
// Query params : ?statut=soumis  ?specialite=GL  ?annee=2025-2026
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { statut, specialite, annee } = req.query;

    // Construire le filtre dynamiquement
    const filtre = { isArchived: false };
    if (statut)     filtre.statut             = statut;
    if (specialite) filtre.specialite         = specialite;
    if (annee)      filtre.anneeUniversitaire = annee;

    // Filtrage automatique par rôle
    // Étudiant → seulement son PFE
    // Encadrant → seulement les PFE qu'il encadre
    // Admin → tous les PFE
    if (req.user.role === 'etudiant') {
      filtre.etudiant = req.user.id;
    } else if (req.user.role === 'enseignant') {
      filtre.encadrant = req.user.id;
    }

    const pfes = await PFE.find(filtre)
      .populate('etudiant',  'nom prenom email numeroEtudiant specialite')
      .populate('encadrant', 'nom prenom email departement')
      .sort({ createdAt: -1 });

    res.status(200).json({
      total: pfes.length,
      pfes,
    });

  } catch (err) {
    console.error('Erreur GET /pfe :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/pfe/:id
// Récupérer un PFE par son ID
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const pfe = await PFE.findById(req.params.id)
      .populate('etudiant',  'nom prenom email numeroEtudiant specialite niveau')
      .populate('encadrant', 'nom prenom email departement')
      .populate('jury',      'nom prenom email')
      .populate('commentaires.auteur', 'nom prenom role');

    if (!pfe) {
      return res.status(404).json({ message: 'PFE non trouvé' });
    }

    // Un étudiant ne peut voir que son propre PFE
    if (
      req.user.role === 'etudiant' &&
      pfe.etudiant._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    res.status(200).json({ pfe });

  } catch (err) {
    console.error('Erreur GET /pfe/:id :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pfe
// Soumettre un nouveau PFE
// Accessible : etudiant (soumet son propre PFE), admin
// Body : { titre, description, encadrant, specialite, type, anneeUniversitaire }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', auth, autoriser('etudiant', 'admin'), async (req, res) => {
  try {
    const {
      titre,
      description,
      encadrant,
      specialite,
      type,
      anneeUniversitaire,
    } = req.body;

    // Vérifier les champs obligatoires
    if (!titre || !description || !encadrant || !specialite) {
      return res.status(400).json({
        message: 'Titre, description, encadrant et spécialité sont obligatoires',
      });
    }

    // L'étudiant soumet toujours son propre PFE
    // L'admin peut soumettre pour n'importe quel étudiant
    const etudiantId =
      req.user.role === 'admin' ? req.body.etudiant : req.user.id;

    const pfe = await PFE.create({
      titre,
      description,
      encadrant,
      specialite,
      type:               type              || 'académique',
      anneeUniversitaire: anneeUniversitaire || undefined,
      etudiant:           etudiantId,
      statut:             'soumis',
    });

    await pfe.populate('etudiant',  'nom prenom email');
    await pfe.populate('encadrant', 'nom prenom email');

    res.status(201).json({
      message: 'PFE soumis avec succès',
      pfe,
    });

  } catch (err) {
    // Violation de l'index unique etudiant + anneeUniversitaire
    if (err.code === 11000) {
      return res.status(400).json({
        message: 'Vous avez déjà un PFE pour cette année universitaire',
      });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Erreur POST /pfe :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/pfe/:id
// Modifier un PFE existant
// Accessible : etudiant (son PFE si statut soumis), encadrant, admin
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const pfe = await PFE.findById(req.params.id);

    if (!pfe) {
      return res.status(404).json({ message: 'PFE non trouvé' });
    }

    // Un étudiant ne peut modifier que son propre PFE
    // et seulement si le statut est soumis ou en_revision
    if (req.user.role === 'etudiant') {
      if (pfe.etudiant.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Accès refusé' });
      }
      if (!['soumis', 'en_revision'].includes(pfe.statut)) {
        return res.status(400).json({
          message: 'Impossible de modifier un PFE validé ou refusé',
        });
      }
    }

    // Champs modifiables par l'étudiant
    const champsEtudiant = ['titre', 'description', 'type'];

    // Champs réservés à l'encadrant et à l'admin
    const champsEncadrant = ['encadrant', 'specialite', 'jury', 'dateSoutenance'];

    // Champs réservés à l'admin uniquement
    const champsAdmin = ['note', 'anneeUniversitaire'];

    champsEtudiant.forEach((champ) => {
      if (req.body[champ] !== undefined) pfe[champ] = req.body[champ];
    });

    if (['enseignant', 'admin'].includes(req.user.role)) {
      champsEncadrant.forEach((champ) => {
        if (req.body[champ] !== undefined) pfe[champ] = req.body[champ];
      });
    }

    if (req.user.role === 'admin') {
      champsAdmin.forEach((champ) => {
        if (req.body[champ] !== undefined) pfe[champ] = req.body[champ];
      });
    }

    // save() déclenche pre('save') → mention calculée automatiquement si note modifiée
    await pfe.save();

    await pfe.populate('etudiant',  'nom prenom email');
    await pfe.populate('encadrant', 'nom prenom email');

    res.status(200).json({
      message: 'PFE mis à jour',
      pfe,
    });

  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Erreur PUT /pfe/:id :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/pfe/:id/statut
// Changer le statut d'un PFE avec historique
// Accessible : enseignant (encadrant), admin
// Body : { statut, commentaire }
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/statut', auth, autoriser('enseignant', 'admin'), async (req, res) => {
  try {
    const { statut, commentaire } = req.body;

    if (!statut) {
      return res.status(400).json({ message: 'Le statut est obligatoire' });
    }

    const pfe = await PFE.findById(req.params.id);

    if (!pfe) {
      return res.status(404).json({ message: 'PFE non trouvé' });
    }

    // Un encadrant ne peut changer que le statut des PFE qu'il encadre
    if (
      req.user.role === 'enseignant' &&
      pfe.encadrant.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // changerStatut() : méthode d'instance de PFE.js
    // met à jour statut + historiqueStatuts + save() en une seule ligne
    await pfe.changerStatut(statut, req.user.id, commentaire);

    res.status(200).json({
      message: `Statut mis à jour : ${statut}`,
      pfe,
    });

  } catch (err) {
    console.error('Erreur PUT /pfe/:id/statut :', err);
    res.status(500).json({ message: err.message || 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/pfe/:id/note
// Attribuer une note à un PFE
// Accessible : admin uniquement
// Body : { note }
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/note', auth, autoriser('admin'), async (req, res) => {
  try {
    const { note } = req.body;

    if (note === undefined || note === null) {
      return res.status(400).json({ message: 'La note est obligatoire' });
    }

    const pfe = await PFE.findById(req.params.id);

    if (!pfe) {
      return res.status(404).json({ message: 'PFE non trouvé' });
    }

    pfe.note = note;

    // save() déclenche pre('save') dans PFE.js
    // → mention calculée automatiquement depuis la note
    await pfe.save();

    res.status(200).json({
      message: 'Note attribuée',
      note:    pfe.note,
      mention: pfe.mention,  // calculée automatiquement
      pfe,
    });

  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Erreur PUT /pfe/:id/note :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pfe/:id/commentaires
// Ajouter un commentaire sur un PFE
// Accessible : tous les rôles authentifiés
// Body : { contenu }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/commentaires', auth, async (req, res) => {
  try {
    const { contenu } = req.body;

    if (!contenu) {
      return res.status(400).json({ message: 'Le contenu est obligatoire' });
    }

    const pfe = await PFE.findById(req.params.id);

    if (!pfe) {
      return res.status(404).json({ message: 'PFE non trouvé' });
    }

    pfe.commentaires.push({
      auteur:  req.user.id,
      contenu,
      date:    new Date(),
    });

    await pfe.save();

    res.status(201).json({
      message: 'Commentaire ajouté',
      commentaires: pfe.commentaires,
    });

  } catch (err) {
    console.error('Erreur POST /pfe/:id/commentaires :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/pfe/:id
// Archiver un PFE (soft delete)
// Accessible : admin uniquement
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', auth, autoriser('admin'), async (req, res) => {
  try {
    const pfe = await PFE.findById(req.params.id);

    if (!pfe) {
      return res.status(404).json({ message: 'PFE non trouvé' });
    }

    pfe.isArchived = true;
    await pfe.save();

    res.status(200).json({ message: 'PFE archivé avec succès' });

  } catch (err) {
    console.error('Erreur DELETE /pfe/:id :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;