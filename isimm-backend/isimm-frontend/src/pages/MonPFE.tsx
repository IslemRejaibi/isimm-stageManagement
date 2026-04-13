import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

interface UserProfile {
  nom: string;
  prenom: string;
  email: string;
}

interface RapportInfo {
  url: string | null;
  nomFichier: string | null;
  taille: number | null;
  dateDepot: string | null;
}

interface HistoriqueStatut {
  statut: string;
  date: string;
  commentaire?: string;
}

interface Commentaire {
  _id: string;
  auteur: UserProfile;
  contenu: string;
  date: string;
}

interface PFE {
  _id: string;
  titre: string;
  description: string;
  type: string;
  specialite: string;
  anneeUniversitaire: string;
  statut: string;
  dateSoutenance?: string | null;
  createdAt: string;
  encadrant: UserProfile;
  jury?: UserProfile[];
  note?: number | null;
  mention?: string | null;
  rapportIntermediaire?: RapportInfo;
  rapportFinal?: RapportInfo;
  historiqueStatuts?: HistoriqueStatut[];
  etape?: number;
  valideeParEncadrant?: boolean;
  dateValidationEncadrant?: string | null;
  commentaires?: Commentaire[];
}

const STATUT_LABELS: Record<string, string> = {
  soumis: 'Sujet soumis',
  en_revision: 'En révision',
  validé: 'Sujet validé',
  refusé: 'Refusé',
};

const MonPFE = () => {
  const [pfe, setPfe] = useState<PFE | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  const [validatingPfe, setValidatingPfe] = useState(false);
  const intermediaireInputRef = useRef<HTMLInputElement>(null);
  const finalInputRef = useRef<HTMLInputElement>(null);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const navigate = useNavigate();

  const fetchUserRole = async () => {
    try {
      const response = await api.get('/auth/me');
      setUserRole(response.data.user.role);
    } catch (err) {
      console.error('Erreur lors de la récupération du rôle:', err);
    }
  };

  const fetchPfe = useCallback(async (background = false) => {
    try {
      if (!background) {
        setLoading(true);
      }
      const response = await api.get('/pfe');
      const pfes: PFE[] = response.data.pfes || [];
      setPfe(pfes[0] || null);
      setError('');
    } catch (err: any) {
      if (!background) {
        setError(err.response?.data?.message || 'Impossible de charger les informations du PFE');
      }
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchUserRole();
    fetchPfe();
  }, [fetchPfe]);

  useEffect(() => {
    if (userRole === 'etudiant' && pfe && ['soumis', 'en_revision'].includes(pfe.statut)) {
      const intervalId = window.setInterval(() => fetchPfe(true), 5000);
      return () => window.clearInterval(intervalId);
    }
    return undefined;
  }, [userRole, pfe, fetchPfe]);

  const uploadRapport = async (type: 'intermediaire' | 'final', file: File) => {
    try {
      setUploading(true);
      setUploadError('');
      const formData = new FormData();
      formData.append('type', type);
      formData.append('file', file);

      const response = await api.put(`/pfe/${pfe?._id}/rapport`, formData);

      setPfe(response.data.pfe);
      // Reset the input
      if (type === 'intermediaire') {
        if (intermediaireInputRef.current) intermediaireInputRef.current.value = '';
      } else {
        if (finalInputRef.current) finalInputRef.current.value = '';
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Erreur lors de l\'upload du rapport');
    } finally {
      setUploading(false);
    }
  };

  const validatePfe = async () => {
    if (!pfe) return;
    try {
      setValidatingPfe(true);
      setError('');
      setSuccess('');
      await api.put(`/pfe/${pfe._id}/validate`, {});
      const response = await api.get(`/pfe/${pfe._id}`);
      setPfe(response.data.pfe);
      setSuccess('PFE validé avec succès. L’étape suivante est maintenant active.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la validation du PFE');
    } finally {
      setValidatingPfe(false);
    }
  };
  const addComment = async () => {
    if (!newComment.trim() || !pfe) return;
    try {
      setAddingComment(true);
      await api.post(`/pfe/${pfe._id}/commentaires`, { contenu: newComment });
      setNewComment('');
      // Refresh pfe
      const response = await api.get('/pfe');
      const pfes = response.data.pfes || [];
      setPfe(pfes[0] || null);
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout du commentaire:', err);
    } finally {
      setAddingComment(false);
    }
  };
  const statutLabel = useMemo(
    () => (pfe ? STATUT_LABELS[pfe.statut] || pfe.statut : ''),
    [pfe]
  );

  const professionalSupervisor = useMemo(() => {
    if (!pfe) return 'Non attribué';
    if (pfe.jury && pfe.jury.length > 0) {
      return `${pfe.jury[0].prenom || ''} ${pfe.jury[0].nom || ''}`.trim();
    }
    return 'Non attribué';
  }, [pfe]);

  const timelineItems = useMemo(() => {
    if (!pfe) return [];
    const currentEtape = pfe.etape || 1;
    const baseDate = new Date(pfe.createdAt).toLocaleDateString('fr-FR');
    const validationDate = pfe.dateValidationEncadrant
      ? new Date(pfe.dateValidationEncadrant).toLocaleDateString('fr-FR')
      : baseDate;

    return [
      {
        label: 'Soumission du sujet',
        description: 'Proposition de sujet envoyée à l’encadrant',
        status: currentEtape >= 1 ? 'done' : 'pending',
        date: baseDate,
      },
      {
        label: 'Validation de projet',
        description: 'Sujet approuvé par l’encadrant',
        status: currentEtape >= 2 ? 'done' : currentEtape === 1 ? 'current' : 'pending',
        date: currentEtape >= 2 ? validationDate : undefined,
      },
      {
        label: 'Rapport intermédiaire',
        description: "Présentation de l'avancement du projet",
        status: currentEtape >= 3 ? 'done' : currentEtape === 2 ? 'current' : 'pending',
        date: pfe.rapportIntermediaire?.dateDepot
          ? new Date(pfe.rapportIntermediaire.dateDepot).toLocaleDateString('fr-FR')
          : undefined,
      },
      {
        label: 'Rapport final et soutenance',
        description: 'Soumission du rapport complet et présentation devant le jury',
        status: currentEtape >= 4 ? 'done' : currentEtape === 3 ? 'current' : 'pending',
        date: pfe.rapportFinal?.dateDepot
          ? new Date(pfe.rapportFinal.dateDepot).toLocaleDateString('fr-FR')
          : undefined,
      },
    ];
  }, [pfe]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app px-4 py-10">
        <div className="text-lg text-muted">Chargement du PFE...</div>
      </div>
    );
  }

  if (!pfe) {
    return (
      <div className="min-h-screen bg-app px-4 py-10">
        <div className="mx-auto max-w-4xl app-card p-10">
          <h1 className="text-3xl font-semibold text-slate-900">
            {userRole === 'etudiant' ? 'Mon PFE' : 'PFE à encadrer'}
          </h1>
          {error ? (
            <p className="mt-4 text-red-600">{error}</p>
          ) : (
            <>
              {userRole === 'etudiant' ? (
                <>
                  <p className="mt-4 text-slate-600">Vous n'avez pas encore soumis de projet de fin d'études.</p>
                  <button
                    onClick={() => navigate('/pfe/new')}
                    className="btn-primary mt-6 w-full sm:w-auto"
                  >
                    Soumettre un PFE
                  </button>
                </>
              ) : (
                <p className="mt-4 text-slate-600">
                  Vous n'encadrez pas encore de projet de fin d'études.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        {error && (
          <div className="rounded-3xl bg-red-50 p-6 text-red-700 shadow-sm ring-1 ring-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-3xl bg-emerald-50 p-6 text-emerald-700 shadow-sm ring-1 ring-emerald-200">
            {success}
          </div>
        )}
        <header className="page-header">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
                Projet de fin d'études
              </p>
              <h1 className="mt-3 text-4xl font-semibold text-slate-900">
                {userRole === 'etudiant' ? pfe.titre : `${pfe.titre} (${pfe.encadrant?.prenom} ${pfe.encadrant?.nom})`}
              </h1>
              <p className="mt-2 text-slate-500">
                {userRole === 'etudiant' ? `Encadrant: ${pfe.encadrant?.prenom} ${pfe.encadrant?.nom}` : `Étudiant: ${pfe.encadrant?.prenom}`} • Année universitaire {pfe.anneeUniversitaire}
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                {statutLabel}
              </span>
              <Link
                to={`/pfe/${pfe._id}`}
                className="inline-flex items-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Voir les détails
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="app-card p-6">
            <p className="text-sm text-muted">Statut du PFE</p>
            <p className="mt-4 text-3xl font-semibold text-heading">{statutLabel}</p>
          </div>
          <div className="app-card p-6">
            <p className="text-sm text-muted">Étape actuelle</p>
            <p className="mt-4 text-3xl font-semibold text-heading">{pfe.etape || 1}/4</p>
          </div>
          <div className="app-card p-6">
            <p className="text-sm text-muted">Type de projet</p>
            <p className="mt-4 text-3xl font-semibold text-heading capitalize">{pfe.type}</p>
          </div>
          <div className="app-card p-6">
            <p className="text-sm text-muted">Spécialité</p>
            <p className="mt-4 text-3xl font-semibold text-heading">{pfe.specialite}</p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Informations du projet</h2>
              </div>
              <Link
                to={`/pfe/${pfe._id}`}
                className="inline-flex items-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Voir les détails
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm text-slate-500">Intitulé du sujet</p>
                <p className="mt-3 text-base font-semibold text-slate-900">{pfe.titre}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm text-slate-500">Encadrant académique</p>
                <p className="mt-3 text-base font-semibold text-slate-900">
                  {pfe.encadrant.prenom} {pfe.encadrant.nom}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm text-slate-500">Email académique</p>
                <p className="mt-3 text-base font-semibold text-sky-700">{pfe.encadrant.email}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm text-slate-500">Encadrant professionnel</p>
                <p className="mt-3 text-base font-semibold text-slate-900">{professionalSupervisor}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm text-slate-500">Spécialité</p>
                <p className="mt-3 text-base font-semibold text-slate-900">{pfe.specialite}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm text-slate-500">Date de soutenance</p>
                <p className="mt-3 text-base font-semibold text-slate-900">
                  {pfe.dateSoutenance
                    ? new Date(pfe.dateSoutenance).toLocaleDateString('fr-FR')
                    : 'À définir'}
                </p>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Détails du projet</h2>
              <div className="mt-6 space-y-4 text-slate-600">
                <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div>
                    <p className="text-sm text-slate-500">Type</p>
                    <p className="mt-1 font-semibold text-slate-900 capitalize">{pfe.type}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div>
                    <p className="text-sm text-slate-500">Statut</p>
                    <p className="mt-1 font-semibold text-slate-900">{statutLabel}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div>
                    <p className="text-sm text-slate-500">Mention</p>
                    <p className="mt-1 font-semibold text-slate-900">{pfe.mention || 'Non attribuée'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Résumé</h2>
              <p className="mt-4 text-slate-600">{pfe.description}</p>
            </div>

            {(userRole === 'enseignant' || userRole === 'tuteur') && (pfe.etape || 1) === 1 && (
              <div className="rounded-[32px] bg-blue-50 p-8 shadow-sm ring-1 ring-blue-200">
                <h2 className="text-xl font-semibold text-blue-900">Actions</h2>
                <p className="mt-2 text-sm text-blue-700">Validez ce PFE pour passer à l'étape de validation de projet.</p>
                <button
                  onClick={validatePfe}
                  disabled={validatingPfe}
                  className="mt-6 inline-flex items-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {validatingPfe ? 'Validation en cours...' : '✓ Valider ce PFE'}
                </button>
              </div>
            )}

            {(pfe.etape || 1) >= 2 && (
              <div className="rounded-[32px] bg-emerald-50 p-8 shadow-sm ring-1 ring-emerald-200">
                <h2 className="text-xl font-semibold text-emerald-900">Validation</h2>
                <p className="mt-2 text-sm text-emerald-700">Ce PFE a été validé par l'encadrant et est passé à l'étape {pfe.etape}.</p>
              </div>
            )}

            {userRole === 'etudiant' && (pfe.etape || 1) === 2 && !pfe.rapportIntermediaire?.url && (
              <div className="rounded-[32px] bg-blue-50 p-6 shadow-sm ring-1 ring-blue-200">
                <p className="text-sm font-semibold text-blue-900">Votre encadrant a validé votre projet.</p>
                <p className="mt-2 text-sm text-blue-700">Vous pouvez maintenant déposer le rapport intermédiaire.</p>
              </div>
            )}
          </aside>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Étapes du PFE</h2>
                <p className="text-sm text-slate-500">Suivez l'avancement de votre dossier.</p>
              </div>
            </div>
            <div className="space-y-6">
              {timelineItems.map((item, index) => (
                <div key={item.label} className="flex gap-4">
                  <div className="relative">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
                        item.status === 'done'
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                          : item.status === 'current'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-400'
                      }`}
                    >
                      {item.status === 'done' ? '✓' : index + 1}
                    </div>
                    {index < timelineItems.length - 1 && (
                      <div className="absolute left-1/2 top-10 h-full w-px bg-slate-200" />
                    )}
                  </div>
                  <div className="flex-1 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-base font-semibold text-slate-900">{item.label}</p>
                      {item.date && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {item.date}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Dépôt des livrables</h2>
              <div className="mt-6 grid gap-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Rapport intermédiaire</p>
                      <p className="mt-2 text-sm text-slate-500">Document présentant l'avancement du projet.</p>
                      {pfe.rapportIntermediaire?.url && (
                        <p className="mt-2 text-sm text-slate-600">{pfe.rapportIntermediaire.nomFichier}</p>
                      )}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                      pfe.rapportIntermediaire?.url
                        ? 'bg-emerald-100 text-emerald-700'
                        : (pfe.etape || 1) >= 2
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {pfe.rapportIntermediaire?.url ? 'Soumis' : (pfe.etape || 1) >= 2 ? 'À soumettre' : 'Non disponible'}
                    </span>
                  </div>
                  {userRole === 'etudiant' ? (
                    <>
                      {(pfe.etape || 1) >= 2 && !pfe.rapportIntermediaire?.url && (
                        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 text-center">
                          <p className="text-sm text-slate-500">Glissez-déposez ou cliquez</p>
                          <p className="mt-1 text-xs text-slate-400">PDF uniquement, max 50 Mo</p>
                          <label className="mt-6 inline-flex cursor-pointer rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                            <input
                              type="file"
                              accept="application/pdf"
                              className="hidden"
                              ref={intermediaireInputRef}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadRapport('intermediaire', file);
                              }}
                              disabled={uploading}
                            />
                            {uploading ? 'Téléversement...' : 'Téléverser'}
                          </label>
                          {uploadError && <p className="mt-3 text-sm text-red-600">{uploadError}</p>}
                        </div>
                      )}
                      {pfe.rapportIntermediaire?.url && (
                        <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                          <p className="text-sm text-emerald-700">✓ Rapport soumis avec succès</p>
                        </div>
                      )}
                      {(pfe.etape || 1) < 2 && (
                        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center">
                          <p className="text-sm text-slate-500">Disponible après validation de l'encadrant</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {pfe.rapportIntermediaire?.url ? (
                        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 text-center">
                          <a
                            href={pfe.rapportIntermediaire.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                          >
                            Ouvrir/Télécharger
                          </a>
                        </div>
                      ) : (
                        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center">
                          <p className="text-sm text-slate-500">Le rapport intermédiaire n'est pas encore disponible.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Rapport final</p>
                      <p className="mt-2 text-sm text-slate-500">Document final complet du PFE.</p>
                      {pfe.rapportFinal?.url && (
                        <p className="mt-2 text-sm text-slate-600">{pfe.rapportFinal.nomFichier}</p>
                      )}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                      pfe.rapportFinal?.url
                        ? 'bg-emerald-100 text-emerald-700'
                        : (pfe.etape || 1) >= 3
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {pfe.rapportFinal?.url ? 'Soumis' : (pfe.etape || 1) >= 3 ? 'À soumettre' : 'Non disponible'}
                    </span>
                  </div>
                  {userRole === 'etudiant' ? (
                    <>
                      {(pfe.etape || 1) >= 3 && !pfe.rapportFinal?.url && (
                        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 text-center">
                          <p className="text-sm text-slate-500">Glissez-déposez ou cliquez</p>
                          <p className="mt-1 text-xs text-slate-400">PDF uniquement, max 50 Mo</p>
                          <label className="mt-6 inline-flex cursor-pointer rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                            <input
                              type="file"
                              accept="application/pdf"
                              className="hidden"
                              ref={finalInputRef}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadRapport('final', file);
                              }}
                              disabled={uploading}
                            />
                            {uploading ? 'Téléversement...' : 'Téléverser'}
                          </label>
                          {uploadError && <p className="mt-3 text-sm text-red-600">{uploadError}</p>}
                        </div>
                      )}
                      {pfe.rapportFinal?.url && (
                        <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                          <p className="text-sm text-emerald-700">✓ Rapport soumis avec succès</p>
                        </div>
                      )}
                      {(pfe.etape || 1) < 3 && (
                        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center">
                          <p className="text-sm text-slate-500">Disponible après soumission du rapport intermédiaire</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {pfe.rapportFinal?.url ? (
                        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 text-center">
                          <a
                            href={pfe.rapportFinal.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                          >
                            Ouvrir/Télécharger
                          </a>
                        </div>
                      ) : (
                        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center">
                          <p className="text-sm text-slate-500">Le rapport final n'est pas encore disponible.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {userRole === 'etudiant' && (pfe.etape || 1) === 1 && (
              <div className="rounded-[32px] bg-yellow-50 p-8 shadow-sm ring-1 ring-amber-200">
                <h2 className="text-xl font-semibold text-amber-900">Étape en attente</h2>
                <p className="mt-3 text-sm text-amber-800">
                  Votre projet doit d'abord être validé par votre encadrant. Dès qu'il clique sur "Valider ce PFE", vous pourrez téléverser le rapport intermédiaire.
                </p>
              </div>
            )}

            <div className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Commentaires</h2>
              {(userRole === 'enseignant' || userRole === 'tuteur') && (
                <div className="mt-6">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm focus:border-blue-500 focus:outline-none"
                    rows={3}
                  />
                  <button
                    onClick={addComment}
                    disabled={addingComment || !newComment.trim()}
                    className="mt-4 inline-flex items-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-gray-400"
                  >
                    {addingComment ? 'Ajout en cours...' : 'Ajouter un commentaire'}
                  </button>
                </div>
              )}
              <div className="mt-6 space-y-4 text-slate-600">
                {pfe.commentaires && pfe.commentaires.length > 0 ? (
                  pfe.commentaires.map((comment, index) => (
                    <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{comment.auteur.prenom} {comment.auteur.nom}</p>
                      <p className="mt-2 text-sm text-slate-500">{comment.contenu}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">{new Date(comment.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">Aucun commentaire pour le moment.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MonPFE;
