import { api } from './client.js';

export const catalogApi = {
  get: (options) => api.get('/catalog', options),
};

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  me: (options) => api.get('/auth/me', options),
};

export const reportsApi = {
  create: (report) => api.post('/reports', report),
  createBatch: (reports) => api.post('/reports/batch', { reports }),
  attachPhoto: (reportId, blob) => api.post(`/reports/${reportId}/photo`, blob),
  mine: (options) => api.get('/reports/mine', options),
};

const bboxParam = (bounds) => (bounds
  ? [bounds.minLat, bounds.minLng, bounds.maxLat, bounds.maxLng].map((value) => value.toFixed(5)).join(',')
  : undefined);

export const incidentsApi = {
  list: ({ bounds, ...filters } = {}, options) => api.get('/incidents', { ...options, query: { ...filters, bbox: bboxParam(bounds) } }),
  priorityQueue: (limit = 10, options) => api.get('/incidents/priority-queue', { ...options, query: { limit } }),
  detail: (id, options) => api.get(`/incidents/${id}`, options),
  changeStatus: (id, status, note) => api.patch(`/incidents/${id}/status`, { status, note }),
  heatmap: (bounds, options) => api.get('/heatmap', { ...options, query: { bbox: bboxParam(bounds) } }),
};

export const notificationsApi = {
  list: (options) => api.get('/notifications', options),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  streamUrl: () => api.url('/notifications/stream', { token: api.token }),
};

export const adminApi = {
  summary: (options) => api.get('/admin/summary', options),
  consolidate: () => api.post('/admin/consolidate'),
};

export const metricsApi = {
  webVitalsUrl: () => api.url('/metrics/web-vitals'),
};
