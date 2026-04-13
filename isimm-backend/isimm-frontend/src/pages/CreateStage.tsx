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
  const [missionsPrevues, setMissionsPrevues] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [objectifsPedagogiques, setObjectifsPedagogiques] = useState('');
  const [lettreFile, setLettreFile] = useState<File | null>(null);
  const [conventionFile, setConventionFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nbSemaines, setNbSemaines] = useState<number | null>(null);
  const navigate = useNavigate();

  // Calculer le nombre de semaines quand les dates changent
  const calculateWeeks = (start: string, end: string) => {
    if (!start || !end) return null;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate <= startDate) return null;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  };

  // Gestionnaire pour la date de début
  const handleDateDebutChange = (value: string) => {
    setDateDebut(value);
    if (value && dateFin) {
      const weeks = calculateWeeks(value, dateFin);
      setNbSemaines(weeks);
    } else {
      setNbSemaines(null);
    }
  };

  // Gestionnaire pour la date de fin
  const handleDateFinChange = (value: string) => {
    setDateFin(value);
    if (dateDebut && value) {
      const weeks = calculateWeeks(dateDebut, value);
      setNbSemaines(weeks);
    } else {
      setNbSemaines(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validation des dates
    if (!dateDebut || !dateFin) {
      setError('Les dates de début et de fin sont obligatoires');
      return;
    }

    const startDate = new Date(dateDebut);
    const endDate = new Date(dateFin);

    if (endDate <= startDate) {
      setError('La date de fin doit être après la date de début');
      return;
    }

    const calculatedWeeks = calculateWeeks(dateDebut, dateFin);
    if (!calculatedWeeks || calculatedWeeks <= 0) {
      setError('La durée du stage doit être d\'au moins 1 semaine');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const stageResponse = await api.post('/stages', {
        titre,
        description,
        entreprise: { nom: entreprise },
        dateDebut,
        dateFin,
        type,
        specialite,
        anneeUniversitaire: annee,
        nbSemainesAttendues: calculatedWeeks, // Stocker le nombre de semaines calculé
        detailsStage: {
          missionsPrevues,
          technologiesUtilisees: technologies
            .split(',')
            .map((tech) => tech.trim())
            .filter(Boolean),
          objectifsPedagogiques,
        },
      });

      const stageId = stageResponse.data.stage._id;

      if (lettreFile) {
        const formData = new FormData();
        formData.append('file', lettreFile);
        await api.post(`/stage-enrichment/${stageId}/upload-letter`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (conventionFile) {
        const formData = new FormData();
        formData.append('file', conventionFile);
        await api.post(`/stage-enrichment/${stageId}/upload-convention`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

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

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Missions prévues</span>
            <textarea
              value={missionsPrevues}
              onChange={(e) => setMissionsPrevues(e.target.value)}
              rows={3}
              className="mt-2 input-field"
              placeholder="Décrivez les tâches et objectifs du stage"
            />
          </label>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Technologies / outils</span>
              <input
                value={technologies}
                onChange={(e) => setTechnologies(e.target.value)}
                placeholder="Node.js, React, MongoDB"
                className="mt-2 input-field"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Objectifs pédagogiques</span>
              <textarea
                value={objectifsPedagogiques}
                onChange={(e) => setObjectifsPedagogiques(e.target.value)}
                rows={3}
                className="mt-2 input-field"
                placeholder="Compétences visées, résultats attendus"
              />
            </label>
          </div>

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

          <div className="grid gap-6 sm:grid-cols-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Date de début</span>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => handleDateDebutChange(e.target.value)}
                required
                className="mt-2 input-field"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Date de fin</span>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => handleDateFinChange(e.target.value)}
                required
                min={dateDebut || undefined}
                className="mt-2 input-field"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Durée estimée</span>
              <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-sm text-slate-700">
                  {nbSemaines ? `${nbSemaines} semaine${nbSemaines > 1 ? 's' : ''}` : 'À calculer'}
                </span>
              </div>
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
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Lettre de motivation (optionnel)</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setLettreFile(e.target.files?.[0] || null)}
                className="mt-2"
              />
            </label>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Convention de stage (optionnel)</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setConventionFile(e.target.files?.[0] || null)}
                className="mt-2"
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
