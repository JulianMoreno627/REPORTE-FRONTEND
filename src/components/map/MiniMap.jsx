import { useEffect, useRef } from 'react';
import L, { TILE_OPTIONS, TILE_URL } from '../../lib/leafletPlugins.js';

export default function MiniMap({ location, reports = [], radiusMeters = 30, level = 'NONE' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const map = L.map(containerRef.current, { scrollWheelZoom: false, zoomControl: true }).setView([location.lat, location.lng], 18);
    L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(map);
    L.circle([location.lat, location.lng], {
      radius: radiusMeters, color: '#f59e0b', weight: 2, fillOpacity: 0.1, dashArray: '6 6', interactive: false,
    }).addTo(map);
    reports.forEach((report) => {
      L.circleMarker([report.location.lat, report.location.lng], {
        radius: 5, color: '#fff', weight: 2, fillColor: '#334155', fillOpacity: 0.9,
      }).bindTooltip(`Reporte: ${report.categoryLabel}`).addTo(map);
    });
    L.marker([location.lat, location.lng], {
      icon: L.divIcon({ className: '', html: `<div class="map-pin map-pin--${level}"><span>${reports.length || ''}</span></div>`, iconSize: [34, 42], iconAnchor: [17, 40] }),
      interactive: false,
    }).addTo(map);
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      map.remove();
    };
  }, [location.lat, location.lng, reports, radiusMeters, level]);

  return <div ref={containerRef} className="map map--mini" aria-label="Ubicación del incidente" />;
}
