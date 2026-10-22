export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export const DEFAULT_CENTER = { lat: 4.6097, lng: -74.0817 };

export const PHOTO_MAX_DIMENSION = 1600;
export const PHOTO_TARGET_BYTES = 600 * 1024;

export const TOKEN_STORAGE_KEY = 'vs.token';
export const USER_STORAGE_KEY = 'vs.user';
