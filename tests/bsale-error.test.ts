import { describe, it, expect } from 'vitest';
import { BsaleApiError } from '../src/errors/bsale.error';

describe('BsaleApiError', () => {
  it('exposes status, path and responseBody', () => {
    const err = new BsaleApiError('boom', 404, { error: 'not found' }, '/products/1.json');
    expect(err.status).toBe(404);
    expect(err.path).toBe('/products/1.json');
    expect(err.responseBody).toEqual({ error: 'not found' });
  });

  it('enriches message with `message` field from body', () => {
    const err = new BsaleApiError(
      'Bsale API error: 400',
      400,
      { message: 'Cliente no encontrado' },
      '/clients/99.json',
    );
    expect(err.message).toContain('Bsale API error: 400');
    expect(err.message).toContain('Cliente no encontrado');
  });

  it('falls back to `error` field when `message` is absent', () => {
    const err = new BsaleApiError('Bsale API error', 400, { error: 'invalid_payload' }, '/p.json');
    expect(err.message).toContain('invalid_payload');
  });

  it('parses code from common variants', () => {
    expect(new BsaleApiError('e', 400, { code: 'ERR_X' }, '/p').code).toBe('ERR_X');
    expect(new BsaleApiError('e', 400, { error_code: 42 }, '/p').code).toBe('42');
    expect(new BsaleApiError('e', 400, { errorCode: 'X' }, '/p').code).toBe('X');
    expect(new BsaleApiError('e', 400, {}, '/p').code).toBeUndefined();
  });

  it('parses details from common variants', () => {
    const arr = [{ field: 'name', message: 'required' }];
    expect(new BsaleApiError('e', 400, { details: arr }, '/p').details).toEqual(arr);
    expect(new BsaleApiError('e', 400, { errors: arr }, '/p').details).toEqual(arr);
    expect(new BsaleApiError('e', 400, { fields: arr }, '/p').details).toEqual(arr);
  });

  it('handles non-object bodies gracefully', () => {
    const err1 = new BsaleApiError('boom', 500, null, '/p');
    expect(err1.code).toBeUndefined();
    expect(err1.details).toBeUndefined();
    expect(err1.message).toBe('boom');

    const err2 = new BsaleApiError('boom', 500, 'plain text', '/p');
    expect(err2.code).toBeUndefined();
  });

  it('classification getters', () => {
    expect(new BsaleApiError('', 429, null, '').isRateLimit).toBe(true);
    expect(new BsaleApiError('', 503, null, '').isServerError).toBe(true);
    expect(new BsaleApiError('', 404, null, '').isNotFound).toBe(true);
    expect(new BsaleApiError('', 400, null, '').isClientError).toBe(true);
    expect(new BsaleApiError('', 429, null, '').isClientError).toBe(false);
    expect(new BsaleApiError('', 500, null, '').isClientError).toBe(false);
  });

  describe('headers y Retry-After', () => {
    it('expone los headers con nombres en minúscula', () => {
      const err = new BsaleApiError(
        '',
        429,
        null,
        '/x.json',
        new Headers({ 'Retry-After': '120' }),
      );
      expect(err.headers['retry-after']).toBe('120');
    });

    it('acepta un objeto plano de headers', () => {
      const err = new BsaleApiError('', 503, null, '/x.json', { 'X-Request-Id': 'abc' });
      expect(err.headers).toEqual({ 'x-request-id': 'abc' });
    });

    it('sin headers expone un objeto vacío y retryAfterMs undefined', () => {
      const err = new BsaleApiError('', 500, null, '/x.json');
      expect(err.headers).toEqual({});
      expect(err.retryAfterMs).toBeUndefined();
    });

    it('retryAfterMs parsea delta-seconds sin recortar', () => {
      const err = new BsaleApiError('', 429, null, '', { 'retry-after': '300' });
      expect(err.retryAfterMs).toBe(300_000);
    });

    it('retryAfterMs parsea una HTTP-date', () => {
      const inTenSeconds = new Date(Date.now() + 10_000).toUTCString();
      const err = new BsaleApiError('', 429, null, '', { 'retry-after': inTenSeconds });
      expect(err.retryAfterMs).toBeGreaterThan(8_000);
      expect(err.retryAfterMs).toBeLessThanOrEqual(10_000);
    });

    it('retryAfterMs es undefined con un valor inválido', () => {
      const err = new BsaleApiError('', 429, null, '', { 'retry-after': 'soon' });
      expect(err.retryAfterMs).toBeUndefined();
    });
  });
});
