import { useEffect, useState } from 'react';
import api from '../services/api';

interface UserProfile {
  nom: string;
  prenom: string;
  email: string;
  numeroEtudiant?: string;
  specialite?: string;
  niveau?: string;
  departement?: string;
  telephone?: string;
}

const MonProfil = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      await api.put('/auth/update-profile', editData);
      setUser({ ...user!, ...editData });
      setIsEditing(false);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({});
    setIsEditing(false);
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-lg text-slate-600">Chargement du profil...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 lg:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Mon profil</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">Consultez et gérez vos informations personnelles</h1>
            </div>
            <button onClick={() => setIsEditing(!isEditing)} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              {isEditing ? 'Annuler' : 'Modifier'}
            </button>
          </div>
          {isEditing && (
            <div className="mt-6 flex gap-4">
              <button onClick={handleSave} disabled={loading} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                Sauvegarder
              </button>
              <button onClick={handleCancel} className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50">
                Annuler
              </button>
            </div>
          )}
        </header>

        {error && (
          <div className="rounded-3xl bg-red-50 p-5 text-red-700 ring-1 ring-red-200">{error}</div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-900 text-4xl font-semibold text-white">
                {user ? `${user.nom?.[0] || ''}${user.prenom?.[0] || ''}` : 'U'}
              </div>
              <div>
                <p className="text-sm text-slate-500">{user?.numeroEtudiant ? `N° ${user.numeroEtudiant}` : 'Étudiant'}</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">{user?.prenom} {user?.nom}</h2>
                <p className="mt-1 text-slate-500">{user?.specialite || 'Aucune spécialité renseignée'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Sécurité</h2>
            <p className="mt-3 text-sm text-slate-500">Gérez les informations de connexion et les paramètres de votre compte.</p>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Email</p>
                <p className="mt-2 font-semibold text-slate-900">{user?.email}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Téléphone</p>
                <p className="mt-2 font-semibold text-slate-900">{user?.telephone || 'Non renseigné'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Informations personnelles</h2>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div>
                  <p className="text-sm text-slate-500">Nom</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.nom || user?.nom || ''}
                      onChange={(e) => setEditData({ ...editData, nom: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none"
                    />
                  ) : (
                    <p className="mt-2 font-semibold text-slate-900">{user?.nom}</p>
                  )}
                </div>
                <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-800">Éditer</button>
              </div>
              <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div>
                  <p className="text-sm text-slate-500">Prénom</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.prenom || user?.prenom || ''}
                      onChange={(e) => setEditData({ ...editData, prenom: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none"
                    />
                  ) : (
                    <p className="mt-2 font-semibold text-slate-900">{user?.prenom}</p>
                  )}
                </div>
                <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:text-blue-800">Éditer</button>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Numéro étudiant</p>
                <p className="mt-2 font-semibold text-slate-900">{user?.numeroEtudiant || 'Non renseigné'}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Spécialité</p>
                <p className="mt-2 font-semibold text-slate-900">{user?.specialite || 'Non renseignée'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Informations académiques</h2>
            </div>
            <div className="mt-6 grid gap-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Niveau</p>
                <p className="mt-2 font-semibold text-slate-900">{user?.niveau || 'Non renseigné'}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Département</p>
                <p className="mt-2 font-semibold text-slate-900">{user?.departement || 'Non renseigné'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonProfil;
