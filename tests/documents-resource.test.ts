import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DocumentsResource } from '../src/resources/documents.resource';
import { HttpClient } from '../src/client/http-client';
import type { BsaleDocumentDetailItem } from '../src/types';

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeDetailItem(id: number): BsaleDocumentDetailItem {
  return {
    id,
    lineNumber: 0,
    quantity: 1,
    netUnitValue: 1000,
    totalUnitValue: 1190,
    netAmount: 1000,
    taxAmount: 190,
    totalAmount: 1190,
    href: `https://api.bsale.io/v1/documents/100/details/${id}.json`,
  };
}

function makeDetailItems(start: number, count: number): BsaleDocumentDetailItem[] {
  return Array.from({ length: count }, (_, i) => makeDetailItem(start + i));
}

function makeDocument(id: number, embeddedDetails?: unknown): Record<string, unknown> {
  return {
    href: `https://api.bsale.io/v1/documents/${id}.json`,
    id,
    emissionDate: 1700000000,
    expirationDate: 1700000000,
    generationDate: 1700000000,
    number: 1,
    totalAmount: 1190,
    netAmount: 1000,
    taxAmount: 190,
    exemptAmount: 0,
    state: 0,
    details: embeddedDetails ?? { href: `https://api.bsale.io/v1/documents/${id}/details.json` },
  };
}

describe('DocumentsResource.getWithDetails', () => {
  let documents: DocumentsResource;
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
    const http = new HttpClient({
      accessToken: 'test-token',
      cacheTtlMs: 0,
      maxRetries: 0,
    });
    documents = new DocumentsResource(http);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does 1 request when document has ≤ 25 details (no next in embedded)', async () => {
    const items = makeDetailItems(1, 10);
    const doc = makeDocument(100, {
      href: 'https://api.bsale.io/v1/documents/100/details.json',
      count: 10,
      limit: 25,
      offset: 0,
      items,
    });
    mockFetch.mockResolvedValueOnce(jsonResponse(doc));

    const result = await documents.getWithDetails(100);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.details).toHaveLength(10);
    expect(result.details[0].id).toBe(1);
    expect(result.details[9].id).toBe(10);
    expect(result.document.id).toBe(100);

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/documents/100.json');
    expect(url).toContain('expand=details');
  });

  it('does 1 request when document has exactly 25 details and no next is present', async () => {
    const items = makeDetailItems(1, 25);
    const doc = makeDocument(100, {
      href: 'https://api.bsale.io/v1/documents/100/details.json',
      count: 25,
      limit: 25,
      offset: 0,
      items,
    });
    mockFetch.mockResolvedValueOnce(jsonResponse(doc));

    const result = await documents.getWithDetails(100);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.details).toHaveLength(25);
  });

  it('does 2 requests when document has 35 details (1 expand + 1 paginated tail)', async () => {
    const firstPage = makeDetailItems(1, 25);
    const tail = makeDetailItems(26, 10);
    const doc = makeDocument(100, {
      href: 'https://api.bsale.io/v1/documents/100/details.json',
      count: 35,
      limit: 25,
      offset: 0,
      items: firstPage,
      next: 'https://api.bsale.io/v1/documents/100/details.json?limit=25&offset=25',
    });
    const tailResponse = {
      href: 'https://api.bsale.io/v1/documents/100/details.json',
      count: 35,
      limit: 50,
      offset: 25,
      items: tail,
    };

    mockFetch
      .mockResolvedValueOnce(jsonResponse(doc))
      .mockResolvedValueOnce(jsonResponse(tailResponse));

    const result = await documents.getWithDetails(100);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.details).toHaveLength(35);
    expect(result.details[0].id).toBe(1);
    expect(result.details[34].id).toBe(35);

    const [tailUrl] = mockFetch.mock.calls[1];
    expect(tailUrl).toContain('/documents/100/details.json');
    expect(tailUrl).toContain('limit=50');
    expect(tailUrl).toContain('offset=25');
  });

  it('does 3 requests when document has 120 details', async () => {
    const firstPage = makeDetailItems(1, 25);
    const secondPage = makeDetailItems(26, 50);
    const thirdPage = makeDetailItems(76, 45);

    const doc = makeDocument(100, {
      href: 'https://api.bsale.io/v1/documents/100/details.json',
      count: 120,
      limit: 25,
      offset: 0,
      items: firstPage,
      next: 'https://api.bsale.io/v1/documents/100/details.json?limit=25&offset=25',
    });
    const secondResponse = {
      href: 'https://api.bsale.io/v1/documents/100/details.json',
      count: 120,
      limit: 50,
      offset: 25,
      items: secondPage,
      next: 'https://api.bsale.io/v1/documents/100/details.json?limit=50&offset=75',
    };
    const thirdResponse = {
      href: 'https://api.bsale.io/v1/documents/100/details.json',
      count: 120,
      limit: 50,
      offset: 75,
      items: thirdPage,
    };

    mockFetch
      .mockResolvedValueOnce(jsonResponse(doc))
      .mockResolvedValueOnce(jsonResponse(secondResponse))
      .mockResolvedValueOnce(jsonResponse(thirdResponse));

    const result = await documents.getWithDetails(100);

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(result.details).toHaveLength(120);
    expect(result.details[119].id).toBe(120);

    const [secondUrl] = mockFetch.mock.calls[1];
    const [thirdUrl] = mockFetch.mock.calls[2];
    expect(secondUrl).toContain('offset=25');
    expect(thirdUrl).toContain('offset=75');
  });

  it('passes extra expand fields alongside details', async () => {
    const doc = makeDocument(100, {
      href: 'https://api.bsale.io/v1/documents/100/details.json',
      count: 1,
      limit: 25,
      offset: 0,
      items: [makeDetailItem(1)],
    });
    mockFetch.mockResolvedValueOnce(jsonResponse(doc));

    await documents.getWithDetails(100, { expand: ['user', 'client'] });

    const [url] = mockFetch.mock.calls[0];
    const expandParam = decodeURIComponent(url.split('expand=')[1]);
    expect(expandParam).toBe('details,user,client');
  });

  it('throws AbortError when signal aborts before the loop runs', async () => {
    const firstPage = makeDetailItems(1, 25);
    const doc = makeDocument(100, {
      href: 'https://api.bsale.io/v1/documents/100/details.json',
      count: 50,
      limit: 25,
      offset: 0,
      items: firstPage,
      next: 'https://api.bsale.io/v1/documents/100/details.json?limit=25&offset=25',
    });
    mockFetch.mockResolvedValueOnce(jsonResponse(doc));

    const ac = new AbortController();
    ac.abort();

    let caught: unknown;
    try {
      await documents.getWithDetails(100, { signal: ac.signal });
    } catch (e) {
      caught = e;
    }

    expect((caught as Error)?.name).toBe('AbortError');
  });

  it('handles document with no embedded details (defensive: count=0)', async () => {
    const doc = makeDocument(100, {
      href: 'https://api.bsale.io/v1/documents/100/details.json',
      count: 0,
      limit: 25,
      offset: 0,
      items: [],
    });
    mockFetch.mockResolvedValueOnce(jsonResponse(doc));

    const result = await documents.getWithDetails(100);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.details).toEqual([]);
  });

  it('falls back to fetching from offset=0 when expand returns just the href stub', async () => {
    const doc = makeDocument(100);
    const fullPage = {
      href: 'https://api.bsale.io/v1/documents/100/details.json',
      count: 3,
      limit: 50,
      offset: 0,
      items: makeDetailItems(1, 3),
    };

    mockFetch
      .mockResolvedValueOnce(jsonResponse(doc))
      .mockResolvedValueOnce(jsonResponse(fullPage));

    const result = await documents.getWithDetails(100);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.details).toHaveLength(3);
    const [tailUrl] = mockFetch.mock.calls[1];
    expect(tailUrl).toContain('offset=0');
    expect(tailUrl).toContain('limit=50');
  });
});
