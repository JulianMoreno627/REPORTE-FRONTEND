import { Sparkles, TriangleAlert } from 'lucide-react';
import { AI_RISK_META, CATEGORY_META } from '../../utils/domain.js';
import { Badge } from '../ui/Badges.jsx';

export function AiRiskBadge({ analysis }) {
  const meta = AI_RISK_META[analysis?.risk];
  if (!meta || analysis.isRoad === false) return null;
  return <Badge tone={meta.tone} title="Estimación automática a partir de la foto"><Sparkles size={12} aria-hidden="true" /> {meta.label}</Badge>;
}

export default function AiInsight({ analysis, reportedCategory }) {
  if (!analysis) return null;
  const categoryLabel = CATEGORY_META[analysis.category]?.label;
  const differs = analysis.category && reportedCategory && analysis.category !== reportedCategory;
  const confidence = analysis.confidence === null || analysis.confidence === undefined ? null : Math.round(analysis.confidence * 100);

  return (
    <div className="ai-insight">
      <p className="ai-insight__title">
        <Sparkles size={16} aria-hidden="true" /> Análisis con IA
        {confidence !== null && <span className="muted small">{confidence} % de confianza</span>}
      </p>
      {analysis.isRoad === false ? (
        <p className="ai-insight__warning"><TriangleAlert size={14} aria-hidden="true" /> La IA no reconoce una vía en esta foto.</p>
      ) : (
        <div className="ai-insight__badges">
          <Badge tone="slate">{categoryLabel ?? 'Sin daño visible'}</Badge>
          <AiRiskBadge analysis={analysis} />
        </div>
      )}
      {differs && <p className="ai-insight__warning">Reportado como {CATEGORY_META[reportedCategory]?.label.toLowerCase()}; la IA lo identifica como {categoryLabel.toLowerCase()}.</p>}
      {analysis.reason && <p className="ai-insight__reason">{analysis.reason}</p>}
      <p className="muted small">Estimación automática; la alcaldía la revisa antes de decidir.</p>
    </div>
  );
}
