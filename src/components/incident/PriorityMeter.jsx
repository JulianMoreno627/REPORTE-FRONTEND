import { PRIORITY_FACTORS, PRIORITY_META } from '../../utils/domain.js';
import { percent } from '../../utils/format.js';

export default function PriorityMeter({ priority, showFactors = false, compact = false }) {
  if (!priority) return null;
  const meta = PRIORITY_META[priority.level] ?? PRIORITY_META.NONE;
  const score = Math.round(priority.score * 100);

  return (
    <div className={`priority-meter${compact ? ' priority-meter--compact' : ''}`}>
      <div className="priority-meter__head">
        <span>Prioridad</span>
        <strong style={{ color: meta.color }}>{priority.level === 'NONE' ? meta.label : `${score} · ${meta.label}`}</strong>
      </div>
      <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score} aria-label="Puntaje de prioridad">
        <span style={{ width: `${score}%`, background: meta.color }} />
      </div>
      {showFactors && priority.factors && (
        <dl className="factors">
          {Object.entries(priority.factors).map(([key, value]) => (
            <div key={key} className="factors__row">
              <dt>{PRIORITY_FACTORS[key] ?? key}</dt>
              <dd>
                <span className="meter meter--thin"><span style={{ width: `${value * 100}%` }} /></span>
                <span className="factors__value">{percent(value)}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
