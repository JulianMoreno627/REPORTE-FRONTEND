import { compressImage } from '../services/compressImage.js';

self.onmessage = async ({ data: { id, file, options } }) => {
  try {
    const result = await compressImage(file, options, (width, height) => new OffscreenCanvas(width, height));
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
};
