import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
  const [role, setRole]           = useState<'etudiant' | 'enseignant'|'admin'>('etudiant');
  const [nom, setNom]             = useState('');
  const [prenom, setPrenom]       = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [matricule, setMatricule] = useState(''); // ← nouveau champ
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: any = { nom, prenom, email, password, role };

      // On ajoute le matricule seulement si encadrant
      if (role === 'enseignant') {
        payload.matricule = matricule;
      }

      const response = await api.post('/auth/register', payload);
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');

    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl shadow-2xl p-8">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Créer un compte
        </h2>

        {/* ─── Sélecteur de rôle ─── */}
        <div className="flex rounded-2xl border border-slate-700 p-1 mb-6">
          <button
            type="button"
            onClick={() => setRole('etudiant')}
            className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
              role === 'etudiant'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Étudiant
          </button>
          <button
            type="button"
            onClick={() => setRole('enseignant')}
            className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
              role === 'enseignant'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Encadrant
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
              role === 'admin'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500 p-4 text-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Champs communs */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nom</label>
            <input type="text" value={nom} onChange={e => setNom(e.target.value)} required
              className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Prénom</label>
            <input type="text" value={prenom} onChange={e => setPrenom(e.target.value)} required
              className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:border-blue-500 focus:outline-none" />
          </div>

          {/* Champ matricule — affiché seulement si encadrant */}
          {(role === 'enseignant'|| role === 'admin')  && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Matricule
              </label>
              <input
                type="text"
                value={matricule}
                onChange={e => setMatricule(e.target.value)}
                required
                placeholder="Ex: ENS-2024-0042"
                className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">
                Fourni par l'administration de l'ISIMM
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-blue-600 px-6 py-3 text-white font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-600"
          >
            {loading ? 'Création en cours...' : 'Créer un compte'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Déjà inscrit ?{' '}
          <Link to="/login" className="font-medium text-white hover:text-blue-300">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
