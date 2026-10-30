import {
  ArrowDownToDot, CircleDashed, CircleDot, CircleHelp, Signpost, Zap,
} from 'lucide-react';

export const STATUS_FLOW = ['REPORTED', 'IN_REVIEW', 'IN_REPAIR', 'RESOLVED'];

export const STATUS_META = {
  REPORTED: { label: 'Reportado', tone: 'slate' },
  IN_REVIEW: { label: 'En revisión', tone: 'amber' },
  IN_REPAIR: { label: 'En reparación', tone: 'blue' },
  RESOLVED: { label: 'Resuelto', tone: 'green' },
  REJECTED: { label: 'Descartado', tone: 'gray' },
};

export const PRIORITY_META = {
  HIGH: { label: 'Alta', tone: 'red', color: '#dc2626' },
  MEDIUM: { label: 'Media', tone: 'orange', color: '#ea580c' },
  LOW: { label: 'Baja', tone: 'yellow', color: '#ca8a04' },
  NONE: { label: 'Cerrado', tone: 'gray', color: '#64748b' },
};

export const CATEGORY_META = {
  POTHOLE: { label: 'Bache', icon: CircleDot },
  SINKHOLE: { label: 'Hundimiento', icon: ArrowDownToDot },
  MANHOLE: { label: 'Alcantarilla', icon: CircleDashed },
  SIGNAGE: { label: 'Señalización', icon: Signpost },
  CRACK: { label: 'Grieta', icon: Zap },
  OTHER: { label: 'Otro', icon: CircleHelp },
};

export const ROAD_TYPE_META = {
  PRIMARY: { label: 'Vía principal', hint: 'Avenidas y troncales' },
  SECONDARY: { label: 'Vía secundaria', hint: 'Conectan barrios' },
  RESIDENTIAL: { label: 'Vía local', hint: 'Calles de barrio' },
};

export const PRIORITY_FACTORS = {
  reports: 'Cantidad de reportes',
  age: 'Antigüedad',
  road: 'Tipo de vía',
  severity: 'Gravedad del daño',
};

export const PHOTO_CHECK_META = {
  VERIFIED: { label: 'Ubicación verificada', tone: 'green', hint: 'El GPS de la foto coincide con el punto reportado' },
  MISMATCH: { label: 'Ubicación no coincide', tone: 'red', hint: 'El GPS de la foto está lejos del punto reportado' },
  NO_GPS: { label: 'Foto sin GPS', tone: 'gray', hint: 'La foto no tiene metadatos de ubicación' },
  NONE: { label: 'Sin foto', tone: 'gray', hint: '' },
};

export const AI_RISK_META = {
  HIGH: { label: 'Riesgo alto', tone: 'red' },
  MEDIUM: { label: 'Riesgo medio', tone: 'orange' },
  LOW: { label: 'Riesgo bajo', tone: 'yellow' },
};

export const priorityColor = (incident) => PRIORITY_META[incident.priority?.level ?? 'NONE']?.color ?? '#64748b';
