import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ShippingsResource } from '../src/resources/shippings.resource';
import { HttpClient } from '../src/client/http-client';
import type { BsaleShippingDetail } from '../src/types';

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeDetailItem(id: number): BsaleShippingDetail {
  return {
    id,
    quantity: 1,
    variantStock: 0,
    variantCost: 0,
    variant: { id: 1, href: 'https://api.bsale.io/v1/variants/1.json' },
    href: `https://api.bsale.io/v1/shippings/100/details/${id}.json`,
  };
}

function makeDetailItems(start: number, count: number): BsaleShippingDetail[] {
  return Array.from({ length: count }, (_, i) => makeDetailItem(start + i));
}

function makeShipping(id: number, embeddedDetails?: unknown): Record<string, unknown> {
  return {
    href: `https://api.bsale.io/v1/shippings/${id}.json`,
    id,
    shippingDate: 1700000000,
    state: 0,
    details: embeddedDetails ?? { href: `https://api.bsale.io/v1/shippings/${id}/details.json` },
  };
}

describe('ShippingsResource.listByDocument', () => {
  let shippings: ShippingsResource;
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
    const http = new HttpClient({
      accessToken: 'test-token',
      cacheTtlMs: 0,
      maxRetries: 0,
    });
    shippings = new ShippingsResource(http);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hits /shippings.json with the documentid filter', async () => {
    const responseData = { count: 1, limit: 25, offset: 0, items: [{ id: 7 }] };
    mockFetch.mockResolvedValueOnce(jsonResponse(responseData));

    const result = await shippings.listByDocument(824738);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/shippings.json');
    expect(url).toContain('documentid=824738');
    expect(result.items).toHaveLength(1);
  });
});

describe('ShippingsResource.getWithDetails', () => {
  let shippings: ShippingsResource;
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
    const http = new HttpClient({
      accessToken: 'test-token',
      cacheTtlMs: 0,
      maxRetries: 0,
    });
    shippings = new ShippingsResource(http);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does 1 request when the shipping has ≤ 25 details (no next in embedded)', async () => {
    const items = makeDetailItems(1, 10);
    const shipping = makeShipping(100, {
      href: 'https://api.bsale.io/v1/shippings/100/details.json',
      count: 10,
      limit: 25,
      offset: 0,
      items,
    });
    mockFetch.mockResolvedValueOnce(jsonResponse(shipping));

    const result = await shippings.getWithDetails(100);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.details).toHaveLength(10);
    expect(result.details[0].id).toBe(1);
    expect(result.shipping.id).toBe(100);

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/shippings/100.json');
    expect(url).toContain('expand=details');
  });

  it('paginates the tail: 32 details (25 embedded + 7 from offset=25)', async () => {
    const firstPage = makeDetailItems(1, 25);
    const tail = makeDetailItems(26, 7);
    const shipping = makeShipping(100, {
      href: 'https://api.bsale.io/v1/shippings/100/details.json',
      count: 32,
      limit: 25,
      offset: 0,
      items: firstPage,
      next: 'https://api.bsale.io/v1/shippings/100/details.json?limit=25&offset=25',
    });
    const tailResponse = {
      href: 'https://api.bsale.io/v1/shippings/100/details.json',
      count: 32,
      limit: 50,
      offset: 25,
      items: tail,
      next: null,
    };

    mockFetch
      .mockResolvedValueOnce(jsonResponse(shipping))
      .mockResolvedValueOnce(jsonResponse(tailResponse));

    const result = await shippings.getWithDetails(100);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.details).toHaveLength(32);
    expect(result.details[0].id).toBe(1);
    expect(result.details[31].id).toBe(32);

    const [tailUrl] = mockFetch.mock.calls[1];
    expect(tailUrl).toContain('/shippings/100/details.json');
    expect(tailUrl).toContain('limit=50');
    expect(tailUrl).toContain('offset=25');
  });

  it('passes extra expand fields alongside details', async () => {
    const shipping = makeShipping(100, {
      href: 'https://api.bsale.io/v1/shippings/100/details.json',
      count: 1,
      limit: 25,
      offset: 0,
      items: [makeDetailItem(1)],
    });
    mockFetch.mockResolvedValueOnce(jsonResponse(shipping));

    await shippings.getWithDetails(100, { expand: ['guide'] });

    const [url] = mockFetch.mock.calls[0];
    const expandParam = decodeURIComponent(url.split('expand=')[1]);
    expect(expandParam).toBe('details,guide');
  });

  it('throws AbortError when signal aborts before the loop runs', async () => {
    const shipping = makeShipping(100, {
      href: 'https://api.bsale.io/v1/shippings/100/details.json',
      count: 50,
      limit: 25,
      offset: 0,
      items: makeDetailItems(1, 25),
      next: 'https://api.bsale.io/v1/shippings/100/details.json?limit=25&offset=25',
    });
    mockFetch.mockResolvedValueOnce(jsonResponse(shipping));

    const ac = new AbortController();
    ac.abort();

    let caught: unknown;
    try {
      await shippings.getWithDetails(100, { signal: ac.signal });
    } catch (e) {
      caught = e;
    }

    expect((caught as Error)?.name).toBe('AbortError');
  });

  it('falls back to fetching from offset=0 when expand returns just the href stub', async () => {
    const shipping = makeShipping(100);
    const fullPage = {
      href: 'https://api.bsale.io/v1/shippings/100/details.json',
      count: 3,
      limit: 50,
      offset: 0,
      items: makeDetailItems(1, 3),
    };

    mockFetch
      .mockResolvedValueOnce(jsonResponse(shipping))
      .mockResolvedValueOnce(jsonResponse(fullPage));

    const result = await shippings.getWithDetails(100);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.details).toHaveLength(3);
    const [tailUrl] = mockFetch.mock.calls[1];
    expect(tailUrl).toContain('offset=0');
    expect(tailUrl).toContain('limit=50');
  });
});
