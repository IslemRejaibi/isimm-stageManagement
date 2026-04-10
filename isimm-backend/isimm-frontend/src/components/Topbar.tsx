import { useLocation } from 'react-router-dom';

const breadcrumbLabels: Record<string, string> = {
  dashboard: 'Tableau de bord',
  stages: 'Stages',
  pfe: 'PFE',
  documents: 'Documents',
  notifications: 'Notifications',
  profil: 'Profil',
  parametres: 'Paramètres',
  'stages/new': 'Nouvelle demande',
};

const Topbar = () => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  const title = segments.length
    ? breadcrumbLabels[segments.join('/')] || breadcrumbLabels[segments[0]] || segments[segments.length - 1]
    : 'Tableau de bord';

  return (
    <header className="border-b border-soft bg-white px-6 py-4 shadow-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div>
          <p className="text-[12px] uppercase tracking-[0.3em] text-muted">Portail étudiant</p>
          <h1 className="mt-2 text-2xl font-semibold text-heading">{title}</h1>
        </div>
        <div className="flex items-center gap-3 rounded-3xl border border-soft bg-surface px-4 py-2 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">U</div>
          <div>
            <p className="text-sm font-semibold text-heading">Utilisateur</p>
            <p className="text-xs text-muted">Administratif</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
