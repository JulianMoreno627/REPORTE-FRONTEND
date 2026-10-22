import { ChevronRight, Users } from 'lucide-react';
import { CategoryIcon, PriorityBadge, StatusBadge } from '../ui/Badges.jsx';
import { timeAgo } from '../../utils/format.js';

export default function IncidentListItem({ incident, rank, active = false, onClick }) {
  return (
    <button type="button" className={`incident-item${active ? ' is-active' : ''}`} onClick={() => onClick?.(incident)}>
      {rank && <span className="incident-item__rank">{rank}</span>}
      <CategoryIcon category={incident.category} />
      <span className="incident-item__body">
        <span className="incident-item__title">{incident.categoryLabel} <small>· {incident.roadTypeLabel}</small></span>
        <span className="incident-item__meta">
          <span><Users size={13} aria-hidden="true" /> {incident.reportCount}</span>
          <span>{timeAgo(incident.createdAt)}</span>
        </span>
        <span className="incident-item__badges">
          <StatusBadge status={incident.status} label={incident.statusLabel} />
          <PriorityBadge priority={incident.priority} />
        </span>
      </span>
      <ChevronRight size={18} className="incident-item__chevron" aria-hidden="true" />
    </button>
  );
}
