import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

interface DocumentItem {
  id: string;
  nom: string;
  categorie: string;
  stage: string;
  date: string;
  statut: string;
  taille: string;
}

const Documents = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const [stageRes, pfeRes] = await Promise.all([api.get('/stages'), api.get('/pfe')]);
      const stages = stageRes.data.stages || [];
      const pfes = pfeRes.data.pfes || [];

      const stageDocs = stages.flatMap((stage: any) => {
        const list = [] as DocumentItem[];
        if (stage.rapport?.url) {
          list.push({
            id: `${stage._id}-rapport`,
            nom: stage.rapport.nomFichier || 'Rapport de stage',
            categorie: 'Rapport de stage',
            stage: stage.entreprise?.nom || 'Stage',
            date: new Date(stage.rapport.dateDepot).toLocaleDateString('fr-FR'),
            statut: 'Validé',
            taille: `${(stage.rapport.taille / 1024 / 1024).toFixed(1)} Mo`,
          });
        }
        if (stage.attestation?.url) {
          list.push({
            id: `${stage._id}-attestation`,
            nom: 'Attestation de stage',
            categorie: 'Attestation',
            stage: stage.entreprise?.nom || 'Stage',
            date: new Date(stage.attestation.dateDepot).toLocaleDateString('fr-FR'),
            statut: 'Validé',
            taille: 'N/A',
          });
        }
        return list;
      });

      const pfeDocs = pfes.flatMap((pfe: any) => {
        const list = [] as DocumentItem[];
        if (pfe.rapportIntermediaire?.url) {
          list.push({
            id: `${pfe._id}-pfe-inter`,
            nom: pfe.rapportIntermediaire.nomFichier || 'Rapport intermédiaire',
            categorie: 'PFE',
            stage: pfe.titre,
            date: new Date(pfe.rapportIntermediaire.dateDepot).toLocaleDateString('fr-FR'),
            statut: 'Validé',
            taille: `${(pfe.rapportIntermediaire.taille / 1024 / 1024).toFixed(1)} Mo`,
          });
        }
        if (pfe.rapportFinal?.url) {
          list.push({
            id: `${pfe._id}-pfe-final`,
            nom: pfe.rapportFinal.nomFichier || 'Rapport final',
            categorie: 'PFE',
            stage: pfe.titre,
            date: new Date(pfe.rapportFinal.dateDepot).toLocaleDateString('fr-FR'),
            statut: 'Validé',
            taille: `${(pfe.rapportFinal.taille / 1024 / 1024).toFixed(1)} Mo`,
          });
        }
        return list;
      });

      setDocuments([...stageDocs, ...pfeDocs]);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Impossible de charger les documents');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = documents.length;
    const valides = documents.filter((doc) => doc.statut === 'Validé').length;
    const enAttente = documents.filter((doc) => doc.statut === 'En attente').length;
    const rejetes = documents.filter((doc) => doc.statut === 'Rejeté').length;
    return { total, valides, enAttente, rejetes };
  }, [documents]);

  return (
    <div className="min-h-screen bg-slate-100 p-6 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Documents</h1>
            <p className="mt-2 text-slate-500">Gérez vos documents de stage et de PFE.</p>
          </div>
          <button className="inline-flex items-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Téléverser
          </button>
        </header>

        {error && (
          <div className="rounded-3xl bg-red-50 p-5 text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total documents</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Validés</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{stats.valides}</p>
          </div>
          <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">En attente</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{stats.enAttente}</p>
          </div>
          <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Rejetés</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{stats.rejetes}</p>
          </div>
        </div>

        <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Tous les documents</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                placeholder="Rechercher un document..."
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-400"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center text-slate-600">Chargement...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="whitespace-nowrap px-6 py-3 text-left font-semibold">Document</th>
                    <th className="whitespace-nowrap px-6 py-3 text-left font-semibold">Catégorie</th>
                    <th className="whitespace-nowrap px-6 py-3 text-left font-semibold">Stage associé</th>
                    <th className="whitespace-nowrap px-6 py-3 text-left font-semibold">Date</th>
                    <th className="whitespace-nowrap px-6 py-3 text-left font-semibold">Statut</th>
                    <th className="whitespace-nowrap px-6 py-3 text-right font-semibold">Taille</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">{doc.nom}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">{doc.categorie}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">{doc.stage}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">{doc.date}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          {doc.statut}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-slate-600">{doc.taille}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Documents;
