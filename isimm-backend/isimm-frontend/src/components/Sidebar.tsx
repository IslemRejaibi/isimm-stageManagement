import { NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.tsx';

const Sidebar = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <aside className="w-80 min-h-screen bg-[#13283d] text-white shadow-card">
      <div className="flex h-full flex-col justify-between p-6">
        <div>
          <div className="mb-10 flex items-center gap-3 rounded-3xl bg-white/15 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber text-navy font-bold">U</div>
            <div>
              <h1 className="text-xl font-semibold text-white">Université ISIMM</h1>
              <p className="text-xs uppercase tracking-[0.3em] text-amber/90">Portail étudiant</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { to: '/dashboard', label: t('sidebar.dashboard') },
              { to: '/stages', label: t('sidebar.stages') },
              { to: '/pfe', label: t('sidebar.pfe') },
              { to: '/documents', label: t('sidebar.documents') },
              { to: '/notifications', label: t('sidebar.notifications') },
            ].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/30 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-card ring-1 ring-amber/20'
                      : 'text-white hover:bg-white/15 hover:text-white'
                  }`
                }
              >
                <span className="h-2.5 w-2.5 rounded-full bg-amber" />
                {link.label}
              </NavLink>
            ))}

            <div className="mt-8 rounded-3xl border border-white/20 bg-white/10 p-4 text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Compte</p>
              <NavLink
                to="/profil"
                className={({ isActive }) =>
                  `mt-3 block rounded-3xl px-4 py-3 text-sm font-medium transition ${
                    isActive ? 'bg-white text-slate-900' : 'text-white hover:bg-white/15 hover:text-white'
                  }`
                }
              >
                {t('sidebar.profile')}
              </NavLink>
              <NavLink
                to="/parametres"
                className={({ isActive }) =>
                  `mt-2 block rounded-3xl px-4 py-3 text-sm font-medium transition ${
                    isActive ? 'bg-white text-slate-900' : 'text-white hover:bg-white/15 hover:text-white'
                  }`
                }
              >
                {t('sidebar.settings')}
              </NavLink>
            </div>
          </nav>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 w-full rounded-3xl bg-amber px-4 py-3 text-sm font-semibold text-navy transition hover:bg-[#B69341]"
        >
          {t('sidebar.logout')}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
