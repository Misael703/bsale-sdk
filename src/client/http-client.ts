import { BsaleApiError } from '../errors/bsale.error';
import type { BsaleConfig } from '../types';

interface CacheEntry {
  readonly data: unknown;
  readonly expiresAt: number;
}

/** Per-request options that override defaults */
export interface HttpRequestOptions {
  /**
   * Si es true, no envía el header `access_token`. Usar para endpoints donde
   * la credencial va en el path (ej. pasarela de pagos `bcash.bsale.io`).
   */
  readonly skipAuth?: boolean;
}

const DEFAULT_BASE_URL = 'https://api.bsale.io/v1';
const DEFAULT_TIMEOUT = 15_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_CACHE_TTL_MS = 60_000;

/**
 * Low-level HTTP client for the Bsale API.
 * Handles authentication, caching, retry with exponential backoff,
 * rate limiting, and timeout via AbortController.
 *
 * Soporta paths con versión explícita (`/v2/...`, `/v3/...`): el cliente
 * sustituye la versión en la `baseUrl` configurada.
 */
export class HttpClient {
  private readonly accessToken: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly cacheTtlMs: number;
  private readonly logger?: (message: string, data?: Record<string, unknown>) => void;
  private readonly cache = new Map<string, CacheEntry>();

  constructor(config: BsaleConfig & { baseUrl?: string }) {
    this.accessToken = config.accessToken;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.cacheTtlMs = config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    this.logger = config.logger;
  }

  /**
   * Performs a GET request with caching support.
   * @param path - API path (e.g., '/products.json')
   * @param params - Optional query parameters
   * @param options - Per-request overrides (e.g., skipAuth)
   */
  async get<T>(
    path: string,
    params?: Record<string, unknown>,
    options?: HttpRequestOptions,
  ): Promise<T> {
    const url = this.buildUrl(path, params);
    const cacheKey = url;

    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      this.logger?.('Cache hit', { url });
      return cached.data as T;
    }

    const result = await this.request<T>('GET', url, undefined, options);

    this.cache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + this.cacheTtlMs,
    });

    return result;
  }

  /**
   * Performs a POST request. Invalidates cache for the resource path.
   */
  async post<T>(path: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    const url = this.buildUrl(path);
    const result = await this.request<T>('POST', url, body, options);
    this.invalidateCacheByPath(path);
    return result;
  }

  /**
   * Performs a PUT request. Invalidates cache for the resource path.
   */
  async put<T>(path: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    const url = this.buildUrl(path);
    const result = await this.request<T>('PUT', url, body, options);
    this.invalidateCacheByPath(path);
    return result;
  }

  /**
   * Performs a DELETE request. Invalidates cache for the resource path.
   */
  async delete<T>(path: string, options?: HttpRequestOptions): Promise<T> {
    const url = this.buildUrl(path);
    const result = await this.request<T>('DELETE', url, undefined, options);
    this.invalidateCacheByPath(path);
    return result;
  }

  /**
   * Invalidates cached entries matching an optional path pattern.
   */
  invalidateCache(pathPattern?: string): void {
    if (!pathPattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.includes(pathPattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Builds a full URL from a path and optional query params.
   * - Absolute URLs (http://, https://) se usan tal cual.
   * - Paths con prefijo de versión explícita (`/v2/...`, `/v3/...`) reemplazan
   *   la versión en `baseUrl`.
   * - El resto se concatena con `baseUrl` directamente.
   */
  buildUrl(path: string, params?: Record<string, unknown>): string {
    let url: string;

    if (path.startsWith('http://') || path.startsWith('https://')) {
      url = path;
    } else {
      const cleanPath = path.startsWith('/') ? path : `/${path}`;
      const versionMatch = cleanPath.match(/^\/(v\d+)\//);
      if (versionMatch) {
        const baseWithoutVersion = this.baseUrl.replace(/\/v\d+$/, '');
        url = `${baseWithoutVersion}${cleanPath}`;
      } else {
        url = `${this.baseUrl}${cleanPath}`;
      }
    }

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      }
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}${searchParams.toString()}`;
    }

    return url;
  }

  private async request<T>(
    method: string,
    url: string,
    body?: unknown,
    options?: HttpRequestOptions,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        this.logger?.(`${method} ${url}`, { attempt });

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (!options?.skipAuth) {
          headers['access_token'] = this.accessToken;
        }

        const init: RequestInit = {
          method,
          headers,
          signal: controller.signal,
        };

        if (body !== undefined) {
          init.body = JSON.stringify(body);
        }

        const response = await fetch(url, init);

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000;
          this.logger?.('Rate limited, waiting', { waitMs });
          await this.sleep(waitMs);
          continue;
        }

        if (response.status >= 500 && attempt < this.maxRetries) {
          const backoff = Math.pow(2, attempt) * 1000;
          this.logger?.('Server error, retrying', { status: response.status, backoff });
          await this.sleep(backoff);
          continue;
        }

        if (!response.ok) {
          const responseBody = await this.safeParseJson(response);
          throw new BsaleApiError(
            `Bsale API error: ${response.status} ${response.statusText}`,
            response.status,
            responseBody,
            url,
          );
        }

        const text = await response.text();
        if (!text || text.trim() === '') {
          return {} as T;
        }

        return JSON.parse(text) as T;
      } catch (error) {
        if (error instanceof BsaleApiError) {
          throw error;
        }

        lastError = error as Error;

        if ((error as Error).name === 'AbortError') {
          lastError = new Error(`Request timed out after ${this.timeout}ms: ${method} ${url}`);
        }

        if (attempt < this.maxRetries) {
          const backoff = Math.pow(2, attempt) * 1000;
          this.logger?.('Network error, retrying', { error: (error as Error).message, backoff });
          await this.sleep(backoff);
          continue;
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw lastError ?? new Error(`Request failed after ${this.maxRetries} retries`);
  }

  private invalidateCacheByPath(path: string): void {
    const match = path.match(/\/?([a-z_]+)/);
    if (match) {
      this.invalidateCache(match[1]);
    }
  }

  private async safeParseJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
