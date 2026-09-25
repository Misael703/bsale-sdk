import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BsaleRateLimiter } from '../src/client/rate-limiter';
import { HttpClient } from '../src/client/http-client';
import { BsaleClient } from '../src/client/bsale-client';

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Adquiere un token por el mismo camino que HttpClient: fast path y, si no, cola. */
function take(limiter: BsaleRateLimiter, priority: 'high' | 'low' = 'high'): Promise<void> {
  return limiter.tryAcquire() ? Promise.resolve() : limiter.acquire(priority);
}

describe('BsaleRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deja salir `burst` requests de inmediato y luego una cada 1/rate segundos', async () => {
    const limiter = new BsaleRateLimiter({ requestsPerSecond: 8 });
    const granted: number[] = [];
    const start = Date.now();

    const all = Array.from({ length: 16 }, () =>
      take(limiter).then(() => granted.push(Date.now() - start)),
    );

    await vi.advanceTimersByTimeAsync(0);
    expect(granted).toHaveLength(8);
    expect(limiter.pending).toBe(8);

    await vi.advanceTimersByTimeAsync(124);
    expect(granted).toHaveLength(8);
    await vi.advanceTimersByTimeAsync(1);
    expect(granted).toHaveLength(9);

    await vi.advanceTimersByTimeAsync(1000);
    await Promise.all(all);
    expect(granted).toHaveLength(16);
    // 8 en ráfaga + 8 repuestos a 125 ms cada uno: el último sale a t = 1000 ms.
    expect(granted.slice(8)).toEqual([125, 250, 375, 500, 625, 750, 875, 1000]);
    expect(limiter.pending).toBe(0);
  });

  it('respeta un burst menor que el rate', async () => {
    const limiter = new BsaleRateLimiter({ requestsPerSecond: 10, burst: 2 });
    let granted = 0;
    for (let i = 0; i < 4; i++) void take(limiter).then(() => granted++);

    await vi.advanceTimersByTimeAsync(0);
    expect(granted).toBe(2);
    await vi.advanceTimersByTimeAsync(100);
    expect(granted).toBe(3);
    await vi.advanceTimersByTimeAsync(100);
    expect(granted).toBe(4);
  });

  it('atiende el carril high antes que low aunque low haya llegado primero', async () => {
    const limiter = new BsaleRateLimiter({ requestsPerSecond: 10, burst: 1 });
    const order: string[] = [];

    await take(limiter); // vacía el bucket
    const lows = ['low-1', 'low-2'].map((name) =>
      take(limiter, 'low').then(() => order.push(name)),
    );
    const highs = ['high-1', 'high-2'].map((name) =>
      take(limiter, 'high').then(() => order.push(name)),
    );

    await vi.advanceTimersByTimeAsync(400);
    await Promise.all([...lows, ...highs]);
    expect(order).toEqual(['high-1', 'high-2', 'low-1', 'low-2']);
  });

  it('un high que llega con tokens libres no pasa por delante de nadie si no hay cola', () => {
    const limiter = new BsaleRateLimiter({ requestsPerSecond: 8 });
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.pending).toBe(0);
  });

  it('tryAcquire devuelve false si hay requests en cola, aunque se hayan repuesto tokens', async () => {
    const limiter = new BsaleRateLimiter({ requestsPerSecond: 10, burst: 1 });
    await take(limiter);
    const queued = limiter.acquire('low');
    expect(limiter.pending).toBe(1);
    expect(limiter.tryAcquire()).toBe(false);
    await vi.advanceTimersByTimeAsync(100);
    await queued;
  });

  it('saca de la cola y rechaza con la razón del abort', async () => {
    const limiter = new BsaleRateLimiter({ requestsPerSecond: 10, burst: 1 });
    await take(limiter);

    const controller = new AbortController();
    const aborted = limiter.acquire('low', controller.signal);
    const next = limiter.acquire('low');
    expect(limiter.pending).toBe(2);

    controller.abort(new Error('cancelled by caller'));
    await expect(aborted).rejects.toThrow('cancelled by caller');
    expect(limiter.pending).toBe(1);

    await vi.advanceTimersByTimeAsync(100);
    await expect(next).resolves.toBeUndefined();
  });

  it('rechaza de inmediato con un signal ya abortado', async () => {
    const limiter = new BsaleRateLimiter();
    const controller = new AbortController();
    controller.abort();
    await expect(limiter.acquire('high', controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });

  it('valida las opciones', () => {
    expect(() => new BsaleRateLimiter({ requestsPerSecond: 0 })).toThrow(RangeError);
    expect(() => new BsaleRateLimiter({ requestsPerSecond: Number.NaN })).toThrow(RangeError);
    expect(() => new BsaleRateLimiter({ burst: 0.5 })).toThrow(RangeError);
  });
});

describe('HttpClient + BsaleRateLimiter', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch.mockReset();
    mockFetch.mockImplementation(() => Promise.resolve(jsonResponse({ ok: true })));
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('limita a 8 req/s por defecto', async () => {
    const client = new HttpClient({ accessToken: 'tk', cacheTtlMs: 0 });
    const requests = Array.from({ length: 10 }, (_, i) =>
      client.get(`/products/${i}.json`, undefined, { skipCache: true }),
    );

    await vi.advanceTimersByTimeAsync(0);
    expect(mockFetch).toHaveBeenCalledTimes(8);
    await vi.advanceTimersByTimeAsync(250);
    await Promise.all(requests);
    expect(mockFetch).toHaveBeenCalledTimes(10);
  });

  it('`rateLimit: false` no limita', async () => {
    const client = new HttpClient({ accessToken: 'tk', cacheTtlMs: 0, rateLimit: false });
    const requests = Array.from({ length: 20 }, (_, i) =>
      client.get(`/products/${i}.json`, undefined, { skipCache: true }),
    );
    await vi.advanceTimersByTimeAsync(0);
    expect(mockFetch).toHaveBeenCalledTimes(20);
    await Promise.all(requests);
  });

  it('los hits de cache no consumen tokens', async () => {
    const limiter = new BsaleRateLimiter({ requestsPerSecond: 1, burst: 1 });
    const client = new HttpClient({ accessToken: 'tk', cacheTtlMs: 60_000, rateLimit: limiter });

    await client.get('/products.json');
    await client.get('/products.json');
    await client.get('/products.json');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(limiter.pending).toBe(0);
  });

  it('una request de sync `low` cede el paso a una `high` que llega después', async () => {
    const limiter = new BsaleRateLimiter({ requestsPerSecond: 10, burst: 1 });
    const client = new HttpClient({ accessToken: 'tk', cacheTtlMs: 0, rateLimit: limiter });
    const opts = { skipCache: true } as const;

    const first = client.get('/variants.json?offset=0', undefined, { ...opts, priority: 'low' });
    const syncPage = client.get('/variants.json?offset=50', undefined, {
      ...opts,
      priority: 'low',
    });
    const emission = client.get('/documents/1.json', undefined, { ...opts, priority: 'high' });

    await vi.advanceTimersByTimeAsync(300);
    await Promise.all([first, syncPage, emission]);

    const urls = mockFetch.mock.calls.map(([url]) => String(url));
    expect(urls).toEqual([
      'https://api.bsale.io/v1/variants.json?offset=0',
      'https://api.bsale.io/v1/documents/1.json',
      'https://api.bsale.io/v1/variants.json?offset=50',
    ]);
  });

  it('cada retry consume un token', async () => {
    const limiter = new BsaleRateLimiter({ requestsPerSecond: 1, burst: 1 });
    const client = new HttpClient({
      accessToken: 'tk',
      cacheTtlMs: 0,
      maxRetries: 1,
      rateLimit: limiter,
    });
    mockFetch
      .mockResolvedValueOnce(new Response('{}', { status: 429, headers: { 'Retry-After': '0' } }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const promise = client.get('/products.json');
    await vi.advanceTimersByTimeAsync(0);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(999);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await expect(promise).resolves.toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('la espera en cola no consume el timeout del intento', async () => {
    const limiter = new BsaleRateLimiter({ requestsPerSecond: 1, burst: 1 });
    const client = new HttpClient({
      accessToken: 'tk',
      cacheTtlMs: 0,
      timeout: 500,
      maxRetries: 0,
      rateLimit: limiter,
    });

    await client.get('/a.json');
    const queued = client.get('/b.json');
    await vi.advanceTimersByTimeAsync(1000);
    await expect(queued).resolves.toEqual({ ok: true });
  });

  it('un abort mientras espera en cola rechaza sin hacer fetch', async () => {
    const limiter = new BsaleRateLimiter({ requestsPerSecond: 1, burst: 1 });
    const client = new HttpClient({ accessToken: 'tk', cacheTtlMs: 0, rateLimit: limiter });
    await client.get('/a.json');

    const controller = new AbortController();
    const queued = client.get('/b.json', undefined, { signal: controller.signal });
    controller.abort();
    await expect(queued).rejects.toMatchObject({ name: 'AbortError' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe('BsaleClient + BsaleRateLimiter', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch.mockReset();
    mockFetch.mockImplementation(() => Promise.resolve(jsonResponse({ count: 0, items: [] })));
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('comparte un solo bucket entre los hosts del cliente', async () => {
    const client = new BsaleClient({
      accessToken: 'tk',
      cacheTtlMs: 0,
      rateLimit: { requestsPerSecond: 1, burst: 1 },
    });

    void client.products.list();
    void client.courierOrders.getById(1);
    await vi.advanceTimersByTimeAsync(0);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('una instancia compartida limita a dos clientes con el mismo token', async () => {
    const limiter = new BsaleRateLimiter({ requestsPerSecond: 1, burst: 1 });
    const reader = new BsaleClient({ accessToken: 'tk', cacheTtlMs: 0, rateLimit: limiter });
    const emitter = new BsaleClient({
      accessToken: 'tk',
      cacheTtlMs: 0,
      maxRetries: 0,
      rateLimit: limiter,
    });

    void reader.variants.list();
    void emitter.documents.list();
    await vi.advanceTimersByTimeAsync(0);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('iterate reenvía la prioridad a cada página', async () => {
    const limiter = new BsaleRateLimiter({ requestsPerSecond: 10, burst: 1 });
    const acquire = vi.spyOn(limiter, 'acquire');
    const client = new BsaleClient({ accessToken: 'tk', cacheTtlMs: 0, rateLimit: limiter });
    mockFetch.mockImplementation((url: string) => {
      const offset = Number(new URL(url).searchParams.get('offset'));
      return Promise.resolve(
        jsonResponse({ count: 100, limit: 50, offset, items: Array(50).fill({ id: 1 }) }),
      );
    });

    const done = client.variants.listAll(undefined, { priority: 'low' });
    await vi.advanceTimersByTimeAsync(200);
    await expect(done).resolves.toHaveLength(100);
    // La 1.ª página sale por el fast path; la 2.ª espera un token en el carril low.
    expect(acquire).toHaveBeenCalledWith('low', undefined);
  });
});
