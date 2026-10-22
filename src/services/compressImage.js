import { extractExifSegment, insertExifSegment, readGps, resetOrientation } from '../utils/exif.js';

const QUALITIES = [0.82, 0.72, 0.62, 0.52, 0.45];

async function toBlob(canvas, quality) {
  if (canvas.convertToBlob) return canvas.convertToBlob({ type: 'image/jpeg', quality });
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se pudo comprimir la imagen'))), 'image/jpeg', quality);
  });
}

export async function compressImage(file, { maxDimension, targetBytes }, createCanvas) {
  const original = new Uint8Array(await file.arrayBuffer());
  const exif = extractExifSegment(original);
  const gps = exif ? readGps(exif) : null;

  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = createCanvas(width, height);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  let blob;
  for (const quality of QUALITIES) {
    blob = await toBlob(canvas, quality);
    if (blob.size <= targetBytes) break;
  }

  let bytes = new Uint8Array(await blob.arrayBuffer());
  if (exif) bytes = insertExifSegment(bytes, resetOrientation(exif));
  return {
    blob: new Blob([bytes], { type: 'image/jpeg' }),
    width,
    height,
    originalBytes: file.size,
    bytes: bytes.length,
    gps,
  };
}
