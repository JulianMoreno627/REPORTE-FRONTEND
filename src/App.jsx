import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout.jsx';
import { RequireAuth, RequireOfficial } from './components/layout/RouteGuards.jsx';
import { PageLoader } from './components/ui/Feedback.jsx';
import { useOfflineSync } from './hooks/useOfflineSync.js';
import MapPage from './pages/MapPage.jsx';

const ReportPage = lazy(() => import('./pages/ReportPage.jsx'));
const IncidentDetailPage = lazy(() => import('./pages/IncidentDetailPage.jsx'));
const MyReportsPage = lazy(() => import('./pages/MyReportsPage.jsx'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage.jsx'));
const AdminPage = lazy(() => import('./pages/AdminPage.jsx'));
const WelcomePage = lazy(() => import('./pages/WelcomePage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

function ToWelcome() {
  const { state } = useLocation();
  return <Navigate to="/" replace state={state} />;
}

export default function App() {
  useOfflineSync({ auto: true });

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route index element={<WelcomePage />} />
        <Route path="ingresar" element={<ToWelcome />} />
        <Route path="registro" element={<ToWelcome />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="mapa" element={<MapPage />} />
            <Route path="incidentes/:id" element={<IncidentDetailPage />} />
            <Route path="reportar" element={<ReportPage />} />
            <Route path="mis-reportes" element={<MyReportsPage />} />
            <Route path="notificaciones" element={<NotificationsPage />} />
            <Route element={<RequireOfficial />}>
              <Route path="panel" element={<AdminPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
