import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

interface NotificationItem {
  id: string;
  titre: string;
  texte: string;
  categorie: string;
  date: string;
  nonLu: boolean;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const [stageRes, pfeRes] = await Promise.all([api.get('/stages'), api.get('/pfe')]);
      const stages = stageRes.data.stages || [];
      const pfes = pfeRes.data.pfes || [];

      const items: NotificationItem[] = [];

      stages.forEach((stage: any) => {
        if (stage.statut === 'validé') {
          items.push({
            id: `${stage._id}-stage-valide`,
            titre: 'Stage validé',
            texte: `Votre demande de stage chez ${stage.entreprise?.nom || "l'entreprise"} a été validée.`,
            categorie: 'Stage',
            date: new Date(stage.updatedAt || stage.createdAt).toLocaleString('fr-FR'),
            nonLu: true,
          });
        }
        if (stage.statut === 'en_attente') {
          items.push({
            id: `${stage._id}-stage-attente`,
            titre: 'Document en attente',
            texte: `Votre convention de stage est en cours de validation.`,
            categorie: 'Document',
            date: new Date(stage.updatedAt || stage.createdAt).toLocaleString('fr-FR'),
            nonLu: false,
          });
        }
      });

      pfes.forEach((pfe: any) => {
        if (pfe.statut === 'validé') {
          items.push({
            id: `${pfe._id}-pfe-valide`,
            titre: 'PFE validé',
            texte: `Votre projet de fin d'études "${pfe.titre}" a été validé.`,
            categorie: 'PFE',
            date: new Date(pfe.updatedAt || pfe.createdAt).toLocaleString('fr-FR'),
            nonLu: true,
          });
        }
        if (pfe.rapportIntermediaire?.url) {
          items.push({
            id: `${pfe._id}-pfe-rapport`,
            titre: 'Rapport déposé',
            texte: `Votre rapport intermédiaire a été déposé avec succès.`,
            categorie: 'Document',
            date: new Date(pfe.rapportIntermediaire.dateDepot).toLocaleString('fr-FR'),
            nonLu: false,
          });
        }
      });

      setNotifications(items.sort((a, b) => (a.date < b.date ? 1 : -1)));
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Impossible de charger les notifications');
    } finally {
      setLoading(false);
    }
  };

  const counts = useMemo(() => ({
    total: notifications.length,
    nonLu: notifications.filter((item) => item.nonLu).length,
    stage: notifications.filter((item) => item.categorie === 'Stage').length,
    pfe: notifications.filter((item) => item.categorie === 'PFE').length,
  }), [notifications]);

  return (
    <div className="min-h-screen bg-app px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="page-header">
          <h1 className="text-3xl font-semibold text-slate-900">Notifications</h1>
          <p className="mt-2 text-slate-500">Consultez les dernières informations sur vos stages et votre PFE.</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="app-card p-6">
            <p className="text-sm text-muted">Total</p>
            <p className="mt-4 text-3xl font-semibold text-heading">{counts.total}</p>
          </div>
          <div className="app-card p-6">
            <p className="text-sm text-muted">Non lues</p>
            <p className="mt-4 text-3xl font-semibold text-heading">{counts.nonLu}</p>
          </div>
          <div className="app-card p-6">
            <p className="text-sm text-muted">Stages</p>
            <p className="mt-4 text-3xl font-semibold text-heading">{counts.stage}</p>
          </div>
          <div className="app-card p-6">
            <p className="text-sm text-muted">PFE</p>
            <p className="mt-4 text-3xl font-semibold text-heading">{counts.pfe}</p>
          </div>
        </div>

        {error && (
          <div className="rounded-3xl bg-red-50 p-5 text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Toutes les notifications</h2>
            <button
              type="button"
              onClick={() => setNotifications((prev) => prev.map((item) => ({ ...item, nonLu: false })))}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Tout marquer comme lu
            </button>
          </div>
          {loading ? (
            <div className="text-center text-slate-600">Chargement...</div>
          ) : (
            <div className="space-y-4">
              {notifications.map((item) => (
                <div key={item.id} className={`rounded-3xl border border-slate-200 p-5 ${item.nonLu ? 'bg-slate-50' : 'bg-white'}`}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{item.titre}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.texte}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{item.categorie}</p>
                      <p className="mt-2 text-xs text-slate-500">{item.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
