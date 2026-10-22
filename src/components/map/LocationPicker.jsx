import { useEffect, useRef } from 'react';
import L, { TILE_OPTIONS, TILE_URL } from '../../lib/leafletPlugins.js';

const pinIcon = L.divIcon({
  className: '',
  html: '<div class="picker-pin"><span></span></div>',
  iconSize: [36, 46],
  iconAnchor: [18, 44],
});

const nearbyIcon = (incident) => L.divIcon({
  className: '',
  html: `<div class="map-pin map-pin--ghost"><span>${incident.reportCount}</span></div>`,
  iconSize: [28, 34],
  iconAnchor: [14, 32],
});

export default function LocationPicker({ center, position, onChange, radiusMeters = 30, nearby = [], zoom = 17 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const nearbyLayerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const start = position ?? center;
    const map = L.map(containerRef.current, { zoomControl: true }).setView([start.lat, start.lng], position ? zoom : 14);
    L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(map);
    nearbyLayerRef.current = L.layerGroup().addTo(map);
    map.on('click', (event) => onChangeRef.current({ lat: event.latlng.lat, lng: event.latlng.lng }, 'map'));
    mapRef.current = map;
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!position) {
      markerRef.current?.remove();
      circleRef.current?.remove();
      markerRef.current = null;
      circleRef.current = null;
      return;
    }
    const latLng = [position.lat, position.lng];
    if (!markerRef.current) {
      markerRef.current = L.marker(latLng, { icon: pinIcon, draggable: true, autoPan: true, zIndexOffset: 1000 }).addTo(map);
      markerRef.current.on('dragend', () => {
        const { lat, lng } = markerRef.current.getLatLng();
        onChangeRef.current({ lat, lng }, 'map');
      });
      circleRef.current = L.circle(latLng, {
        radius: radiusMeters, color: '#f59e0b', weight: 2, fillOpacity: 0.12, dashArray: '6 6', interactive: false,
      }).addTo(map);
    } else {
      markerRef.current.setLatLng(latLng);
      circleRef.current.setLatLng(latLng);
    }
    if (!map.getBounds().pad(-0.2).contains(latLng)) map.setView(latLng, Math.max(map.getZoom(), zoom));
  }, [position, radiusMeters, zoom]);

  useEffect(() => {
    const layer = nearbyLayerRef.current;
    layer.clearLayers();
    nearby.forEach((incident) => {
      L.marker([incident.location.lat, incident.location.lng], { icon: nearbyIcon(incident), interactive: false }).addTo(layer);
    });
  }, [nearby]);

  return <div ref={containerRef} className="map map--picker" aria-label="Mapa para marcar la ubicación del daño" />;
}
