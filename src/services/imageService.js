import { PHOTO_MAX_DIMENSION, PHOTO_TARGET_BYTES } from '../config.js';
import { compressImage } from './compressImage.js';

const options = { maxDimension: PHOTO_MAX_DIMENSION, targetBytes: PHOTO_TARGET_BYTES };
const supportsWorker = typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';

let worker = null;
let nextId = 0;
const pending = new Map();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('../workers/compress.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      const task = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) task?.reject(new Error(data.error));
      else task?.resolve(data.result);
    };
  }
  return worker;
}

export function compressPhoto(file) {
  if (!file.type.startsWith('image/')) return Promise.reject(new Error('El archivo no es una imagen'));
  if (!supportsWorker) {
    return compressImage(file, options, (width, height) => Object.assign(document.createElement('canvas'), { width, height }));
  }
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, file, options });
  });
}
