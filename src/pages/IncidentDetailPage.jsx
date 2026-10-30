import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ImageOff, MapPin, Share2, Users } from 'lucide-react';
import MiniMap from '../components/map/MiniMap.jsx';
import PriorityMeter from '../components/incident/PriorityMeter.jsx';
import StatusChangePanel from '../components/incident/StatusChangePanel.jsx';
import StatusHistory from '../components/incident/StatusHistory.jsx';
import StatusStepper from '../components/incident/StatusStepper.jsx';
import AiInsight from '../components/report/AiInsight.jsx';
import { CategoryIcon, PhotoCheckBadge, PriorityBadge, StatusBadge } from '../components/ui/Badges.jsx';
import { ErrorState, PageLoader } from '../components/ui/Feedback.jsx';
import { api } from '../api/client.js';
import { incidentsApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { formatCoords, formatDate, formatDateTime, timeAgo } from '../utils/format.js';

function ReportCard({ report, index, showCheck }) {
  const photo = api.assetUrl(report.photoUrl);
  return (
    <li className="report-card">
      <div className="report-card__media">
        {photo
          ? <a href={photo} target="_blank" rel="noreferrer"><img src={photo} alt={`Foto del reporte ${index + 1}`} loading="lazy" /></a>
          : <span className="report-card__placeholder"><ImageOff size={22} aria-hidden="true" /> Sin foto</span>}
      </div>
      <div className="report-card__body">
        <p className="report-card__title">
          <strong>Reporte {index + 1}</strong> · {report.categoryLabel}
        </p>
        <p className="muted small" title={formatDateTime(report.createdAt)}>{timeAgo(report.createdAt)}</p>
        {report.description && <p className="report-card__text">“{report.description}”</p>}
        {showCheck && <PhotoCheckBadge check={report.photoCheck} />}
        <AiInsight analysis={report.aiAnalysis} reportedCategory={report.category} />
      </div>
    </li>
  );
}

export default function IncidentDetailPage() {
  const { id } = useParams();
  const { isOfficial } = useAuth();
  const { clusterRadiusMeters } = useCatalog();
  const toast = useToast();
  const { data: incident, error, loading, reload, setData } = useApi((signal) => incidentsApi.detail(id, { signal }), [id]);
  useDocumentTitle(incident ? `${incident.categoryLabel} · ${incident.statusLabel}` : 'Incidente');

  if (error) {
    return (
      <div className="container">
        <ErrorState error={error} onRetry={error.status === 404 ? null : reload} title={error.status === 404 ? 'Este incidente no existe' : undefined} />
        <p className="center"><Link to="/mapa" className="button button--ghost"><ArrowLeft size={16} /> Volver al mapa</Link></p>
      </div>
    );
  }
  if (loading && !incident) return <PageLoader label="Cargando incidente…" />;

  const share = async () => {
    const url = `${api.baseUrl}/incidentes/${incident.id}`;
    try {
      if (navigator.share) await navigator.share({ title: `${incident.categoryLabel} reportado`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success('Enlace copiado al portapapeles.');
      }
    } catch {}
  };

  return (
    <div className="container">
      <nav className="breadcrumbs" aria-label="Ruta">
        <Link to="/mapa"><ArrowLeft size={16} aria-hidden="true" /> Mapa</Link>
      </nav>

      <header className="incident-hero">
        <CategoryIcon category={incident.category} size={28} />
        <div className="incident-hero__text">
          <h1>{incident.categoryLabel} en {incident.roadTypeLabel.toLowerCase()}</h1>
          <p className="incident-hero__meta">
            <span><CalendarDays size={15} aria-hidden="true" /> Reportado el {formatDate(incident.createdAt)}</span>
            <span><Users size={15} aria-hidden="true" /> {incident.reportCount} reportes de {incident.reporterCount} ciudadanos</span>
            <span><MapPin size={15} aria-hidden="true" /> {formatCoords(incident.location)}</span>
          </p>
          <div className="incident-hero__badges">
            <StatusBadge status={incident.status} label={incident.statusLabel} />
            <PriorityBadge priority={incident.priority} />
          </div>
        </div>
        <button type="button" className="button button--ghost" onClick={share}><Share2 size={16} aria-hidden="true" /> Compartir</button>
      </header>

      <div className="card card--flush">
        <StatusStepper status={incident.status} />
      </div>

      <div className="detail-grid">
        <div className="detail-grid__main">
          <section className="card">
            <h2 className="section-title">Ubicación</h2>
            <MiniMap location={incident.location} reports={incident.reports} radiusMeters={clusterRadiusMeters} level={incident.priority?.level} />
            <p className="muted small">El círculo marca el radio de {clusterRadiusMeters} m dentro del cual los reportes se agrupan en este incidente.</p>
          </section>

          <section className="card">
            <h2 className="section-title">Reportes ciudadanos ({incident.reports.length})</h2>
            <ul className="report-list">
              {incident.reports.map((report, index) => (
                <ReportCard key={report.id} report={report} index={index} showCheck={isOfficial} />
              ))}
            </ul>
          </section>
        </div>

        <aside className="detail-grid__side">
          {isOfficial && <StatusChangePanel incident={incident} onChanged={(updated) => setData((current) => ({ ...current, ...updated }))} />}

          <section className="card">
            <h2 className="section-title">Prioridad de atención</h2>
            <PriorityMeter priority={incident.priority} showFactors />
            <p className="muted small">Combina cantidad de reportes, antigüedad, tipo de vía y gravedad del daño.</p>
          </section>

          <section className="card">
            <h2 className="section-title">Seguimiento</h2>
            <StatusHistory history={incident.history} />
          </section>
        </aside>
      </div>
    </div>
  );
}
