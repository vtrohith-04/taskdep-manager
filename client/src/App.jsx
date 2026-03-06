import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TaskProvider } from './context/TaskContext';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import GanttView from './pages/GanttView';
import DependencyGraph from './pages/DependencyGraph';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <TaskProvider>
              <Dashboard />
            </TaskProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <TaskProvider>
              <History />
            </TaskProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/gantt"
        element={
          <ProtectedRoute>
            <TaskProvider>
              <GanttView />
            </TaskProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/graph"
        element={
          <ProtectedRoute>
            <TaskProvider>
              <DependencyGraph />
            </TaskProvider>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AppRoutes />
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
