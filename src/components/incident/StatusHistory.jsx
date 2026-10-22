import { STATUS_META } from '../../utils/domain.js';
import { formatDateTime, timeAgo } from '../../utils/format.js';

export default function StatusHistory({ history = [] }) {
  const entries = [...history].reverse();
  return (
    <ol className="timeline">
      {entries.map((entry, index) => {
        const tone = STATUS_META[entry.status]?.tone ?? 'gray';
        return (
          <li key={`${entry.at}-${index}`} className={`timeline__item timeline__item--${tone}`}>
            <span className="timeline__dot" aria-hidden="true" />
            <div>
              <p className="timeline__title">
                <strong>{entry.statusLabel}</strong>
                <time dateTime={entry.at} title={formatDateTime(entry.at)}>{timeAgo(entry.at)}</time>
              </p>
              {entry.note && <p className="timeline__note">{entry.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
