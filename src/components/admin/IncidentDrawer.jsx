import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, X } from 'lucide-react';
import PriorityMeter from '../incident/PriorityMeter.jsx';
import StatusChangePanel from '../incident/StatusChangePanel.jsx';
import StatusHistory from '../incident/StatusHistory.jsx';
import StatusStepper from '../incident/StatusStepper.jsx';
import { CategoryIcon, PriorityBadge, StatusBadge } from '../ui/Badges.jsx';
import { formatCoords, formatDate } from '../../utils/format.js';

export default function IncidentDrawer({ incident, onClose, onChanged }) {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!incident) return null;
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <header className="drawer__head">
          <CategoryIcon category={incident.category} size={22} />
          <div>
            <h2 id="drawer-title">{incident.categoryLabel}</h2>
            <p className="muted small">{incident.roadTypeLabel} · desde {formatDate(incident.createdAt)} · {formatCoords(incident.location)}</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
        </header>
        <div className="drawer__body">
          <div className="selected-card__badges">
            <StatusBadge status={incident.status} label={incident.statusLabel} />
            <PriorityBadge priority={incident.priority} />
            <span className="badge badge--gray">{incident.reportCount} reportes · {incident.reporterCount} ciudadanos</span>
          </div>
          <StatusStepper status={incident.status} compact />
          <PriorityMeter priority={incident.priority} showFactors />
          <StatusChangePanel key={incident.id + incident.status} incident={incident} onChanged={onChanged} />
          <section>
            <h3 className="section-title">Historial</h3>
            <StatusHistory history={incident.history} />
          </section>
          <Link to={`/incidentes/${incident.id}`} className="button button--ghost button--block">
            <ExternalLink size={16} aria-hidden="true" /> Ver fotos y detalle completo
          </Link>
        </div>
      </aside>
    </>
  );
}
