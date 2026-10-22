import { useCallback, useState } from 'react';

const MESSAGES = {
  1: 'Negaste el permiso de ubicación. Marca el punto del daño en el mapa.',
  2: 'No pudimos obtener tu ubicación. Marca el punto del daño en el mapa.',
  3: 'La ubicación tardó demasiado. Intenta de nuevo o marca el punto en el mapa.',
};

export function useGeolocation() {
  const [state, setState] = useState({ status: 'idle', position: null, accuracy: null, message: null });

  const locate = useCallback(() => new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      setState({ status: 'unsupported', position: null, accuracy: null, message: 'Tu navegador no permite obtener la ubicación. Marca el punto en el mapa.' });
      resolve(null);
      return;
    }
    setState((previous) => ({ ...previous, status: 'locating', message: null }));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = { lat: coords.latitude, lng: coords.longitude };
        setState({ status: 'success', position, accuracy: Math.round(coords.accuracy), message: null });
        resolve(position);
      },
      (error) => {
        setState({ status: error.code === 1 ? 'denied' : 'error', position: null, accuracy: null, message: MESSAGES[error.code] ?? MESSAGES[2] });
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }), []);

  return { ...state, locate };
}
