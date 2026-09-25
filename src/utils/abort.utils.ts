/**
 * Convierte un `AbortSignal` abortado en el error que ve el caller: la
 * `reason` si es un `Error`, o un `AbortError` genérico en caso contrario.
 */
export function toAbortError(signal: AbortSignal, message = 'Request aborted'): Error {
  if (signal.reason instanceof Error) return signal.reason;
  const err = new Error(message);
  err.name = 'AbortError';
  return err;
}
