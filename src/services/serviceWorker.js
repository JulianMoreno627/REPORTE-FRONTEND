export function registerServiceWorker(onSyncRequested) {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => console.warn('Service Worker no registrado:', error));
  });
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SYNC_REPORTS') onSyncRequested();
  });
}
