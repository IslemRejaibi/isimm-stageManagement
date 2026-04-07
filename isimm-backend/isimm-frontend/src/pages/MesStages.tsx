import { useEffect, useState } from 'react';
import api from '../services/api';

interface Stage {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  company: string;
}

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
          Mes Stages en Détail
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
          <div className="space-y-6">
            {stages.map((stage) => (
              <div key={stage._id} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {stage.title}
                </h2>
                <p className="text-gray-600 mb-4">{stage.description}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Entreprise</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {stage.company}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Durée</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(stage.startDate).toLocaleDateString('fr-FR')} -{' '}
                      {new Date(stage.endDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MesStages;
