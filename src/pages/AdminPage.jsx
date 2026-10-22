import { useCallback, useMemo, useRef, useState } from 'react';
import { Clock3, Flame, Inbox, MapPinned, Merge, PartyPopper, RefreshCw, SearchX, Siren } from 'lucide-react';
import BarList from '../components/admin/BarList.jsx';
import ConsolidationCard from '../components/admin/ConsolidationCard.jsx';
import IncidentDrawer from '../components/admin/IncidentDrawer.jsx';
import IncidentTable from '../components/admin/IncidentTable.jsx';
import IncidentMap from '../components/map/IncidentMap.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { EmptyState, ErrorState, Skeleton, Spinner } from '../components/ui/Feedback.jsx';
import { adminApi, incidentsApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { PRIORITY_META } from '../utils/domain.js';
import { timeAgo } from '../utils/format.js';

const SORTS = [
  { value: 'priority', label: 'Mayor prioridad' },
  { value: 'reports', label: 'Más reportes' },
  { value: 'oldest', label: 'Más antiguos' },
  { value: 'recent', label: 'Actualizados recientemente' },
];

const INITIAL_FILTERS = { status: 'OPEN', category: '', roadType: '', priority: '', sort: 'priority' };
const BAR_COLOR = '#334155';

function Kpi({ icon: Icon, label, value, hint, tone = 'slate' }) {
  return (
    <div className={`kpi kpi--${tone}`}>
      <span className="kpi__icon"><Icon size={20} aria-hidden="true" /></span>
      <div>
        <p className="kpi__label">{label}</p>
        <p className="kpi__value">{value}</p>
        {hint && <p className="kpi__hint">{hint}</p>}
      </div>
    </div>
  );
}

const isInitial = (filters, zoneOnly) => !zoneOnly && Object.keys(INITIAL_FILTERS).every((key) => filters[key] === INITIAL_FILTERS[key]);

function TableEmpty({ totals, filtersAreInitial, onClear }) {
  if (totals?.incidents === 0) {
    return (
      <EmptyState icon={Inbox} title="Aún no hay incidentes">
        Cuando un ciudadano reporte un daño aparecerá aquí, ordenado por prioridad.
      </EmptyState>
    );
  }
  if (filtersAreInitial && totals?.open === 0) {
    return (
      <EmptyState icon={PartyPopper} tone="accent" title="Todo al día">
        No hay incidentes abiertos. Elige «Todos» en Estado para ver el historial.
      </EmptyState>
    );
  }
  return (
    <EmptyState icon={SearchX} title="No hay incidentes con estos filtros"
      action={<button type="button" className="button button--secondary button--small" onClick={onClear}>Limpiar filtros</button>}>
      Prueba con otra zona o con otros criterios.
    </EmptyState>
  );
}

export default function AdminPage() {
  useDocumentTitle('Panel de la alcaldía');
  const { user } = useAuth();
  const { categories, roadTypes, statuses, cityCenter } = useCatalog();
  const mapRef = useRef(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [zoneOnly, setZoneOnly] = useState(false);
  const [bounds, setBounds] = useState(null);
  const [selected, setSelected] = useState(null);

  const summary = useApi((signal) => adminApi.summary({ signal }), []);
  const zone = zoneOnly ? bounds : null;
  const zoneKey = zone ? Object.values(zone).map((v) => v.toFixed(4)).join(',') : '';
  const incidents = useApi(
    (signal) => incidentsApi.list({ ...filters, bounds: zone, limit: 500 }, { signal }),
    [filters.status, filters.category, filters.roadType, filters.priority, filters.sort, zoneKey],
  );

  const items = useMemo(() => incidents.data?.items ?? [], [incidents.data]);
  const setFilter = (field) => (event) => setFilters((current) => ({ ...current, [field]: event.target.value }));

  const refreshAll = useCallback(() => {
    summary.reload();
    incidents.reload();
  }, [summary, incidents]);

  const handleChanged = (updated) => {
    setSelected(updated);
    incidents.setData((data) => data && { ...data, items: data.items.map((item) => (item.id === updated.id ? updated : item)) });
    summary.reload();
  };

  const select = (incident) => {
    setSelected(incident);
    mapRef.current?.flyTo(incident.location, 17);
  };

  const data = summary.data;
  const totals = data?.totals;
  const openByPriority = data?.byPriority ?? {};
  const noData = totals?.incidents === 0;
  const clearFilters = () => { setFilters(INITIAL_FILTERS); setZoneOnly(false); };

  return (
    <div className="container container--wide">
      <PageHeader
        eyebrow={user.agency ?? 'Alcaldía'}
        title="Panel de gestión de daños viales"
        description="Decide qué reparar primero con base en la cantidad de reportes, su antigüedad, el tipo de vía y la gravedad."
        actions={(
          <button type="button" className="button button--ghost" onClick={refreshAll} disabled={summary.loading || incidents.loading}>
            {summary.loading || incidents.loading ? <Spinner size={16} /> : <RefreshCw size={16} aria-hidden="true" />} Actualizar
          </button>
        )}
      />

      {summary.error && <ErrorState error={summary.error} onRetry={summary.reload} />}
      {!data && !summary.error && <Skeleton lines={3} />}

      {data && noData && (
        <EmptyState
          icon={Siren}
          tone="accent"
          variant="card"
          level={2}
          title="Todavía no llegan reportes ciudadanos"
          extra={(
            <ol className="empty-steps" aria-label="Qué verás en este panel">
              <li><span><strong>Indicadores</strong> de incidentes abiertos, prioridad y tiempos.</span></li>
              <li><span><strong>Orden de atención</strong> sugerido según reportes, antigüedad y tipo de vía.</span></li>
              <li><span><strong>Gestión</strong> del estado de cada daño, con nota para el ciudadano.</span></li>
            </ol>
          )}
        >
          En cuanto alguien reporte un bache o daño vial, este panel se llenará automáticamente. Usa «Actualizar» para revisar de nuevo.
        </EmptyState>
      )}

      {data && !noData && (
        <>
          <section className="kpi-grid" aria-label="Indicadores">
            <Kpi icon={Siren} label="Incidentes abiertos" value={totals.open} hint={`de ${totals.incidents} en total`} tone="amber" />
            <Kpi icon={Flame} label="Prioridad alta" value={openByPriority.HIGH ?? 0} hint={`${openByPriority.MEDIUM ?? 0} media · ${openByPriority.LOW ?? 0} baja`} tone="red" />
            <Kpi icon={Merge} label="Reportes recibidos" value={totals.reports} hint={`${totals.duplicatesAvoided} duplicados agrupados`} tone="blue" />
            <Kpi icon={Clock3} label="Tiempo medio de solución" value={totals.avgResolutionDays === null ? '—' : `${totals.avgResolutionDays} d`} hint="desde el primer reporte" tone="green" />
          </section>

          <section className="dashboard-grid">
            <div className="card">
              <h2 className="section-title">Incidentes por estado</h2>
              <BarList items={data.byStatus} colorOf={() => BAR_COLOR} />
            </div>
            <div className="card">
              <h2 className="section-title">Incidentes por tipo de daño</h2>
              <BarList items={data.byCategory} colorOf={() => BAR_COLOR} />
            </div>
            <ConsolidationCard status={data.consolidation} onDone={refreshAll} />
          </section>
        </>
      )}

      <section className="card manage" aria-label="Gestión de incidentes">
        <div className="card__head">
          <h2 className="section-title">Gestión de incidentes</h2>
          <p className="muted small">{incidents.data ? `${items.length} resultado(s)` : ''}{data && ` · datos ${timeAgo(data.generatedAt)}`}</p>
        </div>

        <div className="filter-bar">
          <label className="field">
            <span className="field__label">Estado</span>
            <select value={filters.status} onChange={setFilter('status')}>
              <option value="OPEN">Abiertos</option>
              <option value="">Todos</option>
              {statuses.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Tipo de daño</span>
            <select value={filters.category} onChange={setFilter('category')}>
              <option value="">Todos</option>
              {categories.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Tipo de vía</span>
            <select value={filters.roadType} onChange={setFilter('roadType')}>
              <option value="">Todas</option>
              {roadTypes.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Prioridad</span>
            <select value={filters.priority} onChange={setFilter('priority')}>
              <option value="">Todas</option>
              {['HIGH', 'MEDIUM', 'LOW'].map((level) => <option key={level} value={level}>{PRIORITY_META[level].label}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Ordenar por</span>
            <select value={filters.sort} onChange={setFilter('sort')}>
              {SORTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="checkbox checkbox--boxed">
            <input type="checkbox" checked={zoneOnly} onChange={(event) => setZoneOnly(event.target.checked)} />
            <span><MapPinned size={16} aria-hidden="true" /> Solo la zona visible en el mapa</span>
          </label>
          <button type="button" className="link-button" onClick={clearFilters}>Limpiar filtros</button>
        </div>

        <div className="manage__grid">
          <div className="manage__map">
            <IncidentMap
              ref={mapRef}
              center={cityCenter}
              zoom={13}
              incidents={items}
              selectedId={selected?.id}
              onSelect={setSelected}
              onBoundsChange={setBounds}
            />
            <p className="muted small">{zoneOnly ? 'Mueve o acerca el mapa para filtrar por zona.' : 'Activa “Solo la zona visible” para filtrar por barrio o sector.'}</p>
          </div>
          <div className="manage__table">
            {incidents.error && <ErrorState error={incidents.error} onRetry={incidents.reload} />}
            {!incidents.data && !incidents.error && <Skeleton lines={6} />}
            {incidents.data && items.length === 0 && (
              <TableEmpty totals={totals} filtersAreInitial={isInitial(filters, zoneOnly)} onClear={clearFilters} />
            )}
            {items.length > 0 && <IncidentTable items={items} selectedId={selected?.id} onSelect={select} />}
          </div>
        </div>
      </section>

      <IncidentDrawer incident={selected} onClose={() => setSelected(null)} onChanged={handleChanged} />
    </div>
  );
}
