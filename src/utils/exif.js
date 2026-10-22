const SOI = 0xd8;
const APP0 = 0xe0;
const APP1 = 0xe1;
const SOS = 0xda;
const EOI = 0xd9;
const ORIENTATION_TAG = 0x0112;
const GPS_IFD_POINTER = 0x8825;

const ascii = (bytes, start, end) => String.fromCharCode(...bytes.subarray(start, end));

export const isJpeg = (bytes) => bytes.length > 3 && bytes[0] === 0xff && bytes[1] === SOI && bytes[2] === 0xff;

function* segments(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;
  while (offset + 4 <= bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1];
    if (marker === SOS || marker === EOI) return;
    const size = view.getUint16(offset + 2);
    yield { marker, offset, size };
    offset += 2 + size;
  }
}

export function extractExifSegment(bytes) {
  if (!isJpeg(bytes)) return null;
  for (const { marker, offset, size } of segments(bytes)) {
    if (marker === APP1 && ascii(bytes, offset + 4, offset + 10) === 'Exif\0\0') {
      return bytes.slice(offset, offset + 2 + size);
    }
  }
  return null;
}

function tiffReader(segment) {
  const tiff = segment.subarray(10);
  const view = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength);
  const order = ascii(tiff, 0, 2);
  if (order !== 'II' && order !== 'MM') return null;
  const little = order === 'II';
  const u16 = (at) => view.getUint16(at, little);
  const u32 = (at) => view.getUint32(at, little);
  const entries = (ifd) => {
    const map = new Map();
    const count = u16(ifd);
    for (let i = 0; i < count; i++) map.set(u16(ifd + 2 + i * 12), ifd + 2 + i * 12);
    return map;
  };
  return { tiff, view, little, u16, u32, entries };
}

export function resetOrientation(segment) {
  try {
    const reader = tiffReader(segment);
    if (!reader) return segment;
    const entry = reader.entries(reader.u32(4)).get(ORIENTATION_TAG);
    if (entry !== undefined) reader.view.setUint16(entry + 8, 1, reader.little);
  } catch {}
  return segment;
}

export function insertExifSegment(jpeg, segment) {
  if (!segment || !isJpeg(jpeg)) return jpeg;
  let insertAt = 2;
  const [first] = segments(jpeg);
  if (first?.marker === APP0) insertAt = first.offset + 2 + first.size;
  const output = new Uint8Array(jpeg.length + segment.length);
  output.set(jpeg.subarray(0, insertAt), 0);
  output.set(segment, insertAt);
  output.set(jpeg.subarray(insertAt), insertAt + segment.length);
  return output;
}

export function readGps(segment) {
  try {
    const reader = tiffReader(segment);
    if (!reader) return null;
    const { tiff, u32, entries } = reader;
    const ifd0 = entries(u32(4));
    if (!ifd0.has(GPS_IFD_POINTER)) return null;
    const gps = entries(u32(ifd0.get(GPS_IFD_POINTER) + 8));
    const rational = (at) => {
      const denominator = u32(at + 4);
      return denominator ? u32(at) / denominator : 0;
    };
    const degrees = (tag) => {
      const entry = gps.get(tag);
      if (entry === undefined) return null;
      const at = u32(entry + 8);
      return rational(at) + rational(at + 8) / 60 + rational(at + 16) / 3600;
    };
    const ref = (tag) => (gps.has(tag) ? String.fromCharCode(tiff[gps.get(tag) + 8]) : '');
    const lat = degrees(2);
    const lng = degrees(4);
    if (lat === null || lng === null || (lat === 0 && lng === 0)) return null;
    return { lat: ref(1) === 'S' ? -lat : lat, lng: ref(3) === 'W' ? -lng : lng };
  } catch {
    return null;
  }
}
