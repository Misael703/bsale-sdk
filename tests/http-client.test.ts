import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient } from '../src/client/http-client';

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
});
