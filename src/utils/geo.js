const EARTH_RADIUS_M = 6_371_008.8;
const toRadians = (degrees) => (degrees * Math.PI) / 180;

export function haversineMeters(a, b) {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function boundsAround({ lat, lng }, meters) {
  const dLat = meters / 111_320;
  const dLng = meters / (111_320 * Math.max(Math.cos(toRadians(lat)), 1e-6));
  return { minLat: lat - dLat, minLng: lng - dLng, maxLat: lat + dLat, maxLng: lng + dLng };
}

export function nearestIncident(point, incidents) {
  let best = null;
  for (const incident of incidents) {
    const distance = haversineMeters(point, incident.location);
    if (!best || distance < best.distance) best = { incident, distance };
  }
  return best;
}
