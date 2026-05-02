import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient } from '../src/client/http-client';
import type { BsaleMiddleware } from '../src/types';

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('HttpClient middlewares', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs middlewares in registration order, wrapping next()', async () => {
    const log: string[] = [];

    const a: BsaleMiddleware = async (_ctx, next) => {
      log.push('a:before');
      const res = await next();
      log.push('a:after');
      return res;
    };
    const b: BsaleMiddleware = async (_ctx, next) => {
      log.push('b:before');
      const res = await next();
      log.push('b:after');
      return res;
    };

    const client = new HttpClient({
      accessToken: 'tk',
      baseUrl: 'https://api.bsale.io/v1',
      cacheTtlMs: 0,
      maxRetries: 0,
      middlewares: [a, b],
    });

    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await client.get('/products.json');

    expect(log).toEqual(['a:before', 'b:before', 'b:after', 'a:after']);
  });

  it('lets a middleware mutate headers before fetch', async () => {
    const stamp: BsaleMiddleware = async (ctx, next) => {
      ctx.headers['X-Trace-Id'] = 'abc-123';
      return next();
    };

    const client = new HttpClient({
      accessToken: 'tk',
      baseUrl: 'https://api.bsale.io/v1',
      cacheTtlMs: 0,
      maxRetries: 0,
      middlewares: [stamp],
    });

    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await client.get('/products.json');

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers['X-Trace-Id']).toBe('abc-123');
    expect(init.headers['access_token']).toBe('tk');
  });

  it('lets a middleware short-circuit and return a synthetic response', async () => {
    const fake: BsaleMiddleware = async () =>
      new Response(JSON.stringify({ items: [{ id: 'fake' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    const client = new HttpClient({
      accessToken: 'tk',
      baseUrl: 'https://api.bsale.io/v1',
      cacheTtlMs: 0,
      maxRetries: 0,
      middlewares: [fake],
    });

    const result = await client.get<{ items: Array<{ id: string }> }>('/products.json');
    expect(result.items[0].id).toBe('fake');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('exposes attempt number to middleware on retries', async () => {
    const attempts: number[] = [];
    const observer: BsaleMiddleware = async (ctx, next) => {
      attempts.push(ctx.attempt);
      return next();
    };

    const client = new HttpClient({
      accessToken: 'tk',
      baseUrl: 'https://api.bsale.io/v1',
      cacheTtlMs: 0,
      maxRetries: 2,
      middlewares: [observer],
    });

    mockFetch
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    await client.get('/products.json');
    expect(attempts).toEqual([0, 1]);
  });

  it('use() registers middlewares post-construction', async () => {
    const client = new HttpClient({
      accessToken: 'tk',
      baseUrl: 'https://api.bsale.io/v1',
      cacheTtlMs: 0,
      maxRetries: 0,
    });

    const log: string[] = [];
    client.use(async (_ctx, next) => {
      log.push('mw');
      return next();
    });

    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await client.get('/products.json');
    expect(log).toEqual(['mw']);
  });
});
