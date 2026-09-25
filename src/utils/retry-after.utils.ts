const MS_PER_SECOND = 1000;

/**
 * Parsea un header `Retry-After` (RFC 9110 §10.2.3) a milisegundos.
 * Acepta delta-seconds (`"120"`) o HTTP-date (`"Wed, 21 Oct 2026 07:28:00 GMT"`).
 * Una fecha en el pasado devuelve 0.
 *
 * @returns Milisegundos a esperar, o `undefined` si el header falta o es inválido.
 */
export function parseRetryAfterMs(
  headerValue: string | null | undefined,
  now: number = Date.now(),
): number | undefined {
  const trimmed = headerValue?.trim();
  if (!trimmed) return undefined;

  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10) * MS_PER_SECOND;
  }

  const dateMs = Date.parse(trimmed);
  if (Number.isFinite(dateMs)) {
    return Math.max(0, dateMs - now);
  }

  return undefined;
}
