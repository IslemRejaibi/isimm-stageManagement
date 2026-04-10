import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    fetchPfe();
  }, []);

  const uploadRapport = async (type: 'intermediaire' | 'final', file: File) => {
    try {
      setUploading(true);
      setUploadError('');
      const formData = new FormData();
      formData.append('type', type);
      formData.append('file', file);

      const response = await api.put(`/pfe/${pfe?._id}/rapport`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setPfe(response.data.pfe);
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Erreur lors de l\'upload du rapport');
    } finally {
      setUploading(false);
    }
  };

  const fetchPfe = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pfe');
      const pfes: PFE[] = response.data.pfes || [];
      setPfe(pfes[0] || null);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Impossible de charger les informations du PFE');
    } finally {
      setLoading(false);
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
    const baseDate = new Date(pfe.createdAt).toLocaleDateString('fr-FR');
    const soutenanceDate = pfe.dateSoutenance
      ? new Date(pfe.dateSoutenance).toLocaleDateString('fr-FR')
      : 'À définir';
    return [
      {
        label: 'Soumission du sujet',
        description: 'Proposition de sujet envoyée à l’encadrant',
        status: 'done',
        date: baseDate,
      },
      {
        label: 'Validation encadrant',
        description: 'Sujet approuvé par l’encadrant',
        status: pfe.statut !== 'soumis' ? 'done' : 'pending',
        date: pfe.statut !== 'soumis' ? baseDate : undefined,
      },
      {
        label: 'Rapport intermédiaire',
        description: "Présentation de l'avancement du projet",
        status: pfe.rapportIntermediaire?.url ? 'done' : 'pending',
        date: pfe.rapportIntermediaire?.dateDepot
          ? new Date(pfe.rapportIntermediaire.dateDepot).toLocaleDateString('fr-FR')
          : undefined,
      },
      {
        label: 'Rapport final',
        description: 'Soumission du rapport complet du PFE',
        status: pfe.rapportFinal?.url ? 'done' : 'pending',
        date: pfe.rapportFinal?.dateDepot
          ? new Date(pfe.rapportFinal.dateDepot).toLocaleDateString('fr-FR')
          : undefined,
      },
      {
        label: 'Soutenance',
        description: 'Présentation devant le jury',
        status: pfe.dateSoutenance ? 'done' : 'pending',
        date: pfe.dateSoutenance ? soutenanceDate : undefined,
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
          <h1 className="text-3xl font-semibold text-slate-900">Mon PFE</h1>
          {error ? (
            <p className="mt-4 text-red-600">{error}</p>
          ) : (
            <p className="mt-4 text-slate-600">Aucun projet de fin d'études trouvé pour votre compte.</p>
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
        <header className="page-header">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
                Projet de fin d'études
              </p>
              <h1 className="mt-3 text-4xl font-semibold text-slate-900">
                Mon projet de fin d'études
              </h1>
              <p className="mt-2 text-slate-500">Année universitaire {pfe.anneeUniversitaire}</p>
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
            <p className="text-sm text-muted">Type de projet</p>
            <p className="mt-4 text-3xl font-semibold text-heading capitalize">{pfe.type}</p>
          </div>
          <div className="app-card p-6">
            <p className="text-sm text-muted">Spécialité</p>
            <p className="mt-4 text-3xl font-semibold text-heading">{pfe.specialite}</p>
          </div>
          <div className="app-card p-6">
            <p className="text-sm text-muted">Soutenance</p>
            <p className="mt-4 text-3xl font-semibold text-heading">
              {pfe.dateSoutenance ? new Date(pfe.dateSoutenance).toLocaleDateString('fr-FR') : 'À définir'}
            </p>
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
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {pfe.rapportIntermediaire?.url ? 'Soumis' : 'À soumettre'}
                    </span>
                  </div>
                  <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 text-center">
                    <p className="text-sm text-slate-500">Glissez-déposez ou cliquez</p>
                    <p className="mt-1 text-xs text-slate-400">PDF uniquement, max 50 Mo</p>
                    <label className="mt-6 inline-flex cursor-pointer rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
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
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {pfe.rapportFinal?.url ? 'Soumis' : 'À soumettre'}
                    </span>
                  </div>
                  <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 text-center">
                    <p className="text-sm text-slate-500">Glissez-déposez ou cliquez</p>
                    <p className="mt-1 text-xs text-slate-400">PDF uniquement, max 50 Mo</p>
                    <label className="mt-6 inline-flex cursor-pointer rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
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
                </div>
              </div>
            </div>

            <div className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Commentaires encadrant</h2>
              <div className="mt-6 space-y-4 text-slate-600">
                {pfe.historiqueStatuts && pfe.historiqueStatuts.length > 0 ? (
                  pfe.historiqueStatuts.map((item, index) => (
                    <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{item.statut}</p>
                      <p className="mt-2 text-sm text-slate-500">{item.commentaire || 'Aucun commentaire'}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">{new Date(item.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">Aucun commentaire disponible pour le moment.</p>
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
