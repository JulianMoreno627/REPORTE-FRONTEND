import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crosshair, Image, Info, LocateFixed, Merge, Send, Sparkles, TriangleAlert } from 'lucide-react';
import LocationPicker from '../components/map/LocationPicker.jsx';
import CategoryPicker from '../components/report/CategoryPicker.jsx';
import PhotoInput from '../components/report/PhotoInput.jsx';
import AiSuggestion from '../components/report/AiSuggestion.jsx';
import ReportResult from '../components/report/ReportResult.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Spinner } from '../components/ui/Feedback.jsx';
import { incidentsApi, reportsApi } from '../api/endpoints.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { enqueueReport } from '../services/offlineQueue.js';
import { boundsAround, nearestIncident } from '../utils/geo.js';
import { ROAD_TYPE_META } from '../utils/domain.js';
import { formatCoords, formatMeters } from '../utils/format.js';
import { uuid } from '../utils/id.js';

const MAX_DESCRIPTION = 500;
const AI_IDLE = { status: 'idle', enabled: false, ai: null, applied: false };
const NEARBY_SEARCH_METERS = 150;

const SOURCE_LABEL = {
  gps: 'Ubicación de tu celular',
  photo: 'Ubicación de la foto',
  map: 'Punto marcado en el mapa',
};

function useNearbyIncidents(position, online) {
  const [nearby, setNearby] = useState([]);
  useEffect(() => {
    if (!position || !online) {
      setNearby([]);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      incidentsApi.list({ bounds: boundsAround(position, NEARBY_SEARCH_METERS), status: 'OPEN', limit: 50 }, { signal: controller.signal })
        .then(({ items }) => setNearby(items))
        .catch(() => {});
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [position, online]);
  return nearby;
}

export default function ReportPage() {
  useDocumentTitle('Reportar un daño');
  const { categories, roadTypes, cityCenter, clusterRadiusMeters } = useCatalog();
  const toast = useToast();
  const online = useOnlineStatus();
  const geolocation = useGeolocation();

  const [position, setPosition] = useState(null);
  const [source, setSource] = useState(null);
  const [category, setCategory] = useState('');
  const [roadType, setRoadType] = useState('SECONDARY');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showErrors, setShowErrors] = useState(false);
  const [result, setResult] = useState(null);
  const [aiState, setAiState] = useState(AI_IDLE);
  const categoryPicked = useRef(false);
  const aiRequest = useRef(0);

  const nearby =useNearbyIncidents(position, online);
  const nearest = useMemo(() => (position ? nearestIncident(position, nearby) : null), [position, nearby]);
  const willGroup = nearest && nearest.distance <= clusterRadiusMeters;

  const useMyLocation = async () => {
    const found = await geolocation.locate();
    if (found) {
      setPosition(found);
      setSource('gps');
    }
  };

  useEffect(() => {
    let active = true;
    geolocation.locate().then((found) => {
      if (!active || !found) return;
      setPosition((current) => {
        if (current) return current;
        setSource('gps');
        return found;
      });
    });
    return () => { active = false; };
  }, []);

  const choosePoint = (point, origin) => {
    setPosition(point);
    setSource(origin);
  };

  const pickCategory = (code) => {
    categoryPicked.current = true;
    setCategory(code);
  };

  const analyzePhoto = async (blob) => {
    const request = ++aiRequest.current;
    setAiState({ ...AI_IDLE, status: 'analyzing', enabled: true });
    let next;
    try {
      const { enabled, ai } = await reportsApi.analyzePhoto(blob);
      const applied = Boolean(ai?.isRoad && ai.category && !categoryPicked.current);
      next = { status: 'done', enabled, ai, applied };
    } catch {
      next = { status: 'done', enabled: true, ai: null, applied: false };
    }
    if (request !== aiRequest.current) return;
    if (next.applied) setCategory(next.ai.category);
    setAiState(next);
  };

  const handlePhoto = (compressed) => {
    setPhoto(compressed);
    if (compressed?.gps && !position) choosePoint(compressed.gps, 'photo');
    if (compressed && online) analyzePhoto(compressed.blob);
    else {
      aiRequest.current++;
      setAiState(AI_IDLE);
    }
  };

  const reset = () => {
    setResult(null);
    setCategory('');
    categoryPicked.current = false;
    aiRequest.current++;
    setAiState(AI_IDLE);
    setDescription('');
    setPhoto(null);
    setError(null);
    setShowErrors(false);
    window.scrollTo({ top: 0 });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    if (!position || !category) {
      setShowErrors(true);
      toast.error(!position ? 'Indica dónde está el daño.' : 'Elige el tipo de daño.');
      return;
    }

    const payload = {
      clientRequestId: uuid(),
      lat: Number(position.lat.toFixed(7)),
      lng: Number(position.lng.toFixed(7)),
      category,
      roadType,
      description: description.trim() || undefined,
    };

    setSubmitting(true);
    try {
      if (!navigator.onLine) {
        await enqueueReport(payload, photo?.blob);
        setResult({ queued: true });
        return;
      }
      const created = await reportsApi.create(payload);
      let analysis = null;
      let photoFailed = null;
      if (photo) {
        try {
          ({ analysis } = await reportsApi.attachPhoto(created.report.id, photo.blob));
        } catch (photoError) {
          photoFailed = photoError.message;
        }
      }
      setResult({ ...created, analysis, photoFailed });
      window.scrollTo({ top: 0 });
    } catch (requestError) {
      if (requestError.isNetworkError) {
        await enqueueReport(payload, photo?.blob);
        setResult({ queued: true });
      } else {
        setError(requestError);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return <div className="container container--narrow"><ReportResult result={result} onReset={reset} /></div>;
  }

  const descriptionLeft = MAX_DESCRIPTION - description.length;

  return (
    <div className="container container--narrow">
      <PageHeader
        eyebrow="Nuevo reporte"
        title="Reporta un daño en la vía"
        description="Toma menos de un minuto. Si alguien ya reportó el mismo daño, tu reporte se suma y aumenta su prioridad."
      />

      <form className="report-form" onSubmit={submit} noValidate>
        <section className="form-section">
          <header className="form-section__head">
            <span className="form-section__step">1</span>
            <div>
              <h2>¿Dónde está el daño?</h2>
              <p>Usamos tu ubicación; puedes tocar el mapa o arrastrar el pin para ajustarla.</p>
            </div>
          </header>

          <div className="location-bar">
            <button type="button" className="button button--secondary" onClick={useMyLocation} disabled={geolocation.status === 'locating'}>
              {geolocation.status === 'locating' ? <Spinner size={16} /> : <LocateFixed size={18} aria-hidden="true" />}
              {geolocation.status === 'locating' ? 'Buscando tu ubicación…' : 'Usar mi ubicación'}
            </button>
            {photo?.gps && source !== 'photo' && (
              <button type="button" className="button button--ghost" onClick={() => choosePoint(photo.gps, 'photo')}>
                <Image size={18} aria-hidden="true" /> Usar ubicación de la foto
              </button>
            )}
          </div>

          {geolocation.message && (
            <p className="notice notice--warning" role="alert"><TriangleAlert size={16} aria-hidden="true" /> {geolocation.message}</p>
          )}

          <LocationPicker
            center={cityCenter}
            position={position}
            onChange={choosePoint}
            radiusMeters={clusterRadiusMeters}
            nearby={nearby}
          />

          {position ? (
            <p className="location-summary">
              <Crosshair size={16} aria-hidden="true" />
              <span><strong>{SOURCE_LABEL[source]}</strong> · {formatCoords(position)}
                {source === 'gps' && geolocation.accuracy && <span className="muted"> (precisión ±{formatMeters(geolocation.accuracy)})</span>}
              </span>
            </p>
          ) : (
            <p className={`location-summary${showErrors ? ' is-invalid' : ''}`}>
              <Crosshair size={16} aria-hidden="true" /> Toca el mapa para marcar el punto exacto del daño.
            </p>
          )}

          {willGroup && (
            <div className="notice notice--info">
              <Merge size={18} aria-hidden="true" />
              <p>
                Ya hay un incidente de <strong>{nearest.incident.categoryLabel.toLowerCase()}</strong> a {formatMeters(nearest.distance)} con{' '}
                {nearest.incident.reportCount} {nearest.incident.reportCount === 1 ? 'reporte' : 'reportes'}.
                Tu reporte se sumará a ese incidente y subirá su prioridad.{' '}
                <Link to={`/incidentes/${nearest.incident.id}`} target="_blank">Ver incidente</Link>
              </p>
            </div>
          )}
        </section>

        <section className="form-section">
          <header className="form-section__head">
            <span className="form-section__step">2</span>
            <div>
              <h2>¿Qué tipo de daño es?</h2>
              {showErrors && !category && <p className="field__error">Elige una opción.</p>}
              {aiState.applied && category === aiState.ai?.category && (
                <p className="ai-picked"><Sparkles size={14} aria-hidden="true" /> Seleccionado por IA a partir de tu foto</p>
              )}
            </div>
          </header>
          <CategoryPicker categories={categories} value={category} onChange={pickCategory} />

          <fieldset className="field">
            <legend className="field__label">Tipo de vía</legend>
            <div className="segmented segmented--full">
              {roadTypes.map(({ code, label }) => (
                <label key={code} className={roadType === code ? 'is-active' : ''}>
                  <input type="radio" name="roadType" value={code} checked={roadType === code} onChange={() => setRoadType(code)} className="visually-hidden" />
                  <span>{ROAD_TYPE_META[code]?.label ?? label}</span>
                  <small>{ROAD_TYPE_META[code]?.hint}</small>
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="form-section">
          <header className="form-section__head">
            <span className="form-section__step">3</span>
            <div>
              <h2>Foto y detalles <small className="muted">(recomendado)</small></h2>
              <p>La foto se comprime en tu celular antes de enviarse para no gastar tus datos.</p>
            </div>
          </header>
          <PhotoInput value={photo} onChange={handlePhoto} onError={(message) => toast.error(message)} />
          <AiSuggestion state={aiState} category={category} onApply={pickCategory} />

          <label className="field">
            <span className="field__label">Descripción <small>(opcional)</small></span>
            <textarea
              rows={3}
              maxLength={MAX_DESCRIPTION}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ej.: Hueco grande frente a la panadería, ocupa el carril derecho."
            />
            <span className={`field__hint${descriptionLeft < 50 ? ' is-warning' : ''}`}>{descriptionLeft} caracteres disponibles</span>
          </label>
        </section>

        {error && (
          <div className="notice notice--error" role="alert">
            <TriangleAlert size={18} aria-hidden="true" />
            <p>
              {error.message}
              {error.code === 'DUPLICATE_REPORT' && <> <Link to="/mis-reportes">Ir a mis reportes</Link></>}
            </p>
          </div>
        )}

        <div className="form-footer">
          {!online && (
            <p className="muted small"><Info size={14} aria-hidden="true" /> Sin conexión: el reporte se guardará y se enviará después.</p>
          )}
          <button type="submit" className="button button--accent button--large button--block" disabled={submitting}>
            {submitting ? <Spinner size={18} /> : <Send size={18} aria-hidden="true" />}
            {submitting ? 'Enviando…' : online ? 'Enviar reporte' : 'Guardar reporte'}
          </button>
        </div>
      </form>
    </div>
  );
}
