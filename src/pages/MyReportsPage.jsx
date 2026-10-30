import { Link } from 'react-router-dom';
import { ChevronRight, ClipboardPen, CloudUpload, Map, Plus, Trash2, Users } from 'lucide-react';
import StatusStepper from '../components/incident/StatusStepper.jsx';
import { AiRiskBadge } from '../components/report/AiInsight.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { CategoryIcon, PhotoCheckBadge, StatusBadge } from '../components/ui/Badges.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback.jsx';
import { api } from '../api/client.js';
import { reportsApi } from '../api/endpoints.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { usePendingReports } from '../hooks/usePendingReports.js';
import { useOfflineSync } from '../hooks/useOfflineSync.js';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { removePending } from '../services/offlineQueue.js';
import { timeAgo } from '../utils/format.js';

const HOW_IT_WORKS = [
  { title: 'Toma una foto', text: 'del bache o daño en la vía.' },
  { title: 'Marca el lugar', text: 'con tu GPS o en el mapa.' },
  { title: 'Sigue el estado', text: 'te avisamos cada cambio.' },
];

const isOpen = (status) => status && !['RESOLVED', 'REJECTED'].includes(status);

function PendingCard({ item }) {
  const { labelOf } = useCatalog();
  return (
    <li className="my-report my-report--pending">
      <CategoryIcon category={item.category} />
      <div className="my-report__body">
        <p className="my-report__title">{labelOf('categories', item.category)}</p>
        <p className="muted small">Guardado {timeAgo(item.queuedAt)} · {item.photo ? 'con foto' : 'sin foto'}</p>
      </div>
      <span className="badge badge--amber"><CloudUpload size={13} aria-hidden="true" /> Por enviar</span>
      <button type="button" className="icon-button icon-button--sm" onClick={() => removePending(item.clientRequestId)} aria-label="Descartar reporte guardado">
        <Trash2 size={16} />
      </button>
    </li>
  );
}

function ReportCard({ report }) {
  const photo = api.assetUrl(report.photoUrl);
  const { incident } = report;
  return (
    <li>
      <Link to={incident ? `/incidentes/${incident.id}` : '#'} className="my-report">
        {photo ? <img src={photo} alt="" className="my-report__thumb" loading="lazy" /> : <CategoryIcon category={report.category} />}
        <div className="my-report__body">
          <p className="my-report__title">
            {report.categoryLabel}
            {incident && <StatusBadge status={incident.status} label={incident.statusLabel} />}
          </p>
          <p className="muted small">
            Reportado {timeAgo(report.createdAt)}
            {incident && <> · <Users size={12} aria-hidden="true" /> {incident.reportCount} {incident.reportCount === 1 ? 'reporte' : 'reportes'}</>}
            {incident && <> · actualizado {timeAgo(incident.updatedAt)}</>}
          </p>
          {incident && <StatusStepper status={incident.status} compact />}
          <PhotoCheckBadge check={report.photoCheck} />
          <AiRiskBadge analysis={report.aiAnalysis} />
        </div>
        <ChevronRight size={18} className="my-report__chevron" aria-hidden="true" />
      </Link>
    </li>
  );
}

export default function MyReportsPage() {
  useDocumentTitle('Mis reportes');
  const online = useOnlineStatus();
  const pending = usePendingReports();
  const { sync, syncing } = useOfflineSync();
  const { data, error, loading, reload } = useApi((signal) => reportsApi.mine({ signal }), [online, pending.length]);

  const reports = [...(data?.items ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const inProgress = reports.filter((report) => isOpen(report.incident?.status)).length;
  const resolved = reports.filter((report) => report.incident?.status === 'RESOLVED').length;

  return (
    <div className="container container--narrow">
      <PageHeader
        eyebrow="Seguimiento"
        title="Mis reportes"
        description="Aquí ves en qué va cada daño que reportaste. Te avisamos cuando cambie su estado."
        actions={<Link to="/reportar" className="button button--accent"><Plus size={18} aria-hidden="true" /> Nuevo reporte</Link>}
      />

      {data && reports.length > 0 && (
        <div className="stat-row">
          <div className="stat"><strong>{reports.length}</strong><span>Reportes</span></div>
          <div className="stat"><strong>{inProgress}</strong><span>En proceso</span></div>
          <div className="stat stat--green"><strong>{resolved}</strong><span>Resueltos</span></div>
        </div>
      )}

      {pending.length > 0 && (
        <section className="card">
          <div className="card__head">
            <h2 className="section-title">Guardados sin conexión</h2>
            {online && <button type="button" className="button button--small button--secondary" onClick={sync} disabled={syncing}>Enviar ahora</button>}
          </div>
          <ul className="my-report-list">{pending.map((item) => <PendingCard key={item.clientRequestId} item={item} />)}</ul>
        </section>
      )}

      {error && !data && <ErrorState error={error} onRetry={reload} />}
      {loading && !data && <Skeleton lines={5} />}
      {data && reports.length === 0 && pending.length === 0 && (
        <EmptyState
          icon={ClipboardPen}
          tone="accent"
          variant="card"
          level={2}
          title="Aún no has reportado ningún daño"
          action={<Link to="/reportar" className="button button--accent button--large"><Plus size={18} aria-hidden="true" /> Hacer mi primer reporte</Link>}
          secondaryAction={<Link to="/mapa" className="button button--ghost button--large"><Map size={18} aria-hidden="true" /> Ver el mapa</Link>}
          extra={(
            <ol className="empty-steps" aria-label="Cómo funciona">
              {HOW_IT_WORKS.map((step) => <li key={step.title}><span><strong>{step.title}</strong> {step.text}</span></li>)}
            </ol>
          )}
        >
          Cuando veas un bache o un daño en la vía, repórtalo en menos de un minuto y síguelo desde aquí hasta su reparación.
        </EmptyState>
      )}
      {reports.length > 0 && <ul className="my-report-list">{reports.map((report) => <ReportCard key={report.id} report={report} />)}</ul>}
    </div>
  );
}
