import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = () => {
  return (
    <div className="flex min-h-screen bg-app text-text">
      <Sidebar />
      <div className="flex-1">
        <Topbar />
        <main className="px-4 py-6 md:px-6 lg:px-8 xl:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
