const express = require('express');
const router = express.Router();
const Stage = require('../models/Stage');
const { auth, autoriser } = require('../middleware/auth.middleware');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/stages
// Récupérer tous les stages (filtres optionnels)
// Accessible : tous les rôles authentifiés
// Query params : ?statut=en_cours  ?specialite=GL  ?annee=2025-2026
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { statut, specialite, annee } = req.query;

    
    // Construire le filtre dynamiquement selon les query params reçus
    const filtre = { isArchived: false };
    if (statut)    filtre.statut             = statut;
    if (specialite) filtre.specialite        = specialite;
    if (annee)     filtre.anneeUniversitaire = annee;

    // Un étudiant ne voit que SES stages
    // Un tuteur ne voit que les stages qu'il encadre
    // Un admin voit TOUS les stages
    if (req.user.role === 'etudiant') {
      filtre.etudiant = req.user.id;
    } else if (req.user.role === 'tuteur') {
      filtre.tuteur = req.user.id;
    }

    const stages = await Stage.find(filtre)
      .populate('etudiant', 'nom prenom email numeroEtudiant')
      .populate('tuteur',   'nom prenom email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      total: stages.length,
      stages,
    });

  } catch (err) {
    console.error('Erreur GET /stages :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/stages/:id
// Récupérer un stage par son ID
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const stage = await Stage.findById(req.params.id)
      .populate('etudiant', 'nom prenom email numeroEtudiant specialite')
      .populate('tuteur',   'nom prenom email departement')
      .populate('commentaires.auteur', 'nom prenom role');

    if (!stage) {
      return res.status(404).json({ message: 'Stage non trouvé' });
    }

    // Un étudiant ne peut voir que son propre stage
    if (
      req.user.role === 'etudiant' &&
      stage.etudiant._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    res.status(200).json({ stage });

  } catch (err) {
    console.error('Erreur GET /stages/:id :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/stages
// Créer un nouveau stage
// Accessible : etudiant (crée son propre stage), admin
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', auth, autoriser('etudiant', 'admin'), async (req, res) => {
  try {
    const {
      titre,
      description,
      entreprise,
      encadrantEntreprise,
      type,
      specialite,
      anneeUniversitaire,
      dateDebut,
      dateFin,
    } = req.body;

    // L'étudiant crée toujours son propre stage
    // L'admin peut créer un stage pour n'importe quel étudiant
    const etudiantId =
      req.user.role === 'admin' ? req.body.etudiant : req.user.id;

    const stage = await Stage.create({
      titre,
      description,
      entreprise,
      encadrantEntreprise,
      type,
      specialite,
      anneeUniversitaire,
      dateDebut,
      dateFin,
      etudiant: etudiantId,
      statut: 'en_attente',
    });

    // Populate avant de renvoyer
    await stage.populate('etudiant', 'nom prenom email');

    res.status(201).json({
      message: 'Stage créé avec succès',
      stage,
    });

  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Erreur POST /stages :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/stages/:id
// Modifier un stage existant
// Accessible : etudiant (son propre stage), tuteur, admin
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const stage = await Stage.findById(req.params.id);

    if (!stage) {
      return res.status(404).json({ message: 'Stage non trouvé' });
    }

    // Un étudiant ne peut modifier que son propre stage
    // et seulement si le statut est en_attente
    if (req.user.role === 'etudiant') {
      if (stage.etudiant.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Accès refusé' });
      }
      if (stage.statut !== 'en_attente') {
        return res.status(400).json({
          message: 'Impossible de modifier un stage déjà en cours de traitement',
        });
      }
    }

    // Champs modifiables
    const champsModifiables = [
      'titre', 'description', 'entreprise',
      'encadrantEntreprise', 'dateDebut', 'dateFin',
      'type', 'specialite',
    ];

    // Champs réservés à l'admin et au tuteur
    const champsAdmin = ['tuteur', 'note', 'anneeUniversitaire'];

    // Appliquer les modifications
    champsModifiables.forEach((champ) => {
      if (req.body[champ] !== undefined) {
        stage[champ] = req.body[champ];
      }
    });

    if (req.user.role === 'admin' || req.user.role === 'tuteur') {
      champsAdmin.forEach((champ) => {
        if (req.body[champ] !== undefined) {
          stage[champ] = req.body[champ];
        }
      });
    }

    await stage.save(); // déclenche les middlewares pre('save') — mention auto

    await stage.populate('etudiant', 'nom prenom email');
    await stage.populate('tuteur',   'nom prenom email');

    res.status(200).json({
      message: 'Stage mis à jour',
      stage,
    });

  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Erreur PUT /stages/:id :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/stages/:id/statut
// Changer le statut d'un stage avec historique
// Accessible : tuteur, admin
// Body : { statut, commentaire }
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/statut', auth, autoriser('tuteur', 'admin'), async (req, res) => {
  try {
    const { statut, commentaire } = req.body;

    if (!statut) {
      return res.status(400).json({ message: 'Le statut est obligatoire' });
    }

    const stage = await Stage.findById(req.params.id);

    if (!stage) {
      return res.status(404).json({ message: 'Stage non trouvé' });
    }

    // changerStatut() est la méthode d'instance déclarée dans Stage.js
    // elle met à jour statut + historiqueStatuts + save() en une seule ligne
    await stage.changerStatut(statut, req.user.id, commentaire);

    res.status(200).json({
      message: `Statut mis à jour : ${statut}`,
      stage,
    });

  } catch (err) {
    console.error('Erreur PUT /stages/:id/statut :', err);
    res.status(500).json({ message: err.message || 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/stages/:id/commentaires
// Ajouter un commentaire sur un stage
// Accessible : tous les rôles authentifiés
// Body : { contenu }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/commentaires', auth, async (req, res) => {
  try {
    const { contenu } = req.body;

    if (!contenu) {
      return res.status(400).json({ message: 'Le contenu du commentaire est obligatoire' });
    }

    const stage = await Stage.findById(req.params.id);

    if (!stage) {
      return res.status(404).json({ message: 'Stage non trouvé' });
    }

    stage.commentaires.push({
      auteur:  req.user.id,
      contenu,
      date:    new Date(),
    });

    await stage.save();

    res.status(201).json({
      message: 'Commentaire ajouté',
      commentaires: stage.commentaires,
    });

  } catch (err) {
    console.error('Erreur POST /stages/:id/commentaires :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/stages/:id
// Supprimer un stage (archivage soft — isArchived: true)
// Accessible : admin uniquement
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', auth, autoriser('admin'), async (req, res) => {
  try {
    const stage = await Stage.findById(req.params.id);

    if (!stage) {
      return res.status(404).json({ message: 'Stage non trouvé' });
    }

    // Soft delete — on archive au lieu de supprimer définitivement
    // Les données restent en base pour l'historique
    stage.isArchived = true;
    await stage.save();

    res.status(200).json({ message: 'Stage archivé avec succès' });

  } catch (err) {
    console.error('Erreur DELETE /stages/:id :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;