import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

interface StageDetailsModel {
  _id: string;
  titre: string;
  description?: string;
  entreprise: { nom: string; adresse?: string; secteur?: string; emailContact?: string; telephoneContact?: string };
  encadrantEntreprise?: { nom?: string; poste?: string; email?: string };
  tuteur?: { nom: string; prenom: string; email?: string };
  type: string;
  specialite: string;
  statut: string;
  dateDebut: string;
  dateFin: string;
  historiqueStatuts: Array<{ statut: string; date: string; commentaire?: string }>;
  rapport?: { url?: string; nomFichier?: string; taille?: number; dateDepot?: string };
  attestation?: { url?: string; dateDepot?: string };
  attestationOfficielle?: { url?: string; dateEmission?: string };
  creditsECTS?: number;
}

interface ProgressReportModel {
  _id: string;
  semaine: number;
  tachesRealises: string;
  difficultesRencontrees?: string;
  tachesPreves?: string;
  observations?: string;
  statut: string;
  dateRemiseReel?: string;
  commentaireTuteur?: { texte?: string; date?: string };
}

interface DocumentValidationModel {
  _id: string;
  typeDocument: string;
  statut: string;
  document: { url: string; nomFichier: string };
  validationPar?: { nom: string; prenom: string };
  dateValidation?: string;
}

const StageDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [stage, setStage] = useState<StageDetailsModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<'etudiant' | 'tuteur' | 'enseignant' | 'admin' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [tuteurEmail, setTuteurEmail] = useState('');
  const [documents, setDocuments] = useState<DocumentValidationModel[]>([]);
  const [reports, setReports] = useState<ProgressReportModel[]>([]);
  const [semaine, setSemaine] = useState<number>(1);
  const [tachesRealises, setTachesRealises] = useState('');
  const [difficultesRencontrees, setDifficultesRencontrees] = useState('');
  const [tachesPreves, setTachesPreves] = useState('');
  const [observations, setObservations] = useState('');
  const [statutRapport, setStatutRapport] = useState<'brouillon' | 'soumis'>('soumis');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [tuteurCommentaire, setTuteurCommentaire] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedReport, setSelectedReport] = useState<ProgressReportModel | null>(null);

  useEffect(() => {
    if (id) {
      fetchUserRole();
      fetchStage();
      fetchDocumentValidations();
      fetchProgressReports();
    }
  }, [id]);

  const fetchUserRole = async () => {
    try {
      const response = await api.get('/auth/me');
      setUserRole(response.data.user.role);
    } catch (err: any) {
      console.warn('Impossible de récupérer le rôle utilisateur', err);
    }
  };

  const fetchStage = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/stages/${id}`);
      setStage(response.data.stage);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Impossible de charger les détails du stage');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentValidations = async () => {
    if (!id) return;
    try {
      const response = await api.get('/document-validations', {
        params: { stageId: id },
      });
      setDocuments(response.data.documents || []);
    } catch (err: any) {
      console.warn('Impossible de charger les validations de documents', err);
    }
  };

  const fetchProgressReports = async () => {
    if (!id) return;
    try {
      const response = await api.get('/progress-reports', {
        params: { stageId: id },
      });
      setReports(response.data.rapports || []);
    } catch (err: any) {
      console.warn('Impossible de charger les rapports', err);
    }
  };

  const updateStageStatus = async (statut: 'validé' | 'refusé') => {
    if (!id) return;
    try {
      setActionLoading(true);
      await api.put(`/stages/${id}/statut`, {
        statut,
        commentaire: statut === 'validé' ? 'Validation admin' : 'Rejet admin',
      });
      await fetchStage();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du statut');
    } finally {
      setActionLoading(false);
    }
  };

  const assignTutor = async () => {
    if (!id || !tuteurEmail) return;

    const email = tuteurEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez saisir une adresse email de tuteur valide.');
      setSuccessMessage('');
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      setSuccessMessage('');
      await api.put(`/stages/${id}`, { tuteurEmail: email });
      await fetchStage();
      setTuteurEmail('');
      setSuccessMessage('Tuteur affecté avec succès.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l’affectation du tuteur');
      setSuccessMessage('');
    } finally {
      setActionLoading(false);
    }
  };

  const submitReport = async () => {
    if (!id || !tachesRealises.trim()) {
      setError('Le champ tâches réalisées est requis');
      setSuccessMessage('');
      return;
    }

    try {
      setReportSubmitting(true);
      setError('');
      setSuccessMessage('');
      await api.post('/progress-reports', {
        stageId: id,
        semaine,
        tachesRealises,
        difficultesRencontrees,
        tachesPreves,
        observations,
        statut: statutRapport,
      });
      setTachesRealises('');
      setDifficultesRencontrees('');
      setTachesPreves('');
      setObservations('');
      setStatutRapport('soumis');
      setSemaine((prev) => prev + 1);
      await fetchProgressReports();
      setSuccessMessage(statutRapport === 'soumis' ? 'Le rapport a bien été soumis.' : 'Le brouillon a bien été enregistré.');
    } catch (err: any) {
      const serverMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      setError(serverMessage || 'Erreur lors de la soumission du rapport');
      setSuccessMessage('');
    } finally {
      setReportSubmitting(false);
    }
  };

  const submitDraftReport = async (rapportId: string) => {
    if (!rapportId) return;

    try {
      setActionLoading(true);
      setError('');
      setSuccessMessage('');

      await api.patch(`/progress-reports/${rapportId}/submit`);
      await fetchProgressReports();
      setSuccessMessage('Le brouillon a été soumis.');
    } catch (err: any) {
      const serverMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      setError(serverMessage || 'Erreur lors de la soumission du brouillon');
      setSuccessMessage('');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteDraftReport = async (rapportId: string) => {
    if (!rapportId) return;

    try {
      setActionLoading(true);
      setError('');
      setSuccessMessage('');

      await api.delete(`/progress-reports/${rapportId}`);
      await fetchProgressReports();
      setSuccessMessage('Le brouillon a été supprimé.');
    } catch (err: any) {
      const serverMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      setError(serverMessage || 'Erreur lors de la suppression du brouillon');
      setSuccessMessage('');
    } finally {
      setActionLoading(false);
    }
  };

  const validateReport = async (rapportId: string) => {
    if (!rapportId) return;

    try {
      setActionLoading(true);
      setError('');
      setSuccessMessage('');

      const response = await api.patch(`/progress-reports/${rapportId}/comment-tuteur`, {
        texte: tuteurCommentaire.trim() || 'Vu et validé',
      });

      await fetchProgressReports();
      await fetchStage();

      setSuccessMessage(response.data.message || 'Rapport validé par le tuteur.');
      setTuteurCommentaire('');
      setSelectedReport(null);
    } catch (err: any) {
      const serverMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      setError(serverMessage || 'Erreur lors de la validation du rapport');
      setSuccessMessage('');
    } finally {
      setActionLoading(false);
    }
  };

  const statusClass = stage ? (
    stage.statut === 'validé' ? 'bg-emerald-100 text-emerald-700' :
    stage.statut === 'en_cours' ? 'bg-blue-100 text-blue-700' :
    stage.statut === 'en_attente' ? 'bg-amber-100 text-amber-700' :
    'bg-slate-100 text-slate-700'
  ) : 'bg-slate-100 text-slate-700';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app px-4 py-10">
        <div className="text-lg text-muted">Chargement du stage...</div>
      </div>
    );
  }

  if (!stage) {
    return (
      <div className="min-h-screen bg-app px-4 py-10">
        <div className="mx-auto max-w-4xl app-card p-10">
          <h1 className="text-3xl font-semibold text-slate-900">Détails du stage</h1>
          <p className="mt-4 text-slate-600">Stage introuvable.</p>
          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="page-header">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Détails du stage</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">{stage.entreprise.nom} - {stage.type.replace('_', ' ')}</h1>
              <p className="mt-2 text-slate-500">{stage.description || 'Aucune description disponible.'}</p>
              {error && (
                <div className="mt-4 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}
              {successMessage && (
                <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  {successMessage}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {userRole === 'admin' && stage.statut === 'en_attente' && (
                <>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => updateStageStatus('validé')}
                    className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? '...' : 'Valider'}
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => updateStageStatus('refusé')}
                    className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? '...' : 'Refuser'}
                  </button>
                </>
              )}
              <span className={`rounded-full px-4 py-2 text-sm font-semibold ${statusClass}`}>{stage.statut}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
          <div className="space-y-6">
            <section className="app-card p-8">
              <h2 className="text-xl font-semibold text-slate-900">Description du stage</h2>
              <p className="mt-4 text-slate-600">{stage.description || 'Aucune description fournie.'}</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Période</p>
                  <p className="mt-2 font-semibold text-slate-900">{new Date(stage.dateDebut).toLocaleDateString('fr-FR')} – {new Date(stage.dateFin).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Spécialité</p>
                  <p className="mt-2 font-semibold text-slate-900">{stage.specialite}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Encadrant entreprise</p>
                  <p className="mt-2 font-semibold text-slate-900">{stage.encadrantEntreprise?.nom || 'Non renseigné'}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Type de stage</p>
                  <p className="mt-2 font-semibold text-slate-900">{stage.type.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Crédits ECTS</p>
                  <p className="mt-2 font-semibold text-slate-900">{stage.creditsECTS || 0}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Attestation officielle</p>
                  <p className="mt-2 font-semibold text-slate-900">{stage.attestationOfficielle?.dateEmission ? new Date(stage.attestationOfficielle.dateEmission).toLocaleDateString('fr-FR') : 'Non générée'}</p>
                </div>
              </div>
            </section>

            <section className="app-card p-8">
              <h2 className="text-xl font-semibold text-slate-900">Documents</h2>
              <div className="mt-6 space-y-4">
                {stage.rapport?.url && (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-900">Rapport de stage</p>
                    <a href={stage.rapport.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {stage.rapport.nomFichier}
                    </a>
                  </div>
                )}
                {stage.attestation?.url && (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-900">Attestation de stage</p>
                    <a href={stage.attestation.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Télécharger l'attestation
                    </a>
                  </div>
                )}
                {!stage.rapport?.url && !stage.attestation?.url && (
                  <p className="text-slate-600">Aucun document déposé pour ce stage.</p>
                )}
                {documents.length > 0 && (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-900">Validations de documents</p>
                    <div className="mt-4 space-y-3">
                      {documents.map((doc) => (
                        <div key={doc._id} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="font-medium text-slate-900">{doc.typeDocument.replace('_', ' ')}</p>
                          <p className="text-sm text-slate-500">{doc.document.nomFichier}</p>
                          <p className="text-sm text-slate-500">Statut : {doc.statut}</p>
                          {doc.validationPar && (
                            <p className="text-sm text-slate-500">Validé par : {doc.validationPar.nom} {doc.validationPar.prenom}</p>
                          )}
                          {doc.dateValidation && (
                            <p className="text-sm text-slate-500">Date : {new Date(doc.dateValidation).toLocaleDateString('fr-FR')}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="app-card p-8">
              <h2 className="text-xl font-semibold text-slate-900">Tuteur universitaire</h2>
              <p className="mt-4 text-slate-600">{stage.tuteur ? `${stage.tuteur.prenom} ${stage.tuteur.nom}` : 'Non renseigné'}</p>
              {stage.tuteur?.email && (
                <p className="mt-2 text-sm text-sky-700">{stage.tuteur.email}</p>
              )}
              {userRole === 'admin' && (
                <div className="mt-5 space-y-3">
                  <p className="text-sm text-slate-500">
                    {stage.tuteur ? 'Changer le tuteur par email :' : 'Affecter un tuteur par email :'}
                  </p>
                  {stage.tuteur && (
                    <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">
                      Le tuteur actuel sera remplacé par l’adresse email fournie.
                    </div>
                  )}                  {!stage.tuteur && stage.statut === 'validé' && (
                    <div className="rounded-3xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
                      💡 L'affectation d'un tuteur déclenchera automatiquement le passage du stage en phase active (statut "en cours").
                    </div>
                  )}                  <div className="flex flex-col gap-3">
                    <input
                      type="email"
                      value={tuteurEmail}
                      onChange={(e) => setTuteurEmail(e.target.value)}
                      placeholder="tuteur@example.com"
                      className="input-field"
                    />
                    <button
                      type="button"
                      onClick={assignTutor}
                      disabled={actionLoading || !tuteurEmail}
                      className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      {actionLoading ? '...' : stage.tuteur ? 'Changer le tuteur' : 'Affecter le tuteur'}
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section className="app-card p-8">
              <h2 className="text-xl font-semibold text-slate-900">Informations entreprise</h2>
              <div className="mt-4 space-y-3 text-slate-600">
                <p><strong>Nom :</strong> {stage.entreprise.nom}</p>
                {stage.entreprise.adresse && <p><strong>Adresse :</strong> {stage.entreprise.adresse}</p>}
                {stage.entreprise.secteur && <p><strong>Secteur :</strong> {stage.entreprise.secteur}</p>}
                {stage.entreprise.emailContact && <p><strong>Email :</strong> {stage.entreprise.emailContact}</p>}
                {stage.entreprise.telephoneContact && <p><strong>Téléphone :</strong> {stage.entreprise.telephoneContact}</p>}
              </div>
            </section>

            <section className="app-card p-8">
              <h2 className="text-xl font-semibold text-slate-900">Rapports d'avancement</h2>
              <div className="mt-6 space-y-4">
                {reports.length === 0 ? (
                  <p className="text-slate-600">Aucun rapport soumis pour l'instant.</p>
                ) : (
                  [...reports].sort((a, b) => b.semaine - a.semaine).map((rapport) => (
                    <div
                      key={rapport._id}
                      className="cursor-pointer rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:bg-slate-100"
                      onClick={() => setSelectedReport(selectedReport?._id === rapport._id ? null : rapport)}
                    >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-slate-900">Semaine {rapport.semaine}</p>
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                            rapport.statut === 'soumis' ? 'bg-blue-100 text-blue-700' :
                            rapport.statut === 'vu_tuteur' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {rapport.statut === 'soumis' ? 'Soumis' : rapport.statut === 'vu_tuteur' ? 'Vu par tuteur' : rapport.statut}
                          </span>
                        </div>
                        {rapport.dateRemiseReel && (
                          <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Soumis le {new Date(rapport.dateRemiseReel).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                      <svg
                        className={`h-5 w-5 transition-transform text-slate-400 ${selectedReport?._id === rapport._id ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-slate-600 leading-relaxed overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{rapport.tachesRealises}</p>
                    </div>
                    {(userRole === 'tuteur' || userRole === 'enseignant' || userRole === 'admin') && rapport.statut === 'soumis' && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const isCurrentlySelected = selectedReport && selectedReport._id === rapport._id;
                            const newSelected = isCurrentlySelected ? null : rapport;
                            if (selectedReport && newSelected && selectedReport._id !== newSelected._id) {
                              setTuteurCommentaire('');
                            } else if (!newSelected) {
                              setTuteurCommentaire('');
                            }
                            setSelectedReport(newSelected);
                          }}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          {selectedReport?._id === rapport._id ? 'Masquer détails' : 'Voir détails'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            validateReport(rapport._id);
                          }}
                          disabled={actionLoading}
                          className="rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {actionLoading ? '...' : 'Valider maintenant'}
                        </button>
                      </div>
                    )}
                    {selectedReport?._id === rapport._id && (
                        <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-3">
                              <div>
                                <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                  <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                  Tâches réalisées
                                </h4>
                                <div className="rounded-lg bg-white p-3 border border-slate-200">
                                  <p className="text-sm text-slate-700 leading-relaxed">{rapport.tachesRealises}</p>
                                </div>
                              </div>
                              {rapport.tachesPreves && (
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                    <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Tâches prévues
                                  </h4>
                                  <div className="rounded-lg bg-white p-3 border border-slate-200">
                                    <p className="text-sm text-slate-700 leading-relaxed">{rapport.tachesPreves}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="space-y-3">
                              {rapport.difficultesRencontrees && (
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                    <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    Difficultés rencontrées
                                  </h4>
                                  <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
                                    <p className="text-sm text-slate-700 leading-relaxed">{rapport.difficultesRencontrees}</p>
                                  </div>
                                </div>
                              )}
                              {rapport.observations && (
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                    <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    Observations
                                  </h4>
                                  <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
                                    <p className="text-sm text-slate-700 leading-relaxed">{rapport.observations}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {(userRole === 'tuteur' || userRole === 'enseignant' || userRole === 'admin') && rapport.statut === 'soumis' && (
                            <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                              <p className="text-sm font-semibold text-slate-900">Validation du rapport</p>
                              <p className="text-sm text-slate-600">Vous pouvez ajouter un commentaire et marquer ce rapport comme vu par le tuteur.</p>
                              <textarea
                                value={tuteurCommentaire}
                                onChange={(e) => setTuteurCommentaire(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onFocus={(e) => e.stopPropagation()}
                                rows={3}
                                placeholder="Commentaire du tuteur..."
                                className="mt-2 input-field"
                              />
                              <button
                                type="button"
                                onClick={() => validateReport(rapport._id)}
                                disabled={actionLoading}
                                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {actionLoading ? '...' : 'Marquer comme vu par le tuteur'}
                              </button>
                            </div>
                          )}

                          {rapport.commentaireTuteur?.texte && (
                            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-slate-700">
                              <p className="text-sm font-semibold text-slate-900">Commentaire tuteur</p>
                              <p className="mt-2 text-sm">{rapport.commentaireTuteur.texte}</p>
                              {rapport.commentaireTuteur.date && (
                                <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                                  {new Date(rapport.commentaireTuteur.date).toLocaleDateString('fr-FR')}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {userRole === 'etudiant' && rapport.statut === 'brouillon' && (
                        <div className="mt-4 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-semibold text-slate-900">Actions sur le brouillon</p>
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => submitDraftReport(rapport._id)}
                              disabled={actionLoading}
                              className="rounded-full bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                            >
                              {actionLoading ? '...' : 'Soumettre le brouillon'}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteDraftReport(rapport._id)}
                              disabled={actionLoading}
                              className="rounded-full border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              Supprimer le brouillon
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
            {userRole === 'etudiant' && (
              <section className="app-card p-8">
                <h2 className="text-xl font-semibold text-slate-900">Nouveau rapport</h2>
                <div className="mt-6 space-y-4">
                  <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <p className="font-medium text-slate-900">Créer ce rapport comme :</p>
                    <div className="flex flex-wrap gap-3">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          name="statutRapport"
                          value="soumis"
                          checked={statutRapport === 'soumis'}
                          onChange={() => setStatutRapport('soumis')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span>Soumis</span>
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          name="statutRapport"
                          value="brouillon"
                          checked={statutRapport === 'brouillon'}
                          onChange={() => setStatutRapport('brouillon')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span>Brouillon</span>
                      </label>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Semaine</span>
                      <input
                        type="number"
                        min={1}
                        max={52}
                        value={semaine}
                        onChange={(e) => setSemaine(Number(e.target.value))}
                        className="mt-2 input-field"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Tâches réalisées</span>
                      <textarea
                        value={tachesRealises}
                        onChange={(e) => setTachesRealises(e.target.value)}
                        rows={3}
                        className="mt-2 input-field"
                      />
                    </label>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Difficultés rencontrées</span>
                      <textarea
                        value={difficultesRencontrees}
                        onChange={(e) => setDifficultesRencontrees(e.target.value)}
                        rows={3}
                        className="mt-2 input-field"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-700">Tâches prévues</span>
                      <textarea
                        value={tachesPreves}
                        onChange={(e) => setTachesPreves(e.target.value)}
                        rows={3}
                        className="mt-2 input-field"
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Observations</span>
                    <textarea
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      rows={3}
                      className="mt-2 input-field"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={submitReport}
                    disabled={reportSubmitting}
                    className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {reportSubmitting ? 'Envoi...' : 'Soumettre le rapport'}
                  </button>
                </div>
              </section>
            )}
            <section className="app-card p-8">
              <h2 className="text-xl font-semibold text-slate-900">Historique</h2>
              <div className="mt-6 space-y-4">
                {stage.historiqueStatuts.length === 0 && <p className="text-slate-600">Aucun historique disponible.</p>}
                {stage.historiqueStatuts.map((item, index) => (
                  <div key={`${item.statut}-${index}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-900">{item.statut}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.commentaire || 'Aucun commentaire'}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">{new Date(item.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default StageDetails;
