import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReturnsResource } from '../src/resources/returns.resource';
import { HttpClient } from '../src/client/http-client';

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('ReturnsResource.listByReferenceDocument', () => {
  let returns: ReturnsResource;
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
    const http = new HttpClient({
      accessToken: 'test-token',
      cacheTtlMs: 0,
      maxRetries: 0,
    });
    returns = new ReturnsResource(http);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hits /returns.json with the referencedocumentid filter', async () => {
    const responseData = { count: 1, limit: 25, offset: 0, items: [{ id: 11 }] };
    mockFetch.mockResolvedValueOnce(jsonResponse(responseData));

    const result = await returns.listByReferenceDocument(824738);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/returns.json');
    expect(url).toContain('referencedocumentid=824738');
    expect(result.items).toHaveLength(1);
  });
});
