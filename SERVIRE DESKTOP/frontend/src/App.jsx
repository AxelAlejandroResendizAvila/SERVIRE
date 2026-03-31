import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import ReservationView from './pages/ReservationView';
import AdminPanel from './pages/AdminPanel';
import CreateSpace from './pages/CreateSpace';
import EditSpace from './pages/EditSpace';
import Login from './pages/Login';
import Register from './pages/Register';
import UserManagement from './pages/UserManagement';
import Reports from './pages/Reports';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route path="/" element={<Navigate to="/reserva" replace />} />
          <Route path="/reserva" element={
            <ProtectedRoute adminOnly={true}>
              <Layout>
                <ReservationView />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly={true}>
              <Layout>
                <AdminPanel />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/crear-espacio" element={
            <ProtectedRoute adminOnly={true}>
              <Layout>
                <CreateSpace />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/editar-espacio/:id" element={
            <ProtectedRoute adminOnly={true}>
              <Layout>
                <EditSpace />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/usuarios" element={
            <ProtectedRoute adminOnly={true}>
              <Layout>
                <UserManagement />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/reportes" element={
            <ProtectedRoute adminOnly={true}>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
