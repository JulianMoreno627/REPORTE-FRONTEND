import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { EmptyState, PageLoader } from '../ui/Feedback.jsx';

function ToWelcome({ signedOut }) {
  const location = useLocation();
  return <Navigate to="/" replace state={signedOut ? null : { from: location.pathname }} />;
}

export function RequireAuth() {
  const { ready, isAuthenticated, signedOut } = useAuth();
  if (!ready) return <PageLoader label="Verificando tu sesión…" />;
  if (!isAuthenticated) return <ToWelcome signedOut={signedOut} />;
  return <Outlet />;
}

export function RequireOfficial() {
  const { ready, isAuthenticated, isOfficial, signedOut } = useAuth();
  if (!ready) return <PageLoader label="Verificando tu sesión…" />;
  if (!isAuthenticated) return <ToWelcome signedOut={signedOut} />;
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
