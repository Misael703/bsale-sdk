import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaseResource } from '../src/resources/base.resource';
import { HttpClient } from '../src/client/http-client';

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface TestItem {
  id: number;
  name: string;
}

class TestResource extends BaseResource<TestItem> {
  protected readonly path = 'test_items';
}

describe('BaseResource', () => {
  let resource: TestResource;
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
    const http = new HttpClient({
      accessToken: 'test-token',
      cacheTtlMs: 0,
      maxRetries: 0,
    });
    resource = new TestResource(http);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('list', () => {
    it('should call the correct path', async () => {
      const responseData = { count: 1, limit: 25, offset: 0, items: [{ id: 1, name: 'A' }] };
      mockFetch.mockResolvedValueOnce(jsonResponse(responseData));

      const result = await resource.list();

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/test_items.json');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('A');
    });

    it('should pass query parameters', async () => {
      const responseData = { count: 0, limit: 10, offset: 0, items: [] };
      mockFetch.mockResolvedValueOnce(jsonResponse(responseData));

      await resource.list({ limit: 10, state: 0 });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('limit=10');
      expect(url).toContain('state=0');
    });
  });

  describe('listAll', () => {
    it('should iterate through all pages', async () => {
      const page1 = {
        count: 3,
        limit: 2,
        offset: 0,
        items: [
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
        ],
        next: 'https://api.bsale.io/v1/test_items.json?limit=2&offset=2',
      };
      const page2 = {
        count: 3,
        limit: 2,
        offset: 2,
        items: [{ id: 3, name: 'C' }],
      };

      mockFetch
        .mockResolvedValueOnce(jsonResponse(page1))
        .mockResolvedValueOnce(jsonResponse(page2));

      const items = await resource.listAll({}, { pageSize: 2 });

      expect(items).toHaveLength(3);
      expect(items[2].name).toBe('C');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should respect maxItems option', async () => {
      const page1 = {
        count: 100,
        limit: 50,
        offset: 0,
        items: Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` })),
        next: 'https://api.bsale.io/v1/test_items.json?limit=50&offset=50',
      };

      mockFetch.mockResolvedValueOnce(jsonResponse(page1));

      const items = await resource.listAll({}, { maxItems: 10 });

      expect(items).toHaveLength(10);
      expect(mockFetch).toHaveBeenCalledOnce();
    });
  });

  describe('getById', () => {
    it('should build the correct path with ID', async () => {
      const responseData = { id: 42, name: 'Test' };
      mockFetch.mockResolvedValueOnce(jsonResponse(responseData));

      const result = await resource.getById(42);

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/test_items/42.json');
      expect(result.id).toBe(42);
    });

    it('should pass expand parameter', async () => {
      const responseData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValueOnce(jsonResponse(responseData));

      await resource.getById(1, { expand: 'details' });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('expand=details');
    });
  });

  describe('count', () => {
    it('should call the count endpoint', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ count: 42 }));

      const result = await resource.count();

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/test_items/count.json');
      expect(result.count).toBe(42);
    });
  });
});
