import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, CheckCheck, ClipboardList, LayoutDashboard, Plus } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader.jsx';
import { EmptyState } from '../components/ui/Feedback.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationsContext.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { formatDateTime, timeAgo } from '../utils/format.js';

const supportsSystemNotifications = typeof window !== 'undefined' && 'Notification' in window;

export default function NotificationsPage() {
  useDocumentTitle('Notificaciones');
  const { isOfficial } = useAuth();
  const { items, unread, connected, markRead, markAllRead } = useNotifications();
  const [permission, setPermission] = useState(supportsSystemNotifications ? Notification.permission : 'unsupported');

  const askPermission = async () => setPermission(await Notification.requestPermission());

  return (
    <div className="container container--narrow">
      <PageHeader
        eyebrow={<span className={`live-dot${connected ? ' is-on' : ''}`}>{connected ? 'En vivo' : 'Reconectando…'}</span>}
        title="Notificaciones"
        description="Cuando la alcaldía cambia el estado de un daño que reportaste, te llega un aviso aquí."
        actions={unread > 0 && (
          <button type="button" className="button button--ghost" onClick={markAllRead}><CheckCheck size={18} aria-hidden="true" /> Marcar todo como leído</button>
        )}
      />

      {permission === 'default' && (
        <div className="notice notice--info">
          <BellRing size={18} aria-hidden="true" />
          <p>¿Quieres recibir avisos aunque no tengas la app abierta en pantalla?</p>
          <button type="button" className="button button--small button--primary" onClick={askPermission}>Activar avisos</button>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={BellRing}
          variant="card"
          level={2}
          title="Todo tranquilo por ahora"
          action={isOfficial
            ? <Link to="/panel" className="button button--primary"><LayoutDashboard size={18} aria-hidden="true" /> Ir al panel</Link>
            : <Link to="/reportar" className="button button--accent"><Plus size={18} aria-hidden="true" /> Reportar un daño</Link>}
          secondaryAction={!isOfficial && (
            <Link to="/mis-reportes" className="button button--ghost"><ClipboardList size={18} aria-hidden="true" /> Mis reportes</Link>
          )}
        >
          Aquí aparecerán los avisos cuando la alcaldía revise, repare o cierre un daño que reportaste.
          {permission === 'granted' && ' También te llegarán como notificación del sistema.'}
        </EmptyState>
      ) : (
        <ul className="notification-list">
          {items.map((item) => (
            <li key={item.id} className={`notification${item.read ? '' : ' is-unread'}`}>
              <span className="notification__dot" aria-hidden="true" />
              <div className="notification__body">
                <p className="notification__title">{item.title}</p>
                <p>{item.message}</p>
                <p className="notification__meta">
                  <time dateTime={item.createdAt} title={formatDateTime(item.createdAt)}>{timeAgo(item.createdAt)}</time>
                  {item.incidentId && <Link to={`/incidentes/${item.incidentId}`} onClick={() => markRead(item.id)}>Ver incidente</Link>}
                  {!item.read && <button type="button" className="link-button" onClick={() => markRead(item.id)}>Marcar como leída</button>}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
