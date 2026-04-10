import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.tsx';
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
  const { t } = useLanguage();
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
      <div className="flex items-center justify-center min-h-screen bg-app px-4 py-10">
        <div className="text-xl text-muted">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app px-4 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{t('stages.title')}</h1>
            <p className="mt-2 text-sm text-slate-600">{t('stages.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/stages/new')}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            {t('stages.newRequest')}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">{t('stages.total')}</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{counts.total}</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">{t('stages.validated')}</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{counts.validés}</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">{t('stages.pending')}</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{counts.enAttente}</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">{t('stages.ongoing')}</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{counts.enCours}</p>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-[1fr_200px]">
          <input
            type="search"
            placeholder={t('stages.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              {FILTER_STATUTS.map((status) => (
                <option key={status} value={status}>{status === 'tous' ? t('stages.allStatuses') : STATUT_LABELS[status] || status}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field"
            >
              {FILTER_TYPES.map((type) => (
                <option key={type} value={type}>{type === 'tous' ? t('stages.allTypes') : TYPE_LABELS[type] || type}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredStages.length === 0 ? (
          <div className="app-card p-10 text-center text-muted">
            {t('stages.noResults')}
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            {filteredStages.map((stage) => (
              <div key={stage._id} className="app-card p-6">
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
                    <p className="text-sm text-slate-500">{t('stages.report')}</p>
                    <p className="mt-2 text-base text-slate-900">
                      {stage.rapport?.url ? (
                        <div className="flex flex-col gap-2">
                          <a href={stage.rapport.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {stage.rapport.nomFichier || t('stages.reportUpload')}
                          </a>
                          <label className="inline-flex cursor-pointer items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-200">
                            {t('stages.reportReplace')}
                            <input
                              type="file"
                              hidden
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => e.target.files && handleFileUpload(stage._id, 'rapport', e.target.files[0])}
                              disabled={uploadLoading === stage._id}
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="inline-flex cursor-pointer items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                          {t('stages.reportUpload')}
                          <input
                            type="file"
                            hidden
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => e.target.files && handleFileUpload(stage._id, 'rapport', e.target.files[0])}
                            disabled={uploadLoading === stage._id}
                          />
                        </label>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{t('stages.attestation')}</p>
                    <p className="mt-2 text-base text-slate-900">
                      {stage.attestation?.url ? (
                        <div className="flex flex-col gap-2">
                          <a href={stage.attestation.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {t('stages.attestation')}
                          </a>
                          <label className="inline-flex cursor-pointer items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-200">
                            {t('stages.attestationReplace')}
                            <input
                              type="file"
                              hidden
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => e.target.files && handleFileUpload(stage._id, 'attestation', e.target.files[0])}
                              disabled={uploadLoading === stage._id}
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="inline-flex cursor-pointer items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                          {t('stages.attestationUpload')}
                          <input
                            type="file"
                            hidden
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => e.target.files && handleFileUpload(stage._id, 'attestation', e.target.files[0])}
                            disabled={uploadLoading === stage._id}
                          />
                        </label>
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{t('stages.start')}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{new Date(stage.dateDebut).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{t('stages.end')}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{new Date(stage.dateFin).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">{t('stages.tutor')}: {stage.tuteur ? `${stage.tuteur.prenom} ${stage.tuteur.nom}` : t('stages.noTutor')}</p>
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
