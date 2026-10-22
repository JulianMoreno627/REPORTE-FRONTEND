import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { catalogApi } from '../api/endpoints.js';
import { DEFAULT_CENTER } from '../config.js';
import { CATEGORY_META, ROAD_TYPE_META, STATUS_META } from '../utils/domain.js';

const CatalogContext = createContext(null);

const FALLBACK = {
  categories: Object.entries(CATEGORY_META).map(([code, { label }]) => ({ code, label })),
  roadTypes: Object.entries(ROAD_TYPE_META).map(([code, { label }]) => ({ code, label })),
  statuses: Object.entries(STATUS_META).map(([code, { label }]) => ({ code, label })),
  clusterRadiusMeters: 30,
  maxPhotoBytes: 2 * 1024 * 1024,
  cityCenter: DEFAULT_CENTER,
};

export function CatalogProvider({ children }) {
  const [catalog, setCatalog] = useState(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    catalogApi.get({ signal: controller.signal })
      .then((data) => setCatalog({ ...FALLBACK, ...data }))
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoaded(true);
      });
    return () => controller.abort();
  }, []);

  const value = useMemo(() => ({
    ...catalog,
    loaded,
    labelOf: (list, code) => catalog[list]?.find((item) => item.code === code)?.label ?? code,
  }), [catalog, loaded]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export const useCatalog = () => useContext(CatalogContext);
