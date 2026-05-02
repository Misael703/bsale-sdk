import { BsaleApiError } from '../errors/bsale.error';
import { LRUCache } from '../utils/lru-cache';
import type { BsaleConfig, BsaleMiddleware, BsaleRequestContext } from '../types';

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
  /**
   * Si es true, ignora el cache y el in-flight dedup: dispara fetch fresh y no
   * persiste la respuesta. Útil para forzar lectura tras una operación externa.
   */
  readonly skipCache?: boolean;
  /**
   * Permite cancelar la request. Si el caller que origina la fetch aborta,
   * la fetch subyacente se cancela y los callers dedupplicados ven el error.
   * Si un caller dedupplicado aborta, sólo bailas su propio await; la fetch
   * compartida sigue para el resto.
   */
  readonly signal?: AbortSignal;
  /**
   * Idempotency-Key para POST/PUT. Se envía como header `Idempotency-Key`
   * y se preserva en cada retry interno, así un retry de red no genera
   * duplicados en el lado del servidor (cuando el servidor lo soporte).
   */
  readonly idempotencyKey?: string;
}

const DEFAULT_BASE_URL = 'https://api.bsale.io/v1';
const DEFAULT_TIMEOUT = 15_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_CACHE_TTL_MS = 60_000;
const DEFAULT_CACHE_MAX_ENTRIES = 1000;
const DEFAULT_RETRY_AFTER_MS = 1_000;
const MAX_RETRY_AFTER_MS = 60_000;

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
  private readonly cacheTtlByResource?: Readonly<Record<string, number>>;
  private readonly logger?: (message: string, data?: Record<string, unknown>) => void;
  private readonly cache: LRUCache<CacheEntry>;
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private readonly middlewares: BsaleMiddleware[];

  constructor(config: BsaleConfig & { baseUrl?: string }) {
    this.accessToken = config.accessToken;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.cacheTtlMs = config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    this.cacheTtlByResource = config.cacheTtlByResource;
    this.cache = new LRUCache<CacheEntry>(config.cacheMaxEntries ?? DEFAULT_CACHE_MAX_ENTRIES);
    this.logger = config.logger;
    this.middlewares = config.middlewares ? [...config.middlewares] : [];
  }

  /** Adds a middleware after construction. Applies to all subsequent requests. */
  use(middleware: BsaleMiddleware): void {
    this.middlewares.push(middleware);
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

    const skipCache = options?.skipCache ?? false;

    if (!skipCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        this.logger?.('Cache hit', { url });
        return structuredClone(cached.data) as T;
      }

      const inflight = this.inFlight.get(cacheKey);
      if (inflight) {
        this.logger?.('Coalesced request', { url });
        const shared = await this.awaitWithSignal(inflight, options?.signal);
        return structuredClone(shared) as T;
      }
    }

    if (skipCache) {
      return this.request<T>('GET', url, undefined, options);
    }

    const sharedPromise = this.request<T>('GET', url, undefined, options).then((data) =>
      structuredClone(data),
    );
    this.inFlight.set(cacheKey, sharedPromise);

    try {
      const shared = await sharedPromise;
      this.cache.set(cacheKey, {
        data: shared,
        expiresAt: Date.now() + this.resolveTtl(path),
      });
      return structuredClone(shared) as T;
    } finally {
      this.inFlight.delete(cacheKey);
    }
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
    const userSignal = options?.signal;

    if (userSignal?.aborted) {
      throw this.makeAbortError(userSignal);
    }

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      const onUserAbort = (): void => controller.abort();
      if (userSignal) {
        userSignal.addEventListener('abort', onUserAbort, { once: true });
      }

      try {
        this.logger?.(`${method} ${url}`, { attempt });

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (!options?.skipAuth) {
          headers['access_token'] = this.accessToken;
        }
        if (options?.idempotencyKey && (method === 'POST' || method === 'PUT')) {
          headers['Idempotency-Key'] = options.idempotencyKey;
        }

        const ctx: BsaleRequestContext = {
          url,
          method,
          headers,
          body,
          attempt,
          signal: controller.signal,
        };

        const response = await this.runMiddlewares(ctx);

        if (response.status === 429) {
          if (attempt >= this.maxRetries) {
            const responseBody = await this.safeParseJson(response);
            throw new BsaleApiError(
              `Bsale API rate limit exceeded after ${this.maxRetries} retries`,
              429,
              responseBody,
              url,
            );
          }
          const waitMs = this.parseRetryAfter(response.headers.get('Retry-After'));
          this.logger?.('Rate limited, waiting', { waitMs, attempt });
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

        if (userSignal?.aborted) {
          throw this.makeAbortError(userSignal);
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
        if (userSignal) {
          userSignal.removeEventListener('abort', onUserAbort);
        }
      }
    }

    throw lastError ?? new Error(`Request failed after ${this.maxRetries} retries`);
  }

  private runMiddlewares(ctx: BsaleRequestContext): Promise<Response> {
    const terminal = (): Promise<Response> => {
      const init: RequestInit = {
        method: ctx.method,
        headers: ctx.headers,
        signal: ctx.signal,
      };
      if (ctx.body !== undefined) {
        init.body = typeof ctx.body === 'string' ? ctx.body : JSON.stringify(ctx.body);
      }
      return fetch(ctx.url, init);
    };

    if (this.middlewares.length === 0) return terminal();

    const dispatch = (idx: number): Promise<Response> => {
      if (idx >= this.middlewares.length) return terminal();
      return this.middlewares[idx](ctx, () => dispatch(idx + 1));
    };
    return dispatch(0);
  }

  private invalidateCacheByPath(path: string): void {
    for (const segment of this.extractResourceSegments(path)) {
      this.invalidateCache(segment);
    }
  }

  private extractResourceSegments(path: string): string[] {
    const withoutVersion = path.replace(/^\/?(v\d+\/)?/, '');
    const withoutQuery = withoutVersion.split('?')[0];
    const withoutJson = withoutQuery.replace(/\.json$/, '');
    return withoutJson.split('/').filter((s) => s && !/^\d+$/.test(s));
  }

  private resolveTtl(path: string): number {
    if (!this.cacheTtlByResource) return this.cacheTtlMs;
    const [resource] = this.extractResourceSegments(path);
    if (resource && resource in this.cacheTtlByResource) {
      return this.cacheTtlByResource[resource];
    }
    return this.cacheTtlMs;
  }

  private makeAbortError(signal: AbortSignal): Error {
    if (signal.reason instanceof Error) return signal.reason;
    const err = new Error('Request aborted');
    err.name = 'AbortError';
    return err;
  }

  private awaitWithSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
    if (!signal) return promise;
    if (signal.aborted) return Promise.reject(this.makeAbortError(signal));

    return new Promise<T>((resolve, reject) => {
      const onAbort = (): void => {
        signal.removeEventListener('abort', onAbort);
        reject(this.makeAbortError(signal));
      };
      signal.addEventListener('abort', onAbort, { once: true });
      promise.then(
        (value) => {
          signal.removeEventListener('abort', onAbort);
          resolve(value);
        },
        (err) => {
          signal.removeEventListener('abort', onAbort);
          reject(err);
        },
      );
    });
  }

  private parseRetryAfter(headerValue: string | null): number {
    if (!headerValue) return DEFAULT_RETRY_AFTER_MS;
    const trimmed = headerValue.trim();
    if (!trimmed) return DEFAULT_RETRY_AFTER_MS;

    if (/^\d+$/.test(trimmed)) {
      const seconds = parseInt(trimmed, 10);
      return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS);
    }

    const dateMs = Date.parse(trimmed);
    if (Number.isFinite(dateMs)) {
      const delta = dateMs - Date.now();
      return Math.max(0, Math.min(delta, MAX_RETRY_AFTER_MS));
    }

    return DEFAULT_RETRY_AFTER_MS;
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
