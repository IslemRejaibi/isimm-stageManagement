import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

interface StageDetailsModel {
  _id: string;
  titre: string;
  description?: string;
  entreprise: { nom: string; adresse?: string; secteur?: string; emailContact?: string; telephoneContact?: string };
  encadrantEntreprise?: { nom?: string; poste?: string; email?: string };
  tuteur?: { nom: string; prenom: string; email: string };
  type: string;
  specialite: string;
  statut: string;
  dateDebut: string;
  dateFin: string;
  historiqueStatuts: Array<{ statut: string; date: string; commentaire?: string }>;
  rapport?: { url?: string; nomFichier?: string; taille?: number; dateDepot?: string };
  attestation?: { url?: string; dateDepot?: string };
}

const StageDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [stage, setStage] = useState<StageDetailsModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) fetchStage();
  }, [id]);

  const fetchStage = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/stages/${id}`);
      setStage(response.data.stage);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Impossible de charger les détails du stage');
    } finally {
      setLoading(false);
    }
  };

  const statusClass = useMemo(() => {
    if (!stage) return 'bg-slate-100 text-slate-700';
    if (stage.statut === 'validé') return 'bg-emerald-100 text-emerald-700';
    if (stage.statut === 'en_cours') return 'bg-blue-100 text-blue-700';
    if (stage.statut === 'en_attente') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  }, [stage]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-lg text-slate-600">Chargement du stage...</div>
      </div>
    );
  }

  if (!stage) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 lg:p-10">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-3xl font-semibold text-slate-900">Détails du stage</h1>
          <p className="mt-4 text-slate-600">Stage introuvable.</p>
          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Détails du stage</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">{stage.entreprise.nom} - {stage.type.replace('_', ' ')}</h1>
              <p className="mt-2 text-slate-500">{stage.description || 'Aucune description disponible.'}</p>
            </div>
            <span className={`rounded-full px-4 py-2 text-sm font-semibold ${statusClass}`}>{stage.statut}</span>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
          <div className="space-y-6">
            <section className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Description du stage</h2>
              <p className="mt-4 text-slate-600">{stage.description || 'Aucune description fournie.'}</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Période</p>
                  <p className="mt-2 font-semibold text-slate-900">{new Date(stage.dateDebut).toLocaleDateString('fr-FR')} – {new Date(stage.dateFin).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Spécialité</p>
                  <p className="mt-2 font-semibold text-slate-900">{stage.specialite}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Encadrant entreprise</p>
                  <p className="mt-2 font-semibold text-slate-900">{stage.encadrantEntreprise?.nom || 'Non renseigné'}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Type de stage</p>
                  <p className="mt-2 font-semibold text-slate-900">{stage.type.replace('_', ' ')}</p>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Documents</h2>
              <div className="mt-6 space-y-4">
                {stage.rapport?.url && (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-900">Rapport de stage</p>
                    <p className="text-sm text-slate-500">{stage.rapport.nomFichier}</p>
                  </div>
                )}
                {stage.attestation?.url && (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-900">Attestation de stage</p>
                    <p className="text-sm text-slate-500">Téléchargée</p>
                  </div>
                )}
                {!stage.rapport?.url && !stage.attestation?.url && (
                  <p className="text-slate-600">Aucun document déposé pour ce stage.</p>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Encadrant entreprise</h2>
              <p className="mt-4 text-slate-600">{stage.encadrantEntreprise?.nom || 'Non renseigné'}</p>
              <p className="mt-2 text-sm text-slate-500">{stage.encadrantEntreprise?.poste || 'Poste non renseigné'}</p>
              {stage.encadrantEntreprise?.email && (
                <p className="mt-2 text-sm text-sky-700">{stage.encadrantEntreprise.email}</p>
              )}
            </section>

            <section className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Informations entreprise</h2>
              <div className="mt-4 space-y-3 text-slate-600">
                <p><strong>Nom :</strong> {stage.entreprise.nom}</p>
                {stage.entreprise.adresse && <p><strong>Adresse :</strong> {stage.entreprise.adresse}</p>}
                {stage.entreprise.secteur && <p><strong>Secteur :</strong> {stage.entreprise.secteur}</p>}
                {stage.entreprise.emailContact && <p><strong>Email :</strong> {stage.entreprise.emailContact}</p>}
                {stage.entreprise.telephoneContact && <p><strong>Téléphone :</strong> {stage.entreprise.telephoneContact}</p>}
              </div>
            </section>

            <section className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Historique</h2>
              <div className="mt-6 space-y-4">
                {stage.historiqueStatuts.length === 0 && <p className="text-slate-600">Aucun historique disponible.</p>}
                {stage.historiqueStatuts.map((item, index) => (
                  <div key={`${item.statut}-${index}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-semibold text-slate-900">{item.statut}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.commentaire || 'Aucun commentaire'}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">{new Date(item.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default StageDetails;
