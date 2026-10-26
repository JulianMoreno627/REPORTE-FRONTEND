import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Layers, LocateFixed, MapPin, MapPinPlus, Plus, SearchX, Users, X } from 'lucide-react';
import IncidentMap from '../components/map/IncidentMap.jsx';
import IncidentListItem from '../components/incident/IncidentListItem.jsx';
import PriorityMeter from '../components/incident/PriorityMeter.jsx';
import StatusStepper from '../components/incident/StatusStepper.jsx';
import { CategoryIcon, PriorityBadge, StatusBadge } from '../components/ui/Badges.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback.jsx';
import { incidentsApi } from '../api/endpoints.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { PRIORITY_META } from '../utils/domain.js';
import { plural, timeAgo } from '../utils/format.js';

const STATUS_FILTERS = [
  { value: 'OPEN', label: 'Abiertos' },
  { value: 'IN_REPAIR', label: 'En reparación' },
  { value: 'RESOLVED', label: 'Resueltos' },
  { value: '', label: 'Todos' },
];

const boundsKey = (bounds) => (bounds ? [bounds.minLat, bounds.minLng, bounds.maxLat, bounds.maxLng].map((v) => v.toFixed(4)).join(',') : '');

function SelectedIncident({ incident, onClose }) {
  return (
    <article className="selected-card" aria-label="Incidente seleccionado">
      <header className="selected-card__head">
        <CategoryIcon category={incident.category} size={22} />
        <div>
          <h2>{incident.categoryLabel}</h2>
          <p>{incident.roadTypeLabel} · reportado {timeAgo(incident.createdAt)}</p>
        </div>
        <button type="button" className="icon-button icon-button--sm" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
      </header>
      <div className="selected-card__badges">
        <StatusBadge status={incident.status} label={incident.statusLabel} />
        <PriorityBadge priority={incident.priority} />
      </div>
      <StatusStepper status={incident.status} compact />
      <div className="selected-card__stats">
        <div><strong>{incident.reportCount}</strong><span>reportes agrupados</span></div>
        <div><strong>{incident.reporterCount}</strong><span>ciudadanos</span></div>
      </div>
      <PriorityMeter priority={incident.priority} compact />
      <Link to={`/incidentes/${incident.id}`} className="button button--primary button--block">Ver detalle y seguimiento</Link>
    </article>
  );
}

function emptyContent({ status, category, setStatus, setCategory, categoryLabel }) {
  if (category) {
    return {
      icon: SearchX,
      title: `No hay daños de tipo «${categoryLabel}» en esta zona`,
      text: 'Prueba con otro tipo de daño o mueve el mapa.',
      action: <button type="button" className="button button--secondary button--small" onClick={() => setCategory('')}>Ver todos los tipos</button>,
    };
  }
  if (status && status !== 'OPEN') {
    const label = STATUS_FILTERS.find((option) => option.value === status)?.label.toLowerCase();
    return {
      icon: SearchX,
      title: `No hay incidentes ${label} en esta zona`,
      text: 'Cambia el filtro de estado o mueve el mapa.',
      action: <button type="button" className="button button--secondary button--small" onClick={() => setStatus('OPEN')}>Ver abiertos</button>,
    };
  }
  return {
    icon: MapPinPlus,
    tone: 'accent',
    title: 'Aún no hay daños reportados aquí',
    text: '¿Viste un bache o una vía dañada? Repórtalo con una foto: así la alcaldía sabe dónde actuar.',
    action: <Link to="/reportar" className="button button--accent button--small"><Plus size={16} aria-hidden="true" /> Hacer el primer reporte</Link>,
    secondaryAction: status === 'OPEN' && (
      <button type="button" className="button button--ghost button--small" onClick={() => setStatus('')}>Ver todos los estados</button>
    ),
    onMap: true,
  };
}

export default function MapPage() {
  useDocumentTitle('Mapa de daños viales');
  const { cityCenter, categories } = useCatalog();
  const toast = useToast();
  const geolocation = useGeolocation();
  const mapRef = useRef(null);

  const [bounds, setBounds] = useState(null);
  const [status, setStatus] = useState('OPEN');
  const [category, setCategory] = useState('');
  const [layers, setLayers] = useState({ markers: true, heat: true });
  const [selected, setSelected] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [hideMapHint, setHideMapHint] = useState(false);

  const key = boundsKey(bounds);
  const incidents = useApi(
    (signal) => incidentsApi.list({ bounds, status, category, sort: 'priority', limit: 400 }, { signal }),
    [key, status, category],
    { enabled: Boolean(bounds) },
  );
  const heatmap = useApi((signal) => incidentsApi.heatmap(bounds, { signal }), [key], { enabled: Boolean(bounds) && layers.heat });

  const items = useMemo(() => incidents.data?.items ?? [], [incidents.data]);
  const heatPoints = useMemo(() => heatmap.data?.points ?? [], [heatmap.data]);
  const counts = useMemo(() => items.reduce((acc, item) => {
    acc[item.priority?.level ?? 'NONE'] = (acc[item.priority?.level ?? 'NONE'] ?? 0) + 1;
    return acc;
  }, {}), [items]);
  const totalReports = items.reduce((sum, item) => sum + item.reportCount, 0);
  const empty = incidents.data && items.length === 0
    ? emptyContent({ status, category, setStatus, setCategory, categoryLabel: categories.find((item) => item.code === category)?.label })
    : null;

  const select = useCallback((incident, { fly = false } = {}) => {
    setSelected(incident);
    setSheetOpen(true);
    if (fly) mapRef.current?.flyTo(incident.location, 17);
  }, []);

  const locateMe = async () => {
    const position = await geolocation.locate();
    if (position) mapRef.current?.flyTo(position, 16);
    else toast.error('No pudimos obtener tu ubicación. Revisa el permiso del navegador.');
  };

  useEffect(() => {
    let active = true;
    geolocation.locate().then((position) => {
      if (active && position) mapRef.current?.setView(position, 16);
    });
    return () => { active = false; };
  }, []);

  const toggleLayer =(layer) => setLayers((current) => ({ ...current, [layer]: !current[layer] }));

  return (
    <div className="map-page">
      <aside className={`map-panel${sheetOpen ? ' is-open' : ''}`} aria-label="Incidentes en el área visible">
        <button type="button" className="map-panel__handle" onClick={() => setSheetOpen((open) => !open)} aria-expanded={sheetOpen}>
          <span aria-hidden="true" />
          {plural(items.length, 'incidente')} en esta zona
        </button>

        <div className="map-panel__scroll">
          <section className="map-panel__intro">
            <h1>Daños viales en tu ciudad</h1>
            <p>Los reportes a menos de 30 m se agrupan en un solo incidente: cada reporte suma prioridad.</p>
            <div className="mini-stats">
              <div><strong>{items.length}</strong><span>incidentes</span></div>
              <div><strong>{totalReports}</strong><span>reportes</span></div>
              <div><strong style={{ color: PRIORITY_META.HIGH.color }}>{counts.HIGH ?? 0}</strong><span>prioridad alta</span></div>
            </div>
          </section>

          {selected && <SelectedIncident incident={selected} onClose={() => setSelected(null)} />}

          <section className="map-panel__filters" aria-label="Filtros">
            <div className="segmented" role="group" aria-label="Capas del mapa">
              <button type="button" className={layers.markers ? 'is-active' : ''} aria-pressed={layers.markers} onClick={() => toggleLayer('markers')}>
                <Layers size={16} aria-hidden="true" /> Incidentes
              </button>
              <button type="button" className={layers.heat ? 'is-active' : ''} aria-pressed={layers.heat} onClick={() => toggleLayer('heat')}>
                <Flame size={16} aria-hidden="true" /> Mapa de calor
              </button>
            </div>

            <div className="chips" role="radiogroup" aria-label="Estado">
              {STATUS_FILTERS.map((option) => (
                <button key={option.value} type="button" role="radio" aria-checked={status === option.value}
                  className={`chip${status === option.value ? ' is-active' : ''}`} onClick={() => setStatus(option.value)}>
                  {option.label}
                </button>
              ))}
            </div>

            <label className="field field--inline">
              <span className="field__label">Tipo de daño</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">Todos</option>
                {categories.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
              </select>
            </label>
          </section>

          <section className="map-panel__list" aria-busy={incidents.loading}>
            <h2 className="section-title">Orden de atención sugerido</h2>
            {incidents.error && <ErrorState error={incidents.error} onRetry={incidents.reload} />}
            {!incidents.error && !incidents.data && <Skeleton lines={4} />}
            {empty && (
              <EmptyState icon={empty.icon} tone={empty.tone} variant="compact" title={empty.title}
                action={empty.action} secondaryAction={empty.secondaryAction}>
                {empty.text}
              </EmptyState>
            )}
            <div className="incident-list">
              {items.slice(0, 40).map((incident, index) => (
                <IncidentListItem key={incident.id} incident={incident} rank={status === 'OPEN' ? index + 1 : null}
                  active={selected?.id === incident.id} onClick={(item) => select(item, { fly: true })} />
              ))}
            </div>
            {items.length > 40 && <p className="muted small center">Acerca el mapa para ver los {items.length - 40} restantes.</p>}
          </section>
        </div>
      </aside>

      <div className="map-stage">
        <IncidentMap
          ref={mapRef}
          center={geolocation.position ?? cityCenter}
          incidents={items}
          heatPoints={heatPoints}
          heatGradient={heatmap.data?.gradient}
          showMarkers={layers.markers}
          showHeat={layers.heat}
          selectedId={selected?.id}
          onSelect={select}
          onBoundsChange={setBounds}
          userPosition={geolocation.position}
        />

        {incidents.loading && <div className="map-loading" role="status"><span />Actualizando…</div>}

        {empty?.onMap && !hideMapHint && !incidents.loading && (
          <div className="map-empty" role="status">
            <span className="map-empty__icon"><MapPin size={22} aria-hidden="true" /></span>
            <div className="map-empty__body">
              <p className="map-empty__title">Todavía no hay reportes en esta zona</p>
              <p>Sé el primero en reportar un daño cerca de ti.</p>
              <Link to="/reportar" className="button button--accent button--small"><Plus size={16} aria-hidden="true" /> Reportar daño</Link>
            </div>
            <button type="button" className="icon-button icon-button--sm" onClick={() => setHideMapHint(true)} aria-label="Ocultar aviso">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="map-legend" aria-label="Leyenda">
          <p>Prioridad</p>
          {['HIGH', 'MEDIUM', 'LOW'].map((level) => (
            <span key={level}><i style={{ background: PRIORITY_META[level].color }} />{PRIORITY_META[level].label}</span>
          ))}
          <span><i style={{ background: '#16a34a' }} />Resuelto</span>
          {layers.heat && <div className="map-legend__heat" title="Intensidad del mapa de calor" />}
          <span className="map-legend__note"><Users size={12} aria-hidden="true" /> número = reportes</span>
        </div>

        <div className="map-fabs">
          <button type="button" className="fab fab--light" onClick={locateMe} aria-label="Ir a mi ubicación" disabled={geolocation.status === 'locating'}>
            <LocateFixed size={20} className={geolocation.status === 'locating' ? 'pulse' : ''} />
          </button>
          <Link to="/reportar" className="fab fab--accent fab--wide"><Plus size={20} aria-hidden="true" /> Reportar daño</Link>
        </div>
      </div>
    </div>
  );
}
