import { Sparkles, TriangleAlert } from 'lucide-react';
import { CATEGORY_META } from '../../utils/domain.js';
import { Spinner } from '../ui/Feedback.jsx';
import { AiRiskBadge } from './AiInsight.jsx';

export default function AiSuggestion({ state, category, onApply }) {
  if (state.status === 'idle' || !state.enabled) return null;

  if (state.status === 'analyzing') {
    return <p className="ai-suggestion" role="status"><Spinner size={16} /> Analizando la foto con IA…</p>;
  }

  const { ai } = state;
  if (!ai) {
    return <p className="ai-suggestion muted small">La IA no pudo analizar esta foto. Elige el tipo de daño manualmente.</p>;
  }

  if (!ai.isRoad) {
    return (
      <p className="ai-suggestion ai-suggestion--warning" role="alert">
        <TriangleAlert size={16} aria-hidden="true" /> La IA no reconoce una vía en esta foto. Revisa que sea la foto del daño.
      </p>
    );
  }

  const label = CATEGORY_META[ai.category]?.label;
  return (
    <div className="ai-suggestion" role="status">
      <p className="ai-suggestion__head">
        <Sparkles size={16} aria-hidden="true" />
        {label ? <>La IA identifica: <strong>{label}</strong></> : 'La IA no ve un daño claro en la foto'}
        <AiRiskBadge analysis={ai} />
      </p>
      {ai.reason && <p className="ai-suggestion__reason">{ai.reason}</p>}
      {label && category === ai.category && state.applied && (
        <p className="muted small">Seleccionamos «{label}» como tipo de daño. Puedes cambiarlo arriba.</p>
      )}
      {label && category !== ai.category && (
        <button type="button" className="button button--secondary button--small" onClick={() => onApply(ai.category)}>
          Usar sugerencia: {label}
        </button>
      )}
    </div>
  );
}
