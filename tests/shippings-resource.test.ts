import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ShippingsResource } from '../src/resources/shippings.resource';
import { HttpClient } from '../src/client/http-client';

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
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
