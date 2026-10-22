import L from './leaflet.js';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.heat';

export const TILE_URL = import.meta.env.VITE_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_OPTIONS = {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

export const toBounds = (leafletBounds) => ({
  minLat: leafletBounds.getSouth(),
  minLng: leafletBounds.getWest(),
  maxLat: leafletBounds.getNorth(),
  maxLng: leafletBounds.getEast(),
});

export default L;
