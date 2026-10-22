import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Vías Seguras` : 'Vías Seguras · Reporte ciudadano de daños viales';
  }, [title]);
}
