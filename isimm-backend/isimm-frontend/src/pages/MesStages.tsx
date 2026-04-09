import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

interface Stage {
  _id: string;
  titre: string;
  description?: string;
  entreprise: {
    nom: string;
  };
  type: string;
  statut: string;
  dateDebut: string;
  dateFin: string;
}

const STATUT_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  terminé: 'Terminé',
  validé: 'Validé',
  refusé: 'Refusé',
};

const TYPE_LABELS: Record<string, string> = {
  stage_initiation: "Stage d'initiation",
  stage_perfectionnement: 'Stage ouvrier',
  stage_pfe: 'Stage PFE',
};

const MesStages = () => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const counts = useMemo(() => {
    const total = stages.length;
    const validés = stages.filter((stage) => stage.statut === 'validé').length;
    const enAttente = stages.filter((stage) => stage.statut === 'en_attente').length;
    const enCours = stages.filter((stage) => stage.statut === 'en_cours').length;

    return { total, validés, enAttente, enCours };
  }, [stages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              Mes stages
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Consultez et gérez vos demandes de stage.
            </p>
          </div>
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Nouvelle demande
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total des stages</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{counts.total}</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Stage validé</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{counts.validés}</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">En attente</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{counts.enAttente}</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">En cours</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{counts.enCours}</p>
          </div>
        </div>

        {stages.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center text-slate-600 shadow-sm">
            Aucun stage trouvé pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Entreprise
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date début
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date fin
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {stages.map((stage) => (
                  <tr key={stage._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {stage.entreprise?.nom || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {TYPE_LABELS[stage.type] || stage.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(stage.dateDebut).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(stage.dateFin).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                        {STATUT_LABELS[stage.statut] || stage.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Voir détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MesStages;
