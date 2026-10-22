import { useState } from 'react';
import { Merge, Play } from 'lucide-react';
import { adminApi } from '../../api/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { timeAgo } from '../../utils/format.js';
import { Spinner } from '../ui/Feedback.jsx';

export default function ConsolidationCard({ status, onDone }) {
  const toast = useToast();
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState(status?.lastRun ?? null);
  const run = lastRun ?? status?.lastRun;

  const execute = async () => {
    setRunning(true);
    try {
      const result = await adminApi.consolidate();
      setLastRun(result);
      toast.success(result.incidentsMerged
        ? `Se unificaron ${result.incidentsMerged} incidente(s) duplicados.`
        : 'No se encontraron incidentes duplicados.', { title: 'Consolidación terminada' });
      onDone?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="card">
      <div className="card__head">
        <h2 className="section-title"><Merge size={18} aria-hidden="true" /> Agrupación de duplicados</h2>
      </div>
      <p className="muted small">
        DBSCAN revisa todos los reportes abiertos y une los incidentes a menos de 30 m entre sí.
        {status?.intervalMs ? ` Se ejecuta solo cada ${Math.round(status.intervalMs / 60000)} min.` : ''}
      </p>
      {run ? (
        <dl className="kv">
          <div><dt>Última ejecución</dt><dd>{timeAgo(run.at)}</dd></div>
          <div><dt>Reportes analizados</dt><dd>{run.reportsAnalyzed}</dd></div>
          <div><dt>Grupos encontrados</dt><dd>{run.clustersFound}</dd></div>
          <div><dt>Incidentes unificados</dt><dd>{run.incidentsMerged}</dd></div>
          <div><dt>Duración</dt><dd>{run.durationMs} ms</dd></div>
        </dl>
      ) : <p className="muted small">Aún no se ha ejecutado desde que inició el servidor.</p>}
      <button type="button" className="button button--secondary button--block" onClick={execute} disabled={running || status?.running}>
        {running ? <Spinner size={16} /> : <Play size={16} aria-hidden="true" />} {running ? 'Analizando…' : 'Ejecutar ahora'}
      </button>
    </section>
  );
}
