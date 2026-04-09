import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  tuteur?: { nom: string; prenom: string };
  rapport?: { url: string | null; nomFichier: string | null };
  attestation?: { url: string | null };
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

const FILTER_STATUTS = ['tous', 'en_attente', 'en_cours', 'validé', 'refusé'];
const FILTER_TYPES = ['tous', 'stage_initiation', 'stage_perfectionnement', 'stage_pfe'];

const MesStages = () => {
  const navigate = useNavigate();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  const [typeFilter, setTypeFilter] = useState('tous');
  const [uploadLoading, setUploadLoading] = useState<string | null>(null);

  const handleFileUpload = async (stageId: string, type: 'rapport' | 'attestation', file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      setUploadLoading(stageId);
      await api.post(`/stages/${stageId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchStages(); // Refresh data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du téléchargement');
    } finally {
      setUploadLoading(null);
    }
  };

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

  const filteredStages = useMemo(() => {
    return stages.filter((stage) => {
      const matchesSearch = search
        ? [stage.entreprise?.nom, stage.titre, stage.type].some((field) => field?.toLowerCase().includes(search.toLowerCase()))
        : true;
      const matchesStatus = statusFilter === 'tous' || stage.statut === statusFilter;
      const matchesType = typeFilter === 'tous' || stage.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [search, stages, statusFilter, typeFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-slate-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Mes stages</h1>
            <p className="mt-2 text-sm text-slate-600">Consultez et gérez vos demandes de stage.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/stages/new')}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
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
            <p className="text-sm text-slate-500">Validés</p>
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

        <div className="mb-8 grid gap-4 md:grid-cols-[1fr_200px]">
          <input
            type="search"
            placeholder="Rechercher une entreprise, un titre ou un type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-3xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none shadow-sm"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-3xl border border-slate-300 bg-white px-4 py-3 outline-none shadow-sm"
            >
              {FILTER_STATUTS.map((status) => (
                <option key={status} value={status}>{status === 'tous' ? 'Tous les statuts' : STATUT_LABELS[status] || status}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-3xl border border-slate-300 bg-white px-4 py-3 outline-none shadow-sm"
            >
              {FILTER_TYPES.map((type) => (
                <option key={type} value={type}>{type === 'tous' ? 'Tous les types' : TYPE_LABELS[type] || type}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredStages.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center text-slate-600 shadow-sm">
            Aucun stage ne correspond à vos filtres.
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            {filteredStages.map((stage) => (
              <div key={stage._id} className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Entreprise</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{stage.entreprise?.nom || '-'}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-700">
                    {STATUT_LABELS[stage.statut] || stage.statut}
                  </span>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-slate-500">Titre du stage</p>
                    <p className="mt-2 text-base text-slate-900">{stage.titre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Type</p>
                    <p className="mt-2 text-base text-slate-900">{TYPE_LABELS[stage.type] || stage.type}</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-slate-500">Rapport de stage</p>
                    <p className="mt-2 text-base text-slate-900">
                      {stage.rapport?.url ? (
                        <a href={stage.rapport.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {stage.rapport.nomFichier || 'Télécharger'}
                        </a>
                      ) : (
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => e.target.files && handleFileUpload(stage._id, 'rapport', e.target.files[0])}
                          disabled={uploadLoading === stage._id}
                          className="text-sm"
                        />
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Attestation</p>
                    <p className="mt-2 text-base text-slate-900">
                      {stage.attestation?.url ? (
                        <a href={stage.attestation.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Télécharger
                        </a>
                      ) : (
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => e.target.files && handleFileUpload(stage._id, 'attestation', e.target.files[0])}
                          disabled={uploadLoading === stage._id}
                          className="text-sm"
                        />
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Début</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{new Date(stage.dateDebut).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Fin</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{new Date(stage.dateFin).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">Tuteur: {stage.tuteur ? `${stage.tuteur.prenom} ${stage.tuteur.nom}` : 'Non renseigné'}</p>
                  <Link
                    to={`/stages/${stage._id}`}
                    className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Voir détails
                  </Link>
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
