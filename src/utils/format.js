const dateFormatter = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const relativeFormatter = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

export const formatDate = (value) => dateFormatter.format(new Date(value));
export const formatDateTime = (value) => dateTimeFormatter.format(new Date(value));

const UNITS = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

export function timeAgo(value, now = Date.now()) {
  const seconds = Math.round((new Date(value).getTime() - now) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relativeFormatter.format(Math.round(seconds / size), unit);
  }
  return 'ahora';
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const formatMeters = (meters) => (meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`);

export const formatCoords = ({ lat, lng }) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

export const percent = (value) => `${Math.round(value * 100)} %`;

export const plural = (count, singular, pluralForm = `${singular}s`) => `${count} ${count === 1 ? singular : pluralForm}`;
