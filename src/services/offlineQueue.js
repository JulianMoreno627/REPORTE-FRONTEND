import { reportsApi } from '../api/endpoints.js';

const DB_NAME = 'vias-seguras';
const STORE = 'pending-reports';

let dbPromise = null;
const listeners = new Set();
let syncing = null;

function openDb() {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'clientRequestId' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function run(mode, action) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = action(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(request?.result);
    tx.onerror = () => reject(tx.error);
  });
}

const notify = async () => {
  const items = await listPending().catch(() => []);
  listeners.forEach((listener) => listener(items));
};

export const listPending = () => run('readonly', (store) => store.getAll());

export async function enqueueReport(payload, photo) {
  const item = { ...payload, photo: photo ?? null, queuedAt: new Date().toISOString() };
  await run('readwrite', (store) => store.put(item));
  navigator.serviceWorker?.ready.then((registration) => registration.sync?.register('sync-reports')).catch(() => {});
  notify();
  return item;
}

export const removePending = async (clientRequestId) => {
  await run('readwrite', (store) => store.delete(clientRequestId));
  notify();
};

export function subscribePending(listener) {
  listeners.add(listener);
  listPending().then(listener).catch(() => listener([]));
  return () => listeners.delete(listener);
}

export function syncPending() {
  syncing ??= (async () => {
    const items = await listPending();
    if (items.length === 0 || !navigator.onLine) return { sent: 0, failed: [] };

    const payloads = items.map(({ photo, queuedAt, ...payload }) => payload);
    const { results } = await reportsApi.createBatch(payloads);
    let sent = 0;
    const failed = [];
    for (const [index, result] of results.entries()) {
      const item = items[index];
      if (result.ok) {
        if (item.photo) await reportsApi.attachPhoto(result.report.id, item.photo).catch(() => {});
        await removePending(item.clientRequestId);
        sent++;
      } else {
        failed.push({ item, error: result.error });
        const permanent = result.status >= 400 && result.status < 500 && result.status !== 429;
        if (permanent) await removePending(item.clientRequestId);
      }
    }
    return { sent, failed };
  })().finally(() => { syncing = null; });
  return syncing;
}
