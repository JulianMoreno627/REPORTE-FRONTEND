import { Check, X } from 'lucide-react';
import { STATUS_FLOW, STATUS_META } from '../../utils/domain.js';

export default function StatusStepper({ status, compact = false }) {
  const rejected = status === 'REJECTED';
  const currentIndex = rejected ? -1 : STATUS_FLOW.indexOf(status);

  return (
    <ol className={`stepper${compact ? ' stepper--compact' : ''}`} aria-label="Estado del incidente">
      {STATUS_FLOW.map((code, index) => {
        const done = index < currentIndex || (index === currentIndex && code === 'RESOLVED');
        const current = index === currentIndex && !done;
        const state = done ? 'done' : current ? 'current' : 'pending';
        return (
          <li key={code} className={`stepper__step stepper__step--${state}`} aria-current={current ? 'step' : undefined}>
            <span className="stepper__dot">{done ? <Check size={compact ? 10 : 14} strokeWidth={3} /> : index + 1}</span>
            <span className="stepper__label">{STATUS_META[code].label}</span>
          </li>
        );
      })}
      {rejected && (
        <li className="stepper__step stepper__step--rejected" aria-current="step">
          <span className="stepper__dot"><X size={compact ? 10 : 14} strokeWidth={3} /></span>
          <span className="stepper__label">Descartado</span>
        </li>
      )}
    </ol>
  );
}
