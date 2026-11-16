/**
 * Zustand Public School ERP — Central API Client
 * High-Performance API Client with Request Deduplication & In-Memory Caching
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  statusCode: number;
  errors?: any;

  constructor(message: string, statusCode: number, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'ApiError';
  }
}

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
}

export interface RequestOptions {
  forceRefresh?: boolean;
  ttl?: number;
}

class ApiClient {
  private baseUrl: string;
  private cache: Map<string, CacheEntry> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private defaultTTL = 45000; // 45 seconds default TTL for read queries

  constructor() {
    this.baseUrl = (API_BASE_URL || 'http://localhost:4000/api/v1').replace(/\/+$/, '');
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('zustand_erp_token');
  }

  private handleUnauthorized() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('zustand_erp_token');
      localStorage.removeItem('zustand_erp_user');
      this.clearCache();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }
  }

  public clearCache(pattern?: string) {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        const json = await response.json().catch(() => ({}));
        if (endpoint.includes('/auth/login')) {
          const errorMsg =
            json.message ||
            (Array.isArray(json.errors) ? json.errors.join(', ') : 'Invalid admission number, username or password.');
          throw new ApiError(errorMsg, 401, json.errors);
        }
        this.handleUnauthorized();
        throw new ApiError('Session expired. Please log in again.', 401);
      }

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg =
          json.message ||
          (Array.isArray(json.errors) ? json.errors.join(', ') : 'Server request failed');
        throw new ApiError(errorMsg, response.status, json.errors);
      }

      // Backend returns standard envelope: { success: true, data: T, timestamp: string }
      return (json.data !== undefined ? json.data : json) as T;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error.message || 'Unable to connect to school server. Please verify backend is running.',
        500,
      );
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    options?: RequestOptions,
  ): Promise<T> {
    let url = endpoint;
    if (params) {
      const query = Object.entries(params)
        .filter(([_, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      if (query) {
        url += (url.includes('?') ? '&' : '?') + query;
      }
    }

    const cacheKey = `GET_${url}`;
    const now = Date.now();
    const ttl = options?.ttl ?? this.defaultTTL;

    // 1. Check in-memory fresh cache (0ms instant response)
    if (!options?.forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (now - cached.timestamp < ttl) {
        return cached.data as T;
      }
      this.cache.delete(cacheKey);
    }

    // 2. Request Deduplication: if identical fetch is in-flight, reuse promise
    if (!options?.forceRefresh && this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)! as Promise<T>;
    }

    const fetchPromise = this.request<T>(url, { method: 'GET' })
      .then((data) => {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        this.pendingRequests.delete(cacheKey);
        return data;
      })
      .catch((err) => {
        this.pendingRequests.delete(cacheKey);
        throw err;
      });

    this.pendingRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    this.clearCache();
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<T> {
    this.clearCache();
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: any): Promise<T> {
    this.clearCache();
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    this.clearCache();
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
