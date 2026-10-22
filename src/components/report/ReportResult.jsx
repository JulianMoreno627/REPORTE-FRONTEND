import { Link } from 'react-router-dom';
import { CircleCheckBig, CloudUpload, Merge } from 'lucide-react';
import { PhotoCheckBadge, StatusBadge } from '../ui/Badges.jsx';

export default function ReportResult({ result, onReset }) {
  if (result.queued) {
    return (
      <section className="result-card result-card--queued">
        <span className="result-card__icon"><CloudUpload size={34} aria-hidden="true" /></span>
        <h1>Reporte guardado en tu celular</h1>
        <p>No hay conexión en este momento. Lo enviaremos automáticamente apenas vuelva la señal; no tienes que hacer nada más.</p>
        <div className="result-card__actions">
          <Link to="/mis-reportes" className="button button--primary">Ver mis reportes</Link>
          <button type="button" className="button button--ghost" onClick={onReset}>Reportar otro daño</button>
        </div>
      </section>
    );
  }

  const { grouped, message, incident, analysis, photoFailed } = result;
  const Icon = grouped ? Merge : CircleCheckBig;
  return (
    <section className={`result-card${grouped ? ' result-card--grouped' : ''}`}>
      <span className="result-card__icon"><Icon size={34} aria-hidden="true" /></span>
      <h1>{grouped ? 'Tu reporte se sumó a un incidente existente' : '¡Reporte enviado!'}</h1>
      <p>{message}</p>
      {incident && (
        <div className="result-card__incident">
          <StatusBadge status={incident.status} label={incident.statusLabel} />
          <span><strong>{incident.reportCount}</strong> {incident.reportCount === 1 ? 'reporte' : 'reportes'} de este daño</span>
          {analysis && <PhotoCheckBadge check={analysis.photoCheck} />}
        </div>
      )}
      {photoFailed && <p className="notice notice--warning">El reporte quedó registrado, pero la foto no se pudo subir: {photoFailed}</p>}
      <p className="muted small">Te avisaremos cuando la alcaldía cambie el estado de este incidente.</p>
      <div className="result-card__actions">
        {incident && <Link to={`/incidentes/${incident.id}`} className="button button--primary">Seguir el incidente</Link>}
        <button type="button" className="button button--ghost" onClick={onReset}>Reportar otro daño</button>
      </div>
    </section>
  );
}
