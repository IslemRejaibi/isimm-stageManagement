import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const TYPES_PFE = [
  { value: 'académique', label: 'Académique' },
  { value: 'professionnel', label: 'Professionnel' },
  { value: 'recherche', label: 'Recherche' },
];

const SPECIALITES = ['GL', 'RS', 'IIA', 'GE', 'GM', 'GC', 'autre'];

const CreatePFE = () => {
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [encadrantEmail, setEncadrantEmail] = useState('');
  const [type, setType] = useState('académique');
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
      await api.post('/pfe', {
        titre,
        description,
        encadrantEmail,
        type,
        specialite,
        anneeUniversitaire: annee,
      });
      navigate('/pfe');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Impossible de soumettre le PFE');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="page-header">
          <h1 className="text-3xl font-semibold text-heading">Soumettre un PFE</h1>
          <p className="mt-2 text-muted">Présenter votre projet de fin d'études et définissez votre encadrant.</p>
        </div>

        {error && (
          <div className="rounded-3xl bg-red-50 p-5 text-red-700 ring-1 ring-red-200">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 app-card p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Titre du PFE</span>
              <input
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                required
                minLength={5}
                className="mt-2 input-field"
                placeholder="Ex: Système de gestion des stages"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email de l'encadrant</span>
              <input
                type="email"
                value={encadrantEmail}
                onChange={(e) => setEncadrantEmail(e.target.value)}
                required
                className="mt-2 input-field"
                placeholder="Ex: prof@isimm.tn"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Description du projet</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
              rows={5}
              className="mt-2 input-field"
              placeholder="Décrivez votre projet de fin d'études..."
            />
          </label>

          <div className="grid gap-6 sm:grid-cols-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Type de PFE</span>
              <select value={type} onChange={(e) => setType(e.target.value)} className="mt-2 input-field">
                {TYPES_PFE.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Spécialité</span>
              <select value={specialite} onChange={(e) => setSpecialite(e.target.value)} className="mt-2 input-field">
                {SPECIALITES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Année universitaire</span>
              <input
                value={annee}
                onChange={(e) => setAnnee(e.target.value)}
                required
                className="mt-2 input-field"
                placeholder="2025-2026"
              />
            </label>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/pfe')}
              className="rounded-3xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-60 sm:w-auto"
            >
              {loading ? 'Envoi en cours...' : 'Soumettre le PFE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePFE;
