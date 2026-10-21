/**
 * Centralized API client for Artha.
 * - Handles JWT authorization header with 'artha-token'
 * - Handles 401 unauthenticated responses with automatic token clear and auth notification
 * - Preserves exact backend response structure
 */

const BASE_URL = '/api';
export const TOKEN_KEY = 'artha-token';

export const tokenStorage = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (t) => {
    try {
      localStorage.setItem(TOKEN_KEY, t);
    } catch {
      // Ignore storage errors
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore storage errors
    }
  },
};

export class ApiError extends Error {
  constructor(status, message, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

async function request(method, path, body = undefined, customHeaders = {}) {
  const headers = {
    Accept: 'application/json',
    ...customHeaders,
  };

  const token = tokenStorage.get();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Normalize path if it accidentally starts with /api
  const normalizedPath = path.startsWith('/api/') ? path.slice(4) : path.startsWith('/') ? path : `/${path}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${normalizedPath}`, {
      method,
      headers,
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    });
  } catch (networkError) {
    throw new ApiError(0, 'Unable to connect to ARTHA server. Please check your network.', null);
  }

  // Handle CSV or file download responses
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/csv') || contentType.includes('application/octet-stream')) {
    if (!res.ok) {
      throw new ApiError(res.status, 'Failed to download file');
    }
    return await res.blob();
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    // Non-JSON response
  }

  if (!res.ok) {
    if (res.status === 401 && token) {
      tokenStorage.clear();
      window.dispatchEvent(new CustomEvent('artha:unauthorized'));
    }
    const message = payload?.message || `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message, payload);
  }

  return payload;
}

export const api = {
  get: (path, headers) => request('GET', path, undefined, headers),
  post: (path, body, headers) => request('POST', path, body, headers),
  put: (path, body, headers) => request('PUT', path, body, headers),
  patch: (path, body, headers) => request('PATCH', path, body, headers),
  del: (path, headers) => request('DELETE', path, undefined, headers),
};

export default api;
