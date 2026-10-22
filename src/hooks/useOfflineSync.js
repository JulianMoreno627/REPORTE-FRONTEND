import { useCallback, useEffect, useState } from 'react';
import { syncPending } from '../services/offlineQueue.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { plural } from '../utils/format.js';

export function useOfflineSync({ auto = false } = {}) {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [syncing, setSyncing] = useState(false);

  const sync = useCallback(async () => {
    if (!isAuthenticated) {
      toast.info('Inicia sesión para enviar los reportes guardados.');
      return;
    }
    setSyncing(true);
    try {
      const { sent, failed } = await syncPending();
      if (sent > 0) toast.success(`Se enviaron ${plural(sent, 'reporte guardado', 'reportes guardados')}.`, { title: 'Sincronizado' });
      failed.forEach(({ error }) => toast.error(error, { title: 'Un reporte no se pudo enviar' }));
    } catch (error) {
      toast.error(error.message, { title: 'No se pudo sincronizar' });
    } finally {
      setSyncing(false);
    }
  }, [isAuthenticated, toast]);

  useEffect(() => {
    if (!auto || !isAuthenticated) return undefined;
    const onOnline = () => sync();
    addEventListener('online', onOnline);
    addEventListener('vs:sync-reports', onOnline);
    if (navigator.onLine) sync();
    return () => {
      removeEventListener('online', onOnline);
      removeEventListener('vs:sync-reports', onOnline);
    };
  }, [auto, isAuthenticated, sync]);

  return { sync, syncing };
}
