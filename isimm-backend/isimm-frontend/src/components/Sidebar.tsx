import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <aside className="w-72 min-h-screen bg-slate-900 text-white p-6">
      <div className="mb-10">
        <h1 className="text-2xl font-bold">ISIMM</h1>
        <p className="text-sm text-slate-400">Espace étudiant</p>
      </div>

      <nav className="space-y-3">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `block rounded-md px-3 py-2 text-sm font-medium ${
              isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/stages"
          className={({ isActive }) =>
            `block rounded-md px-3 py-2 text-sm font-medium ${
              isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`
          }
        >
          Mes stages
        </NavLink>
        <NavLink
          to="/pfe"
          className={({ isActive }) =>
            `block rounded-md px-3 py-2 text-sm font-medium ${
              isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`
          }
        >
          Mon PFE
        </NavLink>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full text-left rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          Déconnexion
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
