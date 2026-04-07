import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MesStages from './pages/MesStages';
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
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
