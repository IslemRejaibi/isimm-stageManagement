import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
  const [role, setRole] = useState<'etudiant' | 'enseignant' | 'admin'>('etudiant');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [matricule, setMatricule] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: any = { nom, prenom, email, password, role };

      if (role === 'enseignant' || role === 'admin') {
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
    <div className="min-h-screen bg-app px-4 py-10">
      <div className="mx-auto max-w-md rounded-[28px] bg-white p-8 shadow-card border border-soft">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-amber text-navy text-xl font-semibold">U</div>
          <h2 className="text-3xl font-semibold text-heading">Créer un compte</h2>
          <p className="mt-2 text-sm text-muted">Inscrivez-vous et accédez à votre espace ISIMM.</p>
        </div>

        <div className="mb-6 grid gap-2 rounded-3xl border border-soft bg-surface-alt p-2">
          {['etudiant', 'enseignant', 'admin'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRole(option as 'etudiant' | 'enseignant' | 'admin')}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                role === option
                  ? 'bg-navy text-white'
                  : 'bg-white text-navy hover:bg-surface'
              }`}
            >
              {option === 'etudiant' ? 'Étudiant' : option === 'enseignant' ? 'Encadrant' : 'Admin'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-3xl border border-error/20 bg-error/10 p-4 text-sm text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label-small">Nom</label>
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} required className="input-field" />
          </div>
          <div>
            <label className="label-small">Prénom</label>
            <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} required className="input-field" />
          </div>
          <div>
            <label className="label-small">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" />
          </div>
          <div>
            <label className="label-small">Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" />
          </div>

          {(role === 'enseignant' || role === 'admin') && (
            <div>
              <label className="label-small">Matricule</label>
              <input
                type="text"
                value={matricule}
                onChange={(e) => setMatricule(e.target.value)}
                required
                placeholder="Ex: ENS-2024-0042"
                className="input-field"
              />
              <p className="mt-2 text-xs text-muted">Fourni par l'administration de l'ISIMM</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Création en cours...' : 'Créer un compte'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Déjà inscrit ?{' '}
          <Link to="/login" className="font-semibold text-navy hover:text-amber">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

