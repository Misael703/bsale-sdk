import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient } from '../src/client/http-client';
import { BsaleApiError } from '../src/errors/bsale.error';

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('HttpClient', () => {
  let client: HttpClient;
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
    client = new HttpClient({
      accessToken: 'test-token-123',
      baseUrl: 'https://api.bsale.io/v1',
      timeout: 5000,
      maxRetries: 1,
      cacheTtlMs: 5000,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('buildUrl', () => {
    it('should build a URL from a relative path', () => {
      const url = client.buildUrl('/products.json');
      expect(url).toBe('https://api.bsale.io/v1/products.json');
    });

    it('should build a URL with query parameters', () => {
      const url = client.buildUrl('/products.json', { limit: 10, offset: 0 });
      expect(url).toContain('limit=10');
      expect(url).toContain('offset=0');
    });

    it('should handle absolute URLs (for pagination next links)', () => {
      const absoluteUrl = 'https://api.bsale.io/v1/products.json?limit=50&offset=50';
      const url = client.buildUrl(absoluteUrl);
      expect(url).toBe(absoluteUrl);
    });

    it('should skip undefined and null params', () => {
      const url = client.buildUrl('/products.json', { limit: 10, offset: undefined, name: null });
      expect(url).toBe('https://api.bsale.io/v1/products.json?limit=10');
    });

    it('should handle paths without leading slash', () => {
      const url = client.buildUrl('products.json');
      expect(url).toBe('https://api.bsale.io/v1/products.json');
    });

    it('should rewrite version when path starts with /v2/', () => {
      const url = client.buildUrl('/v2/products/pack.json');
      expect(url).toBe('https://api.bsale.io/v2/products/pack.json');
    });

    it('should rewrite version when path starts with /v3/', () => {
      const url = client.buildUrl('/v3/products/1/product_images.json');
      expect(url).toBe('https://api.bsale.io/v3/products/1/product_images.json');
    });
  });

  describe('skipAuth', () => {
    it('should not send access_token when skipAuth=true', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));
      await client.get('/payment/state/abc', undefined, { skipAuth: true });
      const [, init] = mockFetch.mock.calls[0];
      expect(init.headers['access_token']).toBeUndefined();
      expect(init.headers['Content-Type']).toBe('application/json');
    });

    it('should send access_token by default', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));
      await client.get('/products.json');
      const [, init] = mockFetch.mock.calls[0];
      expect(init.headers['access_token']).toBe('test-token-123');
    });
  });

  describe('headers', () => {
    it('should send access_token header (not Authorization Bearer)', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ items: [] }));

      await client.get('/products.json');

      expect(mockFetch).toHaveBeenCalledOnce();
      const [, init] = mockFetch.mock.calls[0];
      expect(init.headers['access_token']).toBe('test-token-123');
      expect(init.headers['Authorization']).toBeUndefined();
    });

    it('should send Content-Type application/json', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ items: [] }));

      await client.get('/products.json');

      const [, init] = mockFetch.mock.calls[0];
      expect(init.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('cache', () => {
    it('should cache GET responses', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ items: [{ id: 1 }] }));

      const first = await client.get('/products.json');
      const second = await client.get('/products.json');

      expect(first).toEqual({ items: [{ id: 1 }] });
      expect(second).toEqual({ items: [{ id: 1 }] });
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it('should invalidate cache after POST', async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 1 }] }))
        .mockResolvedValueOnce(jsonResponse({ id: 2 }))
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 1 }] }));

      await client.get('/products.json');
      await client.post('/products.json', { name: 'test' });
      await client.get('/products.json');

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should expire cache after TTL', async () => {
      const shortTtlClient = new HttpClient({
        accessToken: 'test-token',
        cacheTtlMs: 100,
        maxRetries: 0,
      });

      mockFetch
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 1 }] }))
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 2 }] }));

      await shortTtlClient.get('/products.json');
      await new Promise((r) => setTimeout(r, 150));
      await shortTtlClient.get('/products.json');

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache with invalidateCache()', async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ items: [] }))
        .mockResolvedValueOnce(jsonResponse({ items: [] }))
        .mockResolvedValueOnce(jsonResponse({ items: [] }))
        .mockResolvedValueOnce(jsonResponse({ items: [] }));

      await client.get('/products.json');
      await client.get('/variants.json');
      client.invalidateCache();
      await client.get('/products.json');
      await client.get('/variants.json');

      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('empty body handling', () => {
    it('should return empty object for 200 with empty body', async () => {
      mockFetch.mockResolvedValueOnce(new Response('', { status: 200 }));

      const result = await client.get('/products/1.json');
      expect(result).toEqual({});
    });
  });

  describe('cache invalidation by path', () => {
    it('should not clear unrelated caches when POSTing to a versioned path', async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 1 }] }))
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 2 }] }))
        .mockResolvedValueOnce(jsonResponse({ ok: true }))
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 1 }] }))
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 2 }] }));

      await client.get('/clients.json');
      await client.get('/payment_types.json');
      await client.post('/v2/products/pack.json', {});
      await client.get('/clients.json');
      await client.get('/payment_types.json');

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should invalidate parent and child resources for nested POST', async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 1 }] }))
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 1 }] }))
        .mockResolvedValueOnce(jsonResponse({ ok: true }))
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 1 }] }))
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 1 }] }));

      await client.get('/products.json');
      await client.get('/variants.json');
      await client.post('/products/123/variants.json', {});
      await client.get('/products.json');
      await client.get('/variants.json');

      expect(mockFetch).toHaveBeenCalledTimes(5);
    });

    it('should not be confused by numeric IDs in DELETE paths', async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 1 }] }))
        .mockResolvedValueOnce(jsonResponse({ ok: true }))
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 1 }] }));

      await client.get('/documents.json');
      await client.delete('/documents/42.json?officeId=1');
      await client.get('/documents.json');

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('429 rate limiting', () => {
    it('should retry once and succeed after 429 with Retry-After: 1', async () => {
      vi.useFakeTimers();
      try {
        mockFetch
          .mockResolvedValueOnce(
            new Response('{"error":"rl"}', {
              status: 429,
              headers: { 'Retry-After': '1' },
            }),
          )
          .mockResolvedValueOnce(jsonResponse({ ok: true }));

        const promise = client.get('/products.json');
        await vi.advanceTimersByTimeAsync(1000);
        const result = await promise;

        expect(result).toEqual({ ok: true });
        expect(mockFetch).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should throw BsaleApiError(429) when retries are exhausted', async () => {
      const limitedClient = new HttpClient({
        accessToken: 'tk',
        baseUrl: 'https://api.bsale.io/v1',
        maxRetries: 1,
        cacheTtlMs: 0,
      });

      mockFetch
        .mockResolvedValueOnce(
          new Response('{"error":"rl"}', {
            status: 429,
            headers: { 'Retry-After': '0' },
          }),
        )
        .mockResolvedValueOnce(
          new Response('{"error":"rl"}', {
            status: 429,
            headers: { 'Retry-After': '0' },
          }),
        );

      await expect(limitedClient.get('/products.json')).rejects.toBeInstanceOf(BsaleApiError);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      mockFetch.mockReset();
      mockFetch
        .mockResolvedValueOnce(
          new Response('{"error":"rl"}', {
            status: 429,
            headers: { 'Retry-After': '0' },
          }),
        )
        .mockResolvedValueOnce(
          new Response('{"error":"rl"}', {
            status: 429,
            headers: { 'Retry-After': '0' },
          }),
        );

      await expect(limitedClient.get('/products.json')).rejects.toMatchObject({
        status: 429,
        isRateLimit: true,
      });
    });

    it('should fall back to default wait when Retry-After is malformed', async () => {
      vi.useFakeTimers();
      try {
        mockFetch
          .mockResolvedValueOnce(
            new Response(null, {
              status: 429,
              headers: { 'Retry-After': 'not-a-number' },
            }),
          )
          .mockResolvedValueOnce(jsonResponse({ ok: true }));

        const promise = client.get('/products.json');

        await vi.advanceTimersByTimeAsync(999);
        expect(mockFetch).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(1);
        const result = await promise;

        expect(result).toEqual({ ok: true });
        expect(mockFetch).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should cap Retry-After at MAX_RETRY_AFTER_MS (60s)', async () => {
      vi.useFakeTimers();
      try {
        mockFetch
          .mockResolvedValueOnce(
            new Response(null, {
              status: 429,
              headers: { 'Retry-After': '999999' },
            }),
          )
          .mockResolvedValueOnce(jsonResponse({ ok: true }));

        const promise = client.get('/products.json');

        await vi.advanceTimersByTimeAsync(60_000);
        const result = await promise;

        expect(result).toEqual({ ok: true });
        expect(mockFetch).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should parse HTTP-date Retry-After', async () => {
      vi.useFakeTimers();
      try {
        const futureDate = new Date(Date.now() + 2_000).toUTCString();
        mockFetch
          .mockResolvedValueOnce(
            new Response(null, {
              status: 429,
              headers: { 'Retry-After': futureDate },
            }),
          )
          .mockResolvedValueOnce(jsonResponse({ ok: true }));

        const promise = client.get('/products.json');
        await vi.advanceTimersByTimeAsync(2_000);
        const result = await promise;

        expect(result).toEqual({ ok: true });
        expect(mockFetch).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('cache immutability', () => {
    it('should not let callers poison the cache by mutating the returned object', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ items: [{ id: 1, name: 'foo' }] }));

      const first = await client.get<{ items: Array<{ id: number; name: string }> }>(
        '/products.json',
      );
      first.items[0].name = 'mutated';

      const second = await client.get<{ items: Array<{ id: number; name: string }> }>(
        '/products.json',
      );

      expect(second.items[0].name).toBe('foo');
      expect(mockFetch).toHaveBeenCalledOnce();
    });
  });

  describe('LRU eviction', () => {
    it('evicts least-recently-used entries when over cacheMaxEntries', async () => {
      const lruClient = new HttpClient({
        accessToken: 'tk',
        baseUrl: 'https://api.bsale.io/v1',
        cacheTtlMs: 60_000,
        cacheMaxEntries: 2,
        maxRetries: 0,
      });

      mockFetch
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 1 }] }))
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 2 }] }))
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 3 }] }))
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 1 }] }));

      await lruClient.get('/a.json');
      await lruClient.get('/b.json');
      await lruClient.get('/c.json');
      await lruClient.get('/a.json');

      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('keeps most-recently-used entries alive on read bump', async () => {
      const lruClient = new HttpClient({
        accessToken: 'tk',
        baseUrl: 'https://api.bsale.io/v1',
        cacheTtlMs: 60_000,
        cacheMaxEntries: 2,
        maxRetries: 0,
      });

      mockFetch
        .mockResolvedValueOnce(jsonResponse({ id: 'a' }))
        .mockResolvedValueOnce(jsonResponse({ id: 'b' }))
        .mockResolvedValueOnce(jsonResponse({ id: 'c' }))
        .mockResolvedValueOnce(jsonResponse({ id: 'a-refetched' }));

      await lruClient.get('/a.json');
      await lruClient.get('/b.json');
      await lruClient.get('/a.json');
      await lruClient.get('/c.json');
      const a = await lruClient.get('/a.json');

      expect(a).toEqual({ id: 'a' });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('request coalescing', () => {
    it('deduplicates concurrent identical GETs into a single fetch', async () => {
      let resolveFetch: ((value: Response) => void) | undefined;
      mockFetch.mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          }),
      );

      const p1 = client.get('/products.json');
      const p2 = client.get('/products.json');
      const p3 = client.get('/products.json');

      expect(mockFetch).toHaveBeenCalledOnce();

      resolveFetch?.(jsonResponse({ items: [{ id: 1 }] }));
      const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

      expect(r1).toEqual({ items: [{ id: 1 }] });
      expect(r2).toEqual({ items: [{ id: 1 }] });
      expect(r3).toEqual({ items: [{ id: 1 }] });
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it('returns independent clones to coalesced callers', async () => {
      let resolveFetch: ((value: Response) => void) | undefined;
      mockFetch.mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          }),
      );

      const p1 = client.get<{ items: Array<{ id: number }> }>('/products.json');
      const p2 = client.get<{ items: Array<{ id: number }> }>('/products.json');

      resolveFetch?.(jsonResponse({ items: [{ id: 1 }] }));
      const [r1, r2] = await Promise.all([p1, p2]);

      expect(r1).not.toBe(r2);
      expect(r1.items).not.toBe(r2.items);

      r1.items[0].id = 999;
      expect(r2.items[0].id).toBe(1);
    });

    it('propagates errors to all coalesced callers and clears in-flight on failure', async () => {
      const failClient = new HttpClient({
        accessToken: 'tk',
        baseUrl: 'https://api.bsale.io/v1',
        maxRetries: 0,
      });

      let rejectFetch: ((err: Error) => void) | undefined;
      mockFetch
        .mockImplementationOnce(
          () =>
            new Promise<Response>((_, reject) => {
              rejectFetch = reject;
            }),
        )
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

      const p1 = failClient.get('/products.json');
      const p2 = failClient.get('/products.json');

      rejectFetch?.(new Error('boom'));

      await expect(p1).rejects.toThrow('boom');
      await expect(p2).rejects.toThrow('boom');

      const recovery = await failClient.get('/products.json');
      expect(recovery).toEqual({ ok: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('does not coalesce after the first request settles', async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 1 }] }))
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 2 }] }));

      const noCacheClient = new HttpClient({
        accessToken: 'tk',
        baseUrl: 'https://api.bsale.io/v1',
        cacheTtlMs: 0,
        maxRetries: 0,
      });

      await noCacheClient.get('/products.json');
      await noCacheClient.get('/products.json');

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('AbortSignal', () => {
    it('throws immediately if the signal is already aborted', async () => {
      const ac = new AbortController();
      ac.abort();

      await expect(
        client.get('/products.json', undefined, { signal: ac.signal }),
      ).rejects.toMatchObject({ name: 'AbortError' });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('aborts the underlying fetch and does not retry on user abort', async () => {
      const noRetryClient = new HttpClient({
        accessToken: 'tk',
        baseUrl: 'https://api.bsale.io/v1',
        maxRetries: 3,
      });

      mockFetch.mockImplementationOnce(
        (_url, init: RequestInit) =>
          new Promise<Response>((_, reject) => {
            (init.signal as AbortSignal).addEventListener('abort', () => {
              const err = new Error('aborted');
              err.name = 'AbortError';
              reject(err);
            });
          }),
      );

      const ac = new AbortController();
      const promise = noRetryClient.get('/products.json', undefined, { signal: ac.signal });

      await new Promise((r) => setTimeout(r, 10));
      ac.abort();

      await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('still applies timeout when no user signal is provided', async () => {
      const fastTimeoutClient = new HttpClient({
        accessToken: 'tk',
        baseUrl: 'https://api.bsale.io/v1',
        timeout: 50,
        maxRetries: 0,
      });

      mockFetch.mockImplementationOnce(
        (_url, init: RequestInit) =>
          new Promise<Response>((_, reject) => {
            (init.signal as AbortSignal).addEventListener('abort', () => {
              const err = new Error('aborted');
              err.name = 'AbortError';
              reject(err);
            });
          }),
      );

      await expect(fastTimeoutClient.get('/products.json')).rejects.toThrow(/timed out/);
    });

    it('lets a coalesced caller bail without cancelling the shared fetch', async () => {
      let resolveFetch: ((value: Response) => void) | undefined;
      mockFetch.mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          }),
      );

      const firstCaller = client.get('/products.json');
      const ac = new AbortController();
      const dedupedCaller = client.get('/products.json', undefined, { signal: ac.signal });

      ac.abort();

      await expect(dedupedCaller).rejects.toMatchObject({ name: 'AbortError' });

      resolveFetch?.(jsonResponse({ items: [{ id: 1 }] }));
      const result = await firstCaller;
      expect(result).toEqual({ items: [{ id: 1 }] });
      expect(mockFetch).toHaveBeenCalledOnce();
    });
  });

  describe('skipCache', () => {
    it('bypasses cache hits when skipCache=true', async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 1 }] }))
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 2 }] }));

      await client.get('/products.json');
      const fresh = await client.get('/products.json', undefined, { skipCache: true });

      expect(fresh).toEqual({ items: [{ id: 2 }] });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('does not write to cache when skipCache=true', async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 1 }] }))
        .mockResolvedValueOnce(jsonResponse({ items: [{ id: 2 }] }));

      await client.get('/products.json', undefined, { skipCache: true });
      const second = await client.get('/products.json');

      expect(second).toEqual({ items: [{ id: 2 }] });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('does not coalesce when skipCache=true', async () => {
      let resolveA: ((value: Response) => void) | undefined;
      let resolveB: ((value: Response) => void) | undefined;
      mockFetch
        .mockImplementationOnce(
          () =>
            new Promise<Response>((r) => {
              resolveA = r;
            }),
        )
        .mockImplementationOnce(
          () =>
            new Promise<Response>((r) => {
              resolveB = r;
            }),
        );

      const a = client.get('/products.json', undefined, { skipCache: true });
      const b = client.get('/products.json', undefined, { skipCache: true });

      expect(mockFetch).toHaveBeenCalledTimes(2);

      resolveA?.(jsonResponse({ id: 'a' }));
      resolveB?.(jsonResponse({ id: 'b' }));

      const [ra, rb] = await Promise.all([a, b]);
      expect(ra).toEqual({ id: 'a' });
      expect(rb).toEqual({ id: 'b' });
    });
  });

  describe('per-resource TTL', () => {
    it('uses cacheTtlByResource when path matches, falls back otherwise', async () => {
      vi.useFakeTimers();
      try {
        const ttlClient = new HttpClient({
          accessToken: 'tk',
          baseUrl: 'https://api.bsale.io/v1',
          cacheTtlMs: 60_000,
          cacheTtlByResource: { stocks: 100 },
          maxRetries: 0,
        });

        mockFetch
          .mockResolvedValueOnce(jsonResponse({ items: [{ id: 1 }] }))
          .mockResolvedValueOnce(jsonResponse({ items: [{ id: 1 }] }))
          .mockResolvedValueOnce(jsonResponse({ items: [{ id: 'p' }] }));

        await ttlClient.get('/stocks.json');
        await vi.advanceTimersByTimeAsync(150);
        await ttlClient.get('/stocks.json');

        expect(mockFetch).toHaveBeenCalledTimes(2);

        await ttlClient.get('/products.json');
        await vi.advanceTimersByTimeAsync(150);
        await ttlClient.get('/products.json');

        expect(mockFetch).toHaveBeenCalledTimes(3);
      } finally {
        vi.useRealTimers();
      }
    });

    it('matches the first segment, ignoring version prefix', async () => {
      vi.useFakeTimers();
      try {
        const ttlClient = new HttpClient({
          accessToken: 'tk',
          baseUrl: 'https://api.bsale.io/v1',
          cacheTtlMs: 60_000,
          cacheTtlByResource: { products: 100 },
          maxRetries: 0,
        });

        mockFetch
          .mockResolvedValueOnce(jsonResponse({ id: 1 }))
          .mockResolvedValueOnce(jsonResponse({ id: 2 }));

        await ttlClient.get('/v2/products/pack.json');
        await vi.advanceTimersByTimeAsync(150);
        await ttlClient.get('/v2/products/pack.json');

        expect(mockFetch).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
