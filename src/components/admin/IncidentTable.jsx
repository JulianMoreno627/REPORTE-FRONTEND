import { CategoryIcon, StatusBadge } from '../ui/Badges.jsx';
import { PRIORITY_META } from '../../utils/domain.js';
import { timeAgo } from '../../utils/format.js';

export default function IncidentTable({ items, selectedId, onSelect }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Daño</th>
            <th scope="col">Prioridad</th>
            <th scope="col" className="num">Reportes</th>
            <th scope="col">Estado</th>
            <th scope="col">Antigüedad</th>
            <th scope="col"><span className="visually-hidden">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          {items.map((incident) => {
            const meta = PRIORITY_META[incident.priority?.level ?? 'NONE'];
            return (
              <tr key={incident.id} className={incident.id === selectedId ? 'is-selected' : ''} onClick={() => onSelect(incident)}>
                <td>
                  <span className="table__cell-main">
                    <CategoryIcon category={incident.category} size={16} />
                    <span>
                      <strong>{incident.categoryLabel}</strong>
                      <small>{incident.roadTypeLabel}</small>
                    </span>
                  </span>
                </td>
                <td>
                  <span className="priority-cell" title={`Puntaje ${Math.round((incident.priority?.score ?? 0) * 100)} / 100`}>
                    <span className="meter meter--thin"><span style={{ width: `${(incident.priority?.score ?? 0) * 100}%`, background: meta.color }} /></span>
                    <span>{meta.label}</span>
                  </span>
                </td>
                <td className="num">{incident.reportCount}</td>
                <td><StatusBadge status={incident.status} label={incident.statusLabel} /></td>
                <td className="muted">{timeAgo(incident.createdAt)}</td>
                <td>
                  <button type="button" className="button button--small button--ghost" onClick={(event) => { event.stopPropagation(); onSelect(incident); }}>
                    Gestionar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
