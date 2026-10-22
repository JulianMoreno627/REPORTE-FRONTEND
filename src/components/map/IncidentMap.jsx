import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import L, { TILE_OPTIONS, TILE_URL, toBounds } from '../../lib/leafletPlugins.js';

const PRIORITY_RANK = { HIGH: 3, MEDIUM: 2, LOW: 1, NONE: 0 };
const BOUNDS_DEBOUNCE_MS = 350;

function markerIcon(incident, selected) {
  const level = incident.priority?.level ?? 'NONE';
  const resolved = incident.status === 'RESOLVED';
  return L.divIcon({
    className: '',
    html: `<div class="map-pin map-pin--${resolved ? 'RESOLVED' : level}${selected ? ' is-selected' : ''}"><span>${incident.reportCount}</span></div>`,
    iconSize: [34, 42],
    iconAnchor: [17, 40],
  });
}

function clusterIcon(cluster) {
  const markers = cluster.getAllChildMarkers();
  const reports = markers.reduce((sum, marker) => sum + marker.options.incident.reportCount, 0);
  const level = markers.reduce((best, marker) => {
    const current = marker.options.incident.priority?.level ?? 'NONE';
    return PRIORITY_RANK[current] > PRIORITY_RANK[best] ? current : best;
  }, 'NONE');
  const size = reports >= 50 ? 56 : reports >= 15 ? 48 : 40;
  return L.divIcon({
    className: '',
    html: `<div class="map-cluster map-cluster--${level}" style="width:${size}px;height:${size}px"><strong>${reports}</strong><small>${markers.length} inc.</small></div>`,
    iconSize: [size, size],
  });
}

const IncidentMap = forwardRef(function IncidentMap({
  center, zoom = 13, incidents = [], heatPoints = [], heatGradient, showMarkers = true, showHeat = false,
  selectedId = null, onSelect, onBoundsChange, userPosition = null, className = '',
}, ref) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const clusterRef = useRef(null);
  const heatRef = useRef(null);
  const markersRef = useRef(new Map());
  const userMarkerRef = useRef(null);
  const callbacksRef = useRef({ onSelect, onBoundsChange });
  callbacksRef.current = { onSelect, onBoundsChange };

  useImperativeHandle(ref, () => ({
    flyTo: (position, targetZoom = 17) => mapRef.current?.flyTo([position.lat, position.lng], targetZoom, { duration: 0.8 }),
    invalidateSize: () => mapRef.current?.invalidateSize(),
  }), []);

  useEffect(() => {
    const map = L.map(containerRef.current, { zoomControl: false, preferCanvas: true }).setView([center.lat, center.lng], zoom);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(map);

    clusterRef.current = L.markerClusterGroup({
      chunkedLoading: true,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 50,
      iconCreateFunction: clusterIcon,
    });
    heatRef.current = L.heatLayer([], { radius: 30, blur: 24, maxZoom: 16, minOpacity: 0.35 });

    let timer;
    const emitBounds = () => {
      clearTimeout(timer);
      timer = setTimeout(() => callbacksRef.current.onBoundsChange?.(toBounds(map.getBounds())), BOUNDS_DEBOUNCE_MS);
    };
    map.on('moveend', emitBounds);
    mapRef.current = map;
    emitBounds();

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    mapRef.current?.setView([center.lat, center.lng], mapRef.current.getZoom());
  }, [center.lat, center.lng]);

  useEffect(() => {
    const cluster = clusterRef.current;
    cluster.clearLayers();
    markersRef.current.clear();
    const markers = incidents.map((incident) => {
      const marker = L.marker([incident.location.lat, incident.location.lng], {
        icon: markerIcon(incident, incident.id === selectedId),
        incident,
        keyboard: true,
        title: `${incident.categoryLabel}: ${incident.reportCount} reporte(s)`,
        riseOnHover: true,
      });
      marker.on('click', () => callbacksRef.current.onSelect?.(incident));
      markersRef.current.set(incident.id, marker);
      return marker;
    });
    cluster.addLayers(markers);
  }, [incidents]);

  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      marker.setIcon(markerIcon(marker.options.incident, id === selectedId));
      if (id === selectedId) marker.setZIndexOffset(1000);
      else marker.setZIndexOffset(0);
    }
  }, [selectedId, incidents]);

  useEffect(() => {
    const map = mapRef.current;
    if (showMarkers) map.addLayer(clusterRef.current);
    else map.removeLayer(clusterRef.current);
  }, [showMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    const heat = heatRef.current;
    if (heatGradient) heat.setOptions({ gradient: heatGradient });
    heat.setLatLngs(heatPoints);
    if (showHeat && !map.hasLayer(heat)) map.addLayer(heat);
    if (!showHeat && map.hasLayer(heat)) map.removeLayer(heat);
  }, [heatPoints, heatGradient, showHeat]);

  useEffect(() => {
    const map = mapRef.current;
    userMarkerRef.current?.remove();
    userMarkerRef.current = null;
    if (userPosition) {
      userMarkerRef.current = L.marker([userPosition.lat, userPosition.lng], {
        icon: L.divIcon({ className: '', html: '<div class="map-user-dot"></div>', iconSize: [18, 18] }),
        interactive: false,
        zIndexOffset: 2000,
      }).addTo(map);
    }
  }, [userPosition]);

  return <div ref={containerRef} className={`map ${className}`} role="application" aria-label="Mapa de incidentes viales" />;
});

export default IncidentMap;
