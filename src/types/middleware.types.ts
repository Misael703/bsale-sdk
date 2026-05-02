/**
 * Contexto de una request en curso. Los middlewares pueden mutar `headers`,
 * `body` y `url` antes de invocar `next()`. Inmutable después de que el
 * fetch terminal se haya disparado.
 */
export interface BsaleRequestContext {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
  /** Número de intento (0 = primer intento, 1+ = retries). */
  readonly attempt: number;
  /** Signal combinada (timeout + user signal). Pasarla a custom fetches. */
  readonly signal: AbortSignal;
}

/**
 * Middleware estilo Koa: envuelve el fetch real con `next()`. Puede leer y
 * modificar el `ctx`, observar/transformar la respuesta, y decidir si invoca
 * `next()` o retorna una `Response` sintética.
 *
 * Ejemplos: tracing, métricas, refresh de tokens, custom logging.
 */
export type BsaleMiddleware = (
  ctx: BsaleRequestContext,
  next: () => Promise<Response>,
) => Promise<Response>;
