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
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/stages" element={<MesStages />} />
        <Route path="/stages/new" element={<CreateStage />} />
        <Route path="/stages/:id" element={<StageDetails />} />
        <Route path="/pfe" element={<MonPFE />} />
        <Route path="/pfe/:id" element={<PfeDetails />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profil" element={<MonProfil />} />
        <Route path="/parametres" element={<Parametres />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;
