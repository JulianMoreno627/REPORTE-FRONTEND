import { CloudUpload, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';
import { usePendingReports } from '../../hooks/usePendingReports.js';
import { useOfflineSync } from '../../hooks/useOfflineSync.js';
import { plural } from '../../utils/format.js';
import { Spinner } from '../ui/Feedback.jsx';

export default function ConnectionBanner() {
  const online = useOnlineStatus();
  const pending = usePendingReports();
  const { sync, syncing } = useOfflineSync();

  if (online && pending.length === 0) return null;

  return (
    <div className={`connection-banner${online ? ' connection-banner--pending' : ''}`} role="status">
      {online ? <CloudUpload size={18} aria-hidden="true" /> : <WifiOff size={18} aria-hidden="true" />}
      <p>
        {online
          ? `${plural(pending.length, 'reporte guardado', 'reportes guardados')} sin enviar.`
          : 'Estás sin conexión. Puedes seguir reportando: guardaremos tus reportes y los enviaremos al volver la señal.'}
        {!online && pending.length > 0 && <strong> {plural(pending.length, 'pendiente')}.</strong>}
      </p>
      {online && (
        <button type="button" className="button button--small button--secondary" onClick={sync} disabled={syncing}>
          {syncing ? <Spinner size={14} /> : null} Enviar ahora
        </button>
      )}
    </div>
  );
}
