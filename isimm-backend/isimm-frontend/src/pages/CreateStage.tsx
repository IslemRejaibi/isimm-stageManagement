import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const TYPES_STAGE = [
  { value: 'stage_initiation', label: "Stage d'initiation" },
  { value: 'stage_perfectionnement', label: 'Stage ouvrier' },
  { value: 'stage_pfe', label: 'Stage PFE' },
];

const SPECIALITES = ['GL', 'RS', 'IIA', 'GE', 'GM', 'GC', 'autre'];

const CreateStage = () => {
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [entreprise, setEntreprise] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [type, setType] = useState('stage_pfe');
  const [specialite, setSpecialite] = useState('GL');
  const [annee, setAnnee] = useState('2025-2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError('');
      await api.post('/stages', {
        titre,
        description,
        entreprise: { nom: entreprise },
        dateDebut,
        dateFin,
        type,
        specialite,
        anneeUniversitaire: annee,
      });
      navigate('/stages');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Impossible de créer la demande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="page-header">
          <h1 className="text-3xl font-semibold text-heading">Nouvelle demande de stage</h1>
          <p className="mt-2 text-muted">Soumettez une nouvelle demande de stage et suivez son traitement.</p>
        </div>

        {error && (
          <div className="rounded-3xl bg-red-50 p-5 text-red-700 ring-1 ring-red-200">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 app-card p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Titre du stage</span>
              <input
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                required
                className="mt-2 input-field"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Entreprise</span>
              <input
                value={entreprise}
                onChange={(e) => setEntreprise(e.target.value)}
                required
                className="mt-2 input-field"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="mt-2 input-field"
            />
          </label>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Type de stage</span>
              <select value={type} onChange={(e) => setType(e.target.value)} className="mt-2 input-field">
                {TYPES_STAGE.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Spécialité</span>
              <select value={specialite} onChange={(e) => setSpecialite(e.target.value)} className="mt-2 input-field">
                {SPECIALITES.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Date de début</span>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                required
                className="mt-2 input-field"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Date de fin</span>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                required
                className="mt-2 input-field"
              />
            </label>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Année universitaire</span>
              <input
                value={annee}
                onChange={(e) => setAnnee(e.target.value)}
                required
                className="mt-2 input-field"
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-60"
            >
              {loading ? 'Envoi en cours...' : 'Soumettre la demande'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStage;
