import { API_URL, TOKEN_STORAGE_KEY } from '../config.js';

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'NETWORK_ERROR', details, retryAfter } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryAfter = retryAfter;
  }

  get isNetworkError() { return this.status === 0; }
  get isUnauthorized() { return this.status === 401; }
}

class ApiClient {
  #token = null;
  #onUnauthorized = null;

  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    try {
      this.#token = localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      this.#token = null;
    }
  }

  get token() { return this.#token; }

  setToken(token) {
    this.#token = token;
    try {
      if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
      else localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {}
  }

  onUnauthorized(handler) {
    this.#onUnauthorized = handler;
  }

  url(path, query) {
    const url = new URL(`${this.baseUrl}/api${path}`);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    }
    return url.toString();
  }

  assetUrl(path) {
    if (!path) return null;
    return /^https?:/.test(path) ? path : `${this.baseUrl}${path}`;
  }

  async request(method, path, { query, body, signal, headers = {} } = {}) {
    const init = { method, signal, headers: { Accept: 'application/json', ...headers } };
    if (this.#token) init.headers.Authorization = `Bearer ${this.#token}`;
    if (body instanceof Blob) {
      init.body = body;
      init.headers['Content-Type'] = body.type || 'application/octet-stream';
    } else if (body !== undefined) {
      init.body = JSON.stringify(body);
      init.headers['Content-Type'] = 'application/json';
    }

    let response;
    try {
      response = await fetch(this.url(path, query), init);
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      throw new ApiError('No pudimos conectar con el servidor. Revisa tu conexión.');
    }

    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const info = data?.error ?? {};
      const error = new ApiError(info.message ?? `Error ${response.status}`, {
        status: response.status,
        code: info.code ?? 'HTTP_ERROR',
        details: info.details,
        retryAfter: Number(response.headers.get('Retry-After')) || undefined,
      });
      if (response.status === 401 && this.#token) this.#onUnauthorized?.(error);
      throw error;
    }
    return data;
  }

  get(path, options) { return this.request('GET', path, options); }
  post(path, body, options) { return this.request('POST', path, { ...options, body }); }
  patch(path, body, options) { return this.request('PATCH', path, { ...options, body }); }
}

export const api = new ApiClient(API_URL);
