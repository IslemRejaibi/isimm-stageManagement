import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StageCard from '../components/StageCard';

interface Stage {
  _id: string;
  titre: string;
  description?: string;
  entreprise: {
    nom: string;
  };
  dateDebut: string;
  dateFin: string;
  statut: string;
  type: string;
}

const STATUS_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  validé: 'Validé',
  refusé: 'Refusé',
  terminé: 'Terminé',
};

const Dashboard = () => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStages();
  }, []);

  const fetchStages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stages');
      setStages(response.data.stages || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des stages');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = stages.length;
    const enCours = stages.filter((stage) => stage.statut === 'en_cours').length;
    const valides = stages.filter((stage) => stage.statut === 'validé').length;
    const attentes = stages.filter((stage) => stage.statut === 'en_attente').length;
    return { total, enCours, valides, attentes };
  }, [stages]);

  const recentStages = useMemo(() => stages.slice(0, 4), [stages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-app px-4 py-10">
        <div className="text-xl text-muted">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="page-header">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Tableau de bord</p>
              <h1 className="mt-3 text-4xl font-semibold text-slate-900">Bienvenue sur votre espace étudiant</h1>
              <p className="mt-3 text-slate-500">Suivez vos stages, votre PFE et vos documents depuis une seule interface.</p>
            </div>
            <div className="rounded-3xl bg-slate-900 px-6 py-4 text-white shadow-sm">
              <p className="text-sm text-slate-300">Demandes actives</p>
              <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
            </div>
          </div>
          {error && (
            <div className="mt-6 rounded-3xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="app-card p-6">
            <p className="text-sm text-muted">Total des stages</p>
            <p className="mt-4 text-3xl font-semibold text-heading">{stats.total}</p>
          </div>
          <div className="app-card p-6">
            <p className="text-sm text-muted">En cours</p>
            <p className="mt-4 text-3xl font-semibold text-heading">{stats.enCours}</p>
          </div>
          <div className="app-card p-6">
            <p className="text-sm text-muted">Validés</p>
            <p className="mt-4 text-3xl font-semibold text-heading">{stats.valides}</p>
          </div>
          <div className="app-card p-6">
            <p className="text-sm text-muted">En attente</p>
            <p className="mt-4 text-3xl font-semibold text-heading">{stats.attentes}</p>
          </div>
        </div>

        <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Derniers stages</h2>
                <p className="mt-2 text-slate-500">Retrouvez vos demandes récentes et leur statut.</p>
              </div>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {recentStages.length === 0 ? (
                <p className="text-slate-600">Aucune donnée récente.</p>
              ) : (
                recentStages.map((stage) => (
                  <StageCard key={stage._id} stage={stage} />
                ))
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="app-card p-8">
              <h2 className="text-xl font-semibold text-heading">Aperçu rapide</h2>
              <div className="mt-6 grid gap-4">
                <div className="rounded-3xl bg-surface-alt p-5">
                  <p className="text-sm text-muted">Stage validé</p>
                  <p className="mt-3 text-2xl font-semibold text-heading">{stats.valides}</p>
                </div>
                <div className="rounded-3xl bg-surface-alt p-5">
                  <p className="text-sm text-muted">Stage en cours</p>
                  <p className="mt-3 text-2xl font-semibold text-heading">{stats.enCours}</p>
                </div>
                <div className="rounded-3xl bg-surface-alt p-5">
                  <p className="text-sm text-muted">Demandes en attente</p>
                  <p className="mt-3 text-2xl font-semibold text-heading">{stats.attentes}</p>
                </div>
              </div>
            </div>
            <div className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="mt-6 space-y-3">
                <button onClick={() => navigate('/stages')} className="btn-primary w-full">
                  Voir mes stages
                </button>
                <button onClick={() => navigate('/pfe')} className="btn-secondary w-full">
                  Accéder à mon PFE
                </button>
              </div>
            </div>
          </aside>
        </section>

        <section className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Historique des stages</h2>
              <p className="mt-2 text-slate-500">Retrouvez l'ensemble de vos demandes et leur statut.</p>
            </div>
          </div>
          {stages.length === 0 ? (
            <div className="rounded-3xl bg-slate-50 p-10 text-center text-slate-600">Aucun stage trouvé.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Titre</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Entreprise</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Début</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Fin</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {stages.map((stage) => (
                    <tr key={stage._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{stage.titre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{stage.entreprise?.nom || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{stage.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{new Date(stage.dateDebut).toLocaleDateString('fr-FR')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{new Date(stage.dateFin).toLocaleDateString('fr-FR')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{STATUS_LABELS[stage.statut] || stage.statut}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
