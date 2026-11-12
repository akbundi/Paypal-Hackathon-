/**
 * Centralized HTTP Client for PayGuard.
 * 
 * Provides unified request execution with:
 * - Method helpers (GET, POST, PUT, PATCH, DELETE)
 * - Automatic Bearer token attachment
 * - Timeout handling via AbortController
 * - Error classification (401, 403, 404, 500, network, timeout)
 * - FastAPI validation error parsing
 */

import { getApiBaseUrl } from './endpoints';
import { ApiErrorResponse } from '../../types/api.types';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
  skipAuth?: boolean;
}

export class ApiError extends Error {
  statusCode: number;
  statusText: string;
  data?: unknown;
  isNetworkError: boolean;
  isTimeout: boolean;
  isUnauthorized: boolean;
  isForbidden: boolean;
  isNotFound: boolean;
  isServerError: boolean;

  constructor(params: {
    message: string;
    statusCode?: number;
    statusText?: string;
    data?: unknown;
    isNetworkError?: boolean;
    isTimeout?: boolean;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.statusCode = params.statusCode || 0;
    this.statusText = params.statusText || '';
    this.data = params.data;
    this.isNetworkError = Boolean(params.isNetworkError);
    this.isTimeout = Boolean(params.isTimeout);

    this.isUnauthorized = this.statusCode === 401;
    this.isForbidden = this.statusCode === 403;
    this.isNotFound = this.statusCode === 404;
    this.isServerError = this.statusCode >= 500 && this.statusCode < 600;

    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// In-memory auth token cache (falls back to localStorage)
const AUTH_TOKEN_KEY = 'payguard_auth_token';
let inMemoryToken: string | null = null;

export const authStorage = {
  getToken(): string | null {
    if (inMemoryToken) return inMemoryToken;
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken(token: string | null): void {
    inMemoryToken = token;
    try {
      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    } catch {
      // localStorage unavailable (e.g. private mode or non-browser)
    }
  },
  clearToken(): void {
    inMemoryToken = null;
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

/**
 * Format backend validation details into a readable string.
 */
function extractErrorMessage(status: number, statusText: string, body: unknown): string {
  if (body && typeof body === 'object') {
    const errorBody = body as ApiErrorResponse;
    if (Array.isArray(errorBody.detail)) {
      return errorBody.detail
        .map((d) => (d.loc && d.loc.length > 0 ? `${d.loc.join('.')}: ${d.msg}` : d.msg))
        .join(', ');
    }
    if (typeof errorBody.detail === 'string') {
      return errorBody.detail;
    }
    if (errorBody.message) {
      return errorBody.message;
    }
    if (errorBody.error) {
      return errorBody.error;
    }
  }

  switch (status) {
    case 400:
      return 'Bad request. Please verify the submitted data.';
    case 401:
      return 'Session expired or invalid authentication credentials.';
    case 403:
      return 'Access denied. You do not have permission to perform this action.';
    case 404:
      return 'Requested resource could not be found.';
    case 409:
      return 'Conflict occurred. The resource already exists.';
    case 422:
      return 'Validation error. Please verify the payload format.';
    case 423:
      return 'Account temporarily locked. Please contact your administrator.';
    case 500:
      return 'Internal server error. The backend encountered an unexpected error.';
    case 502:
      return 'Bad gateway. The upstream API server is unreachable.';
    case 503:
      return 'Service temporarily unavailable. Please try again shortly.';
    default:
      return `Request failed with HTTP status ${status} (${statusText || 'Error'})`;
  }
}

/**
 * Core HTTP Request Dispatcher.
 */
export async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    params,
    body,
    headers: customHeaders,
    timeoutMs = 15000,
    skipAuth = false,
    ...restOptions
  } = options;

  const baseUrl = getApiBaseUrl();
  const urlPath = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  // Query parameter serialization
  const url = new URL(urlPath, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  // Header configuration
  const headers = new Headers(customHeaders);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Attach auth token if available
  if (!skipAuth && !headers.has('Authorization')) {
    const token = authStorage.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Body handling
  let payload: BodyInit | null = null;
  if (body !== undefined && body !== null) {
    if (
      typeof body === 'string' ||
      body instanceof FormData ||
      body instanceof Blob ||
      body instanceof URLSearchParams
    ) {
      payload = body as BodyInit;
    } else {
      payload = JSON.stringify(body);
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
    }
  }

  // Timeout control via AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: payload,
      signal: controller.signal,
      ...restOptions,
    });

    clearTimeout(timeoutId);

    // Read and parse response
    const contentType = response.headers.get('content-type') || '';
    let parsedData: unknown = null;
    if (contentType.includes('application/json')) {
      parsedData = await response.json().catch(() => null);
    } else {
      const text = await response.text().catch(() => '');
      parsedData = text || null;
    }

    if (!response.ok) {
      // Handle 401 session expiry notification
      if (response.status === 401 && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('payguard:unauthorized', { detail: { endpoint } }));
      }

      const errorMessage = extractErrorMessage(response.status, response.statusText, parsedData);
      throw new ApiError({
        message: errorMessage,
        statusCode: response.status,
        statusText: response.statusText,
        data: parsedData,
      });
    }

    return parsedData as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) {
      throw err;
    }

    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError({
        message: `Request to ${endpoint} timed out after ${timeoutMs}ms. Please check your backend connection.`,
        isTimeout: true,
      });
    }

    const errorMsg = err instanceof Error ? err.message : 'Unknown network failure';
    throw new ApiError({
      message: `Network error connecting to ${baseUrl}: ${errorMsg}. Please ensure the backend is running and CORS is configured.`,
      isNetworkError: true,
    });
  }
}

/**
 * Convenient HTTP verb helpers
 */
export const http = {
  get<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'POST', body });
  },

  put<T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'PUT', body });
  },

  patch<T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'PATCH', body });
  },

  delete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
