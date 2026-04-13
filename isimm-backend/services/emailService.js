const nodemailer = require('nodemailer');

// ─────────────────────────────────────────────────────────────────────────────
// Configuration du transporter email
// À configurer selon votre service email (Gmail, SendGrid, etc.)
// ─────────────────────────────────────────────────────────────────────────────

// Example : Gmail avec mot de passe d'application
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'votre-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'votre-mot-de-passe',
  },
});

// Ou : Service générique SMTP
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST || 'smtp.yourdomain.com',
//   port: process.env.SMTP_PORT || 587,
//   secure: false,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

// ─────────────────────────────────────────────────────────────────────────────
// Notification : Nouveau stage créé
// ─────────────────────────────────────────────────────────────────────────────
exports.notifyNewStageCreated = async (stage, etudiant) => {
  const subject = `Confirmation : demande de stage "${stage.titre}" créée`;

  const htmlContent = `
    <h1>Demande de stage créée avec succès</h1>
    <p>Bonjour ${etudiant.prenom} ${etudiant.nom},</p>
    <p>Votre demande de stage a été créée et mise en attente d'approbation de l'administration.</p>
    
    <h2>Détails de votre demande :</h2>
    <ul>
      <li><strong>Titre :</strong> ${stage.titre}</li>
      <li><strong>Entreprise :</strong> ${stage.entreprise.nom}</li>
      <li><strong>Dates :</strong> ${new Date(stage.dateDebut).toLocaleDateString('fr-FR')} au ${new Date(stage.dateFin).toLocaleDateString('fr-FR')}</li>
      <li><strong>Statut :</strong> <span style="color: orange;">En attente</span></li>
    </ul>
    
    <p>Vous recevrez une notification dès que l'administration aura examiné votre demande.</p>
    <p>Cordialement,<br/>L'équipe ISIMM</p>
  `;

  return sendEmail(etudiant.email, subject, htmlContent);
};

// ─────────────────────────────────────────────────────────────────────────────
// Notification : Changement de statut du stage
// ─────────────────────────────────────────────────────────────────────────────
exports.notifyStageStatusChanged = async (stage, etudiant, nouveauStatut, commentaire = null) => {
  const statusLabels = {
    en_attente: 'En attente',
    en_cours: 'En cours',
    terminé: 'Terminé',
    validé: 'Validé',
    refusé: 'Refusé',
  };

  const statusColors = {
    en_attente: '#FFA500',
    en_cours: '#4169E1',
    terminé: '#9370DB',
    validé: '#32CD32',
    refusé: '#DC143C',
  };

  const subject = `Mise à jour : votre stage "${stage.titre}" est ${statusLabels[nouveauStatut]}`;

  let htmlContent = `
    <h1>Mise à jour de votre demande de stage</h1>
    <p>Bonjour ${etudiant.prenom} ${etudiant.nom},</p>
    <p>Le statut de votre demande de stage a été mis à jour.</p>
    
    <h2>Nouvelle situation :</h2>
    <p><strong>Statut :</strong> <span style="color: ${statusColors[nouveauStatut]}; font-size: 1.2em;">${statusLabels[nouveauStatut]}</span></p>
  `;

  if (commentaire) {
    htmlContent += `<p><strong>Commentaire :</strong> ${commentaire}</p>`;
  }

  htmlContent += `
    <h2>Détails du stage :</h2>
    <ul>
      <li><strong>Titre :</strong> ${stage.titre}</li>
      <li><strong>Entreprise :</strong> ${stage.entreprise.nom}</li>
      <li><strong>Dates :</strong> ${new Date(stage.dateDebut).toLocaleDateString('fr-FR')} au ${new Date(stage.dateFin).toLocaleDateString('fr-FR')}</li>
    </ul>
    
    <p>Connectez-vous à votre compte ISIMM pour plus de détails.</p>
    <p>Cordialement,<br/>L'équipe ISIMM</p>
  `;

  return sendEmail(etudiant.email, subject, htmlContent);
};

// ─────────────────────────────────────────────────────────────────────────────
// Notification : Tuteur assigné
// ─────────────────────────────────────────────────────────────────────────────
exports.notifyTutorAssigned = async (stage, etudiant, tuteur) => {
  const subject = `Votre tuteur de stage a été assigné : ${tuteur.prenom} ${tuteur.nom}`;

  const htmlContent = `
    <h1>Assignation de tuteur</h1>
    <p>Bonjour ${etudiant.prenom} ${etudiant.nom},</p>
    <p>Un tuteur académique a été assigné à votre stage.</p>
    
    <h2>Informations du tuteur :</h2>
    <ul>
      <li><strong>Nom :</strong> ${tuteur.prenom} ${tuteur.nom}</li>
      <li><strong>Email :</strong> ${tuteur.email}</li>
      ${tuteur.departement ? `<li><strong>Département :</strong> ${tuteur.departement}</li>` : ''}
    </ul>
    
    <p>Vous pouvez à présent envoyer vos rapports d'avancement à votre tuteur.</p>
    <p>Cordialement,<br/>L'équipe ISIMM</p>
  `;

  return sendEmail(etudiant.email, subject, htmlContent);
};

// ─────────────────────────────────────────────────────────────────────────────
// Notification : Tuteur reçoit un rapport d'avancement
// ─────────────────────────────────────────────────────────────────────────────
exports.notifyProgressReportSubmitted = async (stage, etudiant, tuteur, semaine) => {
  const subject = `Rapport d'avancement semaine ${semaine} reçu pour le stage "${stage.titre}"`;

  const htmlContent = `
    <h1>Nouveau rapport d'avancement</h1>
    <p>Bonjour ${tuteur.prenom} ${tuteur.nom},</p>
    <p>${etudiant.prenom} ${etudiant.nom} a soumis un rapport pour la semaine ${semaine} de son stage.</p>
    
    <h2>Informations :</h2>
    <ul>
      <li><strong>Étudiant :</strong> ${etudiant.prenom} ${etudiant.nom}</li>
      <li><strong>Stage :</strong> ${stage.titre}</li>
      <li><strong>Entreprise :</strong> ${stage.entreprise.nom}</li>
      <li><strong>Semaine :</strong> ${semaine}</li>
    </ul>
    
    <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/stages/${stage._id}" style="padding: 10px 20px; background: #4169E1; color: white; text-decoration: none; border-radius: 5px;">Consulter le rapport</a></p>
    <p>Cordialement,<br/>L'équipe ISIMM</p>
  `;

  return sendEmail(tuteur.email, subject, htmlContent);
};

// ─────────────────────────────────────────────────────────────────────────────
// Notification : Document rejeté
// ─────────────────────────────────────────────────────────────────────────────
exports.notifyDocumentRejected = async (stage, etudiant, typeDocument, raisonRejet, commentaire) => {
  const documentLabels = {
    rapport_stage: 'Rapport de stage',
    attestation_stage: 'Attestation de stage',
    convention: 'Convention de stage',
    lettre_motivation: 'Lettre de motivation',
  };

  const subject = `Attention : votre ${documentLabels[typeDocument]} a été rejeté`;

  let htmlContent = `
    <h1>Document rejeté</h1>
    <p>Bonjour ${etudiant.prenom} ${etudiant.nom},</p>
    <p>Nous regrettons de vous informer que your ${documentLabels[typeDocument]} a été rejeté.</p>
    
    <h2>Raison du rejet :</h2>
    <p>${raisonRejet || 'Non spécifiée'}</p>
  `;

  if (commentaire) {
    htmlContent += `<h2>Commentaire :</h2><p>${commentaire}</p>`;
  }

  htmlContent += `
    <p>Veuillez corriger votre document et le soumettre à nouveau.</p>
    <p>Cordialement,<br/>L'équipe ISIMM</p>
  `;

  return sendEmail(etudiant.email, subject, htmlContent);
};

// ─────────────────────────────────────────────────────────────────────────────
// Notification : Document approuvé
// ─────────────────────────────────────────────────────────────────────────────
exports.notifyDocumentApproved = async (stage, etudiant, typeDocument) => {
  const documentLabels = {
    rapport_stage: 'Rapport de stage',
    attestation_stage: 'Attestation de stage',
    convention: 'Convention de stage',
    lettre_motivation: 'Lettre de motivation',
  };

  const subject = `Document approuvé : ${documentLabels[typeDocument]}`;

  const htmlContent = `
    <h1>Document approuvé</h1>
    <p>Bonjour ${etudiant.prenom} ${etudiant.nom},</p>
    <p>Votre ${documentLabels[typeDocument]} a été approuvé et accepté.</p>
    
    <p>Félicitations !<br/>Cordialement,<br/>L'équipe ISIMM</p>
  `;

  return sendEmail(etudiant.email, subject, htmlContent);
};

// ─────────────────────────────────────────────────────────────────────────────
// Notification : Évaluation complétée
// ─────────────────────────────────────────────────────────────────────────────
exports.notifyEvaluationCompleted = async (stage, etudiant, evaluateurType, note) => {
  const evaluatorLabel = evaluateurType === 'tuteur_universitaire' ? 'tuteur universitaire' : 'encadrant en entreprise';

  const subject = `Votre stage a été évalué par le ${evaluatorLabel}`;

  const htmlContent = `
    <h1>Évaluation reçue</h1>
    <p>Bonjour ${etudiant.prenom} ${etudiant.nom},</p>
    <p>Le ${evaluatorLabel} a complété l'évaluation de votre stage.</p>
    
    <h2>Note reçue :</h2>
    <p style="font-size: 1.5em; color: #4169E1;"><strong>${note}/20</strong></p>
    
    <p>L'administration compilera les évaluations pour déterminer votre note finale.</p>
    <p>Cordialement,<br/>L'équipe ISIMM</p>
  `;

  return sendEmail(etudiant.email, subject, htmlContent);
};

// ─────────────────────────────────────────────────────────────────────────────
// Notification : Stage validé et ECTS attribués
// ─────────────────────────────────────────────────────────────────────────────
exports.notifyStageValidated = async (stage, etudiant, noteFinale, creditsECTS, mention) => {
  const subject = `Félicitations ! Votre stage a été validé (${creditsECTS} ECTS)`;

  const htmlContent = `
    <h1>Validation officielle du stage</h1>
    <p>Bonjour ${etudiant.prenom} ${etudiant.nom},</p>
    <p>Nous sommes heureux de vous annoncer que votre stage a été validé par l'établissement !</p>
    
    <h2>Résultats finaux :</h2>
    <ul>
      <li><strong>Note finale :</strong> ${noteFinale}/20</li>
      <li><strong>Mention :</strong> <strong>${mention}</strong></li>
      <li><strong>Crédits ECTS :</strong> <strong>${creditsECTS}</strong></li>
    </ul>
    
    <p>Une attestation officielle a été générée et sera disponible dans votre compte.</p>
    <p>Félicitations pour votre réussite !<br/>L'équipe ISIMM</p>
  `;

  return sendEmail(etudiant.email, subject, htmlContent);
};

// ─────────────────────────────────────────────────────────────────────────────
// Fonction utilitaire : envoyer un email
// ─────────────────────────────────────────────────────────────────────────────
async function sendEmail(to, subject, htmlContent) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@isimm.edu',
      to,
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email envoyé à ${to}: ${info.response}`);
    return true;
  } catch (err) {
    console.error(`Erreur lors de l'envoi d'email à ${to}:`, err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test de connexion
// ─────────────────────────────────────────────────────────────────────────────
exports.testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('✓ Email service is ready to send messages');
    return true;
  } catch (err) {
    console.error('✗ Email service error:', err.message);
    return false;
  }
};
