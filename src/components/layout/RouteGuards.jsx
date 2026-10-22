import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { EmptyState, PageLoader } from '../ui/Feedback.jsx';

export function RequireAuth() {
  const { ready, isAuthenticated } = useAuth();
  const location = useLocation();
  if (!ready) return <PageLoader label="Verificando tu sesión…" />;
  if (!isAuthenticated) return <Navigate to="/" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function RequireOfficial() {
  const { ready, isAuthenticated, isOfficial } = useAuth();
  const location = useLocation();
  if (!ready) return <PageLoader label="Verificando tu sesión…" />;
  if (!isAuthenticated) return <Navigate to="/" replace state={{ from: location.pathname }} />;
  if (!isOfficial) {
    return (
      <div className="container">
        <EmptyState icon={ShieldAlert} title="Sección exclusiva de la alcaldía">
          El panel de gestión solo está disponible para cuentas de funcionario.
        </EmptyState>
      </div>
    );
  }
  return <Outlet />;
}
