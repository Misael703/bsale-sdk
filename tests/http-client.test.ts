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
});
