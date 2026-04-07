import { useEffect, useState } from 'react';
import api from '../services/api';
import StageCard from '../components/StageCard';

interface Stage {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  company: string;
}

const Dashboard = () => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Mes Stages
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {stages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Aucun stage trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stages.map((stage) => (
              <StageCard key={stage._id} stage={stage} />
            ))}
          </div>
        )}

        <div className="mt-8 overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Titre
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Entreprise
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Début
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Fin
                </th>
              </tr>
            </thead>
            <tbody>
              {stages.map((stage) => (
                <tr key={stage._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {stage.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {stage.company}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(stage.startDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(stage.endDate).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
