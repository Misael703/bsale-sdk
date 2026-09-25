import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaseResource } from '../src/resources/base.resource';
import { HttpClient } from '../src/client/http-client';
import { ProductsResource } from '../src/resources/products.resource';
import type { BsaleListResponse } from '../src/types';

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

  subresource(options?: { readonly embedded?: BsaleListResponse<TestItem> }) {
    return this.paginateSubresource<TestItem>('/test_items/1/details.json', options);
  }
}

function items(from: number, length: number): TestItem[] {
  return Array.from({ length }, (_, i) => ({ id: from + i, name: `Item ${from + i}` }));
}

/**
 * Página de `count` items servida por offset. `shortAt` recorta la página que
 * empieza en ese offset a `shortLength` items, simulando una página corta que
 * no es la última.
 */
function pagedFetch(
  count: number,
  opts: { shortAt?: number; shortLength?: number; omitCount?: boolean } = {},
) {
  return (url: string): Promise<Response> => {
    const params = new URL(url).searchParams;
    const limit = Number(params.get('limit'));
    const offset = Number(params.get('offset'));
    let length = Math.max(0, Math.min(limit, count - offset));
    if (opts.shortAt === offset && opts.shortLength !== undefined) length = opts.shortLength;
    const hasMore = offset + length < count;
    const page: Partial<BsaleListResponse<TestItem>> = {
      limit,
      offset,
      items: items(offset + 1, length),
      next: hasMore
        ? `https://api.bsale.io/v1/test_items.json?offset=${offset + limit}`
        : undefined,
    };
    if (!opts.omitCount) Object.assign(page, { count });
    return Promise.resolve(jsonResponse(page));
  };
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

  describe('iterate', () => {
    it('yields items lazily across pages', async () => {
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
      const page2 = { count: 3, limit: 2, offset: 2, items: [{ id: 3, name: 'C' }] };

      mockFetch
        .mockResolvedValueOnce(jsonResponse(page1))
        .mockResolvedValueOnce(jsonResponse(page2));

      const collected: TestItem[] = [];
      for await (const item of resource.iterate({}, { pageSize: 2 })) {
        collected.push(item);
      }

      expect(collected).toHaveLength(3);
      expect(collected.map((i) => i.id)).toEqual([1, 2, 3]);
    });

    it('stops fetching new pages once consumer breaks', async () => {
      const page1 = {
        count: 100,
        limit: 50,
        offset: 0,
        items: Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` })),
        next: 'https://api.bsale.io/v1/test_items.json?limit=50&offset=50',
      };

      mockFetch.mockResolvedValueOnce(jsonResponse(page1));

      const collected: TestItem[] = [];
      for await (const item of resource.iterate()) {
        collected.push(item);
        if (collected.length === 5) break;
      }

      expect(collected).toHaveLength(5);
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it('respects maxItems', async () => {
      const page1 = {
        count: 100,
        limit: 50,
        offset: 0,
        items: Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` })),
        next: 'https://api.bsale.io/v1/test_items.json?limit=50&offset=50',
      };

      mockFetch.mockResolvedValueOnce(jsonResponse(page1));

      const collected: TestItem[] = [];
      for await (const item of resource.iterate({}, { maxItems: 3 })) {
        collected.push(item);
      }

      expect(collected).toHaveLength(3);
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it('aborts when signal is triggered between pages', async () => {
      const page1 = {
        count: 4,
        limit: 2,
        offset: 0,
        items: [
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
        ],
        next: 'https://api.bsale.io/v1/test_items.json?limit=2&offset=2',
      };

      mockFetch.mockResolvedValueOnce(jsonResponse(page1));

      const ac = new AbortController();
      const collected: TestItem[] = [];
      let caught: unknown;

      try {
        for await (const item of resource.iterate({}, { pageSize: 2, signal: ac.signal })) {
          collected.push(item);
          if (collected.length === 2) ac.abort();
        }
      } catch (e) {
        caught = e;
      }

      expect(collected).toHaveLength(2);
      expect((caught as Error)?.name).toBe('AbortError');
    });
  });

  describe('terminación por count', () => {
    it('iterate sigue tras una página corta que no es la última', async () => {
      mockFetch.mockImplementation(pagedFetch(120, { shortAt: 50, shortLength: 30 }));

      const collected: TestItem[] = [];
      for await (const item of resource.iterate()) collected.push(item);

      // offset 0 → 50 items; offset 50 → 30 (corta); offset 80 → 40; 120 ≥ count.
      expect(collected.map((i) => i.id)).toEqual(items(1, 120).map((i) => i.id));
      const offsets = mockFetch.mock.calls.map(([url]) => new URL(url).searchParams.get('offset'));
      expect(offsets).toEqual(['0', '50', '80']);
    });

    it('listAll sigue tras una página corta que no es la última', async () => {
      mockFetch.mockImplementation(pagedFetch(75, { shortAt: 0, shortLength: 10 }));

      const all = await resource.listAll();

      expect(all).toHaveLength(75);
      expect(new Set(all.map((i) => i.id)).size).toBe(75);
    });

    it('termina cuando el offset alcanza count, sin pedir una página de más', async () => {
      mockFetch.mockImplementation(pagedFetch(100));

      const all = await resource.listAll();

      expect(all).toHaveLength(100);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('termina con una página vacía aunque count prometa más', async () => {
      mockFetch
        .mockResolvedValueOnce(
          jsonResponse({ count: 200, limit: 50, offset: 0, items: items(1, 50) }),
        )
        .mockResolvedValueOnce(jsonResponse({ count: 200, limit: 50, offset: 50, items: [] }));

      const all = await resource.listAll();

      expect(all).toHaveLength(50);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('relee count en cada página si cambia durante el recorrido', async () => {
      mockFetch
        .mockResolvedValueOnce(
          jsonResponse({ count: 60, limit: 50, offset: 0, items: items(1, 50) }),
        )
        .mockResolvedValueOnce(jsonResponse({ count: 50, limit: 50, offset: 50, items: [] }));

      const all = await resource.listAll();
      expect(all).toHaveLength(50);
    });

    it('sin count en la respuesta cae al criterio de página corta', async () => {
      mockFetch.mockImplementation(pagedFetch(70, { omitCount: true }));

      const all = await resource.listAll();

      expect(all).toHaveLength(70);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('paginateSubresource sigue tras una página corta que no es la última', async () => {
      mockFetch.mockImplementation(pagedFetch(90, { shortAt: 0, shortLength: 20 }));

      const all = await resource.subresource();

      expect(all).toHaveLength(90);
    });

    it('paginateSubresource continúa desde la página embebida', async () => {
      mockFetch.mockImplementation(pagedFetch(40));
      const embedded = { count: 40, limit: 25, offset: 0, items: items(1, 25) };

      const all = await resource.subresource({ embedded });

      expect(all.map((i) => i.id)).toEqual(items(1, 40).map((i) => i.id));
      const [url] = mockFetch.mock.calls[0];
      expect(new URL(url).searchParams.get('offset')).toBe('25');
    });
  });

  describe('opciones de request en la paginación', () => {
    it('iterate reenvía skipCache: cada corrida vuelve a pedir las páginas', async () => {
      const cached = new TestResource(
        new HttpClient({ accessToken: 'tk', cacheTtlMs: 60_000, maxRetries: 0 }),
      );
      mockFetch.mockImplementation(pagedFetch(10));

      await cached.listAll(undefined, { skipCache: true });
      await cached.listAll(undefined, { skipCache: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);

      await cached.listAll();
      await cached.listAll();
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});

describe('ProductsResource.getVariants', () => {
  const mockFetch = vi.fn();
  let products: ProductsResource;

  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockImplementation(() =>
      Promise.resolve(jsonResponse({ count: 0, limit: 50, offset: 0, items: [] })),
    );
    vi.stubGlobal('fetch', mockFetch);
    products = new ProductsResource(
      new HttpClient({ accessToken: 'tk', cacheTtlMs: 60_000, maxRetries: 0 }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('acepta el id de producto como string (variant.product.id)', async () => {
    await products.getVariants('24410', { limit: 50, offset: 0 });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/products/24410/variants.json');
    expect(url).toContain('limit=50');
  });

  it('reenvía skipCache', async () => {
    await products.getVariants(1, undefined, { skipCache: true });
    await products.getVariants(1, undefined, { skipCache: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);

    await products.getVariants(1);
    await products.getVariants(1);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('reenvía signal', async () => {
    const controller = new AbortController();
    controller.abort(new Error('sync cancelled'));

    await expect(products.getVariants(1, undefined, { signal: controller.signal })).rejects.toThrow(
      'sync cancelled',
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
