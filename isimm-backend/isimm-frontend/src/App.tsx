import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MesStages from './pages/MesStages';
import MonPFE from './pages/MonPFE';
import PfeDetails from './pages/PfeDetails';
import Documents from './pages/Documents';
import Notifications from './pages/Notifications';
import MonProfil from './pages/MonProfil';
import Parametres from './pages/Parametres';
import StageDetails from './pages/StageDetails';
import CreateStage from './pages/CreateStage';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const token = localStorage.getItem('token');

  return (
    <div className="flex">
      {token && <Sidebar />}
      <div className="flex-1">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/stages"
            element={
              <PrivateRoute>
                <MesStages />
              </PrivateRoute>
            }
          />
          <Route
            path="/stages/new"
            element={
              <PrivateRoute>
                <CreateStage />
              </PrivateRoute>
            }
          />
          <Route
            path="/stages/:id"
            element={
              <PrivateRoute>
                <StageDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/pfe"
            element={
              <PrivateRoute>
                <MonPFE />
              </PrivateRoute>
            }
          />
          <Route
            path="/pfe/:id"
            element={
              <PrivateRoute>
                <PfeDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <PrivateRoute>
                <Documents />
              </PrivateRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <PrivateRoute>
                <Notifications />
              </PrivateRoute>
            }
          />
          <Route
            path="/profil"
            element={
              <PrivateRoute>
                <MonProfil />
              </PrivateRoute>
            }
          />
          <Route
            path="/parametres"
            element={
              <PrivateRoute>
                <Parametres />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
