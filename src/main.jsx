import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CatalogProvider } from './context/CatalogContext.jsx';
import { NotificationsProvider } from './context/NotificationsContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { registerServiceWorker } from './services/serviceWorker.js';
import { startWebVitals } from './services/webVitals.js';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CatalogProvider>
            <NotificationsProvider>
              <App />
            </NotificationsProvider>
          </CatalogProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);

registerServiceWorker(() => dispatchEvent(new Event('vs:sync-reports')));
startWebVitals();
