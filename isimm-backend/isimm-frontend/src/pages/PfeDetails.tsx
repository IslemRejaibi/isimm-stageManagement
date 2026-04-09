import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
  historiqueStatuts?: Array<{ statut: string; date: string; commentaire?: string }>;
  commentaires?: Commentaire[];
}

const STATUT_LABELS: Record<string, string> = {
  soumis: 'Sujet soumis',
  en_revision: 'En révision',
  validé: 'Sujet validé',
  refusé: 'Refusé',
};

const PfeDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [pfe, setPfe] = useState<PFE | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) fetchPfe();
  }, [id]);

  const fetchPfe = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/pfe/${id}`);
      setPfe(response.data.pfe);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Impossible de charger le PFE');
    } finally {
      setLoading(false);
    }
  };

  const statutLabel = useMemo(
    () => (pfe ? STATUT_LABELS[pfe.statut] || pfe.statut : ''),
    [pfe]
  );

  const timelineItems = useMemo(() => {
    if (!pfe) return [];
    const createdDate = new Date(pfe.createdAt).toLocaleDateString('fr-FR');
    return [
      {
        label: 'Soumission du sujet',
        description: 'Sujet envoyé pour validation',
        status: 'done',
        date: createdDate,
      },
      {
        label: 'Validation encadrant',
        description: 'Validation du sujet par l’encadrant',
        status: pfe.statut !== 'soumis' ? 'done' : 'pending',
        date: pfe.statut !== 'soumis' ? createdDate : undefined,
      },
      {
        label: 'Rapport intermédiaire',
        description: 'Rapport intermédiaire téléchargé',
        status: pfe.rapportIntermediaire?.url ? 'done' : 'pending',
        date: pfe.rapportIntermediaire?.dateDepot
          ? new Date(pfe.rapportIntermediaire.dateDepot).toLocaleDateString('fr-FR')
          : undefined,
      },
      {
        label: 'Rapport final',
        description: 'Rapport final téléchargé',
        status: pfe.rapportFinal?.url ? 'done' : 'pending',
        date: pfe.rapportFinal?.dateDepot
          ? new Date(pfe.rapportFinal.dateDepot).toLocaleDateString('fr-FR')
          : undefined,
      },
      {
        label: 'Soutenance',
        description: 'Préparation de la soutenance',
        status: pfe.statut === 'validé' ? 'done' : 'pending',
        date: pfe.dateSoutenance ? new Date(pfe.dateSoutenance).toLocaleDateString('fr-FR') : undefined,
      },
    ];
  }, [pfe]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-lg text-slate-600">Chargement du détail PFE...</div>
      </div>
    );
  }

  if (!pfe) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 lg:p-10">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-3xl font-semibold text-slate-900">Détail du PFE</h1>
          <p className="mt-4 text-slate-600">Aucun PFE trouvé.</p>
          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
          <Link to="/pfe" className="mt-6 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Retour au PFE
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Détail PFE</p>
              <h1 className="mt-3 text-4xl font-semibold text-slate-900">{pfe.titre}</h1>
              <p className="mt-2 text-slate-500">Année {pfe.anneeUniversitaire} • {pfe.specialite}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                {statutLabel}
              </span>
              <Link
                to="/pfe"
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Retour
              </Link>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <section className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm text-slate-500">Encadrant académique</p>
                <p className="mt-3 font-semibold text-slate-900">{pfe.encadrant.prenom} {pfe.encadrant.nom}</p>
                <p className="mt-1 text-sm text-slate-500">{pfe.encadrant.email}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm text-slate-500">Type</p>
                <p className="mt-3 font-semibold text-slate-900 capitalize">{pfe.type}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm text-slate-500">Note</p>
                <p className="mt-3 font-semibold text-slate-900">{pfe.note ?? 'Non noté'}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm text-slate-500">Mention</p>
                <p className="mt-3 font-semibold text-slate-900">{pfe.mention || 'Non attribuée'}</p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-slate-900">Résumé</h2>
              <p className="mt-4 text-slate-600">{pfe.description}</p>
            </div>

            <div className="mt-8 rounded-3xl bg-slate-50 p-6">
              <h3 className="text-lg font-semibold text-slate-900">Documents déposés</h3>
              <div className="mt-4 space-y-3">
                {pfe.rapportIntermediaire?.url ? (
                  <a
                    href={pfe.rapportIntermediaire.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-3xl border border-slate-200 bg-white px-5 py-4 text-slate-700 hover:bg-slate-100"
                  >
                    Rapport intermédiaire • {pfe.rapportIntermediaire.nomFichier}
                  </a>
                ) : (
                  <p className="text-slate-500">Aucun rapport intermédiaire téléchargé.</p>
                )}
                {pfe.rapportFinal?.url ? (
                  <a
                    href={pfe.rapportFinal.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-3xl border border-slate-200 bg-white px-5 py-4 text-slate-700 hover:bg-slate-100"
                  >
                    Rapport final • {pfe.rapportFinal.nomFichier}
                  </a>
                ) : (
                  <p className="text-slate-500">Aucun rapport final téléchargé.</p>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Timeline</h2>
              <div className="mt-6 space-y-4">
                {timelineItems.map((item) => (
                  <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-2 text-sm text-slate-500">{item.description}</p>
                    {item.date && <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-400">{item.date}</p>}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Jury</h2>
              <div className="mt-4 space-y-3 text-slate-600">
                {pfe.jury && pfe.jury.length > 0 ? (
                  pfe.jury.map((member, index) => (
                    <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{member.prenom} {member.nom}</p>
                      <p className="text-sm text-slate-500">{member.email}</p>
                    </div>
                  ))
                ) : (
                  <p>Aucun membre du jury renseigné.</p>
                )}
              </div>
            </section>

            <section className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Historique</h2>
              <div className="mt-6 space-y-4">
                {pfe.historiqueStatuts && pfe.historiqueStatuts.length > 0 ? (
                  pfe.historiqueStatuts.map((item, index) => (
                    <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{STATUT_LABELS[item.statut] || item.statut}</p>
                      <p className="mt-2 text-sm text-slate-500">{item.commentaire || 'Aucun commentaire'}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">{new Date(item.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">Aucun historique.</p>
                )}
              </div>
            </section>
          </aside>
        </div>

        {error && (
          <div className="rounded-3xl bg-red-50 p-6 text-red-700 shadow-sm ring-1 ring-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default PfeDetails;
