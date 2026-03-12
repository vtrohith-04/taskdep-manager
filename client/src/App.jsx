import { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TaskProvider } from './context/TaskContext';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const History = lazy(() => import('./pages/History'));
const GanttView = lazy(() => import('./pages/GanttView'));
const DependencyGraph = lazy(() => import('./pages/DependencyGraph'));
const KanbanView = lazy(() => import('./pages/KanbanView'));

function ProtectedLayout() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <TaskProvider>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
         <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
         <main className={`flex-1 overflow-x-hidden transition-all duration-300 ml-0 ${collapsed ? 'md:ml-20' : 'md:ml-56'}`}>
           <Outlet />
         </main>
      </div>
    </TaskProvider>
  );
}

const LoadingSpinner = () => (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin text-4xl">⚙️</div>
    </div>
);

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/gantt" element={<GanttView />} />
          <Route path="/kanban" element={<KanbanView />} />
          <Route path="/graph" element={<DependencyGraph />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
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
