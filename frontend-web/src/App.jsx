import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import BoardDashboard from './pages/BoardDashboard';
import MemberWeb from './pages/MemberWeb';
import './App.css';

const queryClient = new QueryClient();

function DashboardRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'SUPER_ADMIN') {
    return <AdminDashboard />;
  }

  if (user.role === 'BOARD_MEMBER') {
    return <BoardDashboard />;
  }

  if (user.role === 'MEMBER') {
    return <MemberWeb />;
  }

  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Role-specific routes (direct links) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/board"
              element={
                <ProtectedRoute allowedRoles={['BOARD_MEMBER']}>
                  <BoardDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/member"
              element={
                <ProtectedRoute allowedRoles={['MEMBER']}>
                  <MemberWeb />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App
