interface ParsedBsaleError {
  message?: string;
  code?: string;
  details?: unknown;
}

/**
 * Bsale no documenta un schema único de error. Se han observado al menos:
 * - `{ error: "..." }` (texto simple)
 * - `{ message: "...", code: 123 }`
 * - `{ error: "...", details: [...] }`
 * - `{ errors: [{ field, message }] }` en validaciones
 *
 * Esta función intenta extraer message/code/details de manera defensiva
 * sin asumir un schema concreto.
 */
function parseBsaleErrorBody(body: unknown): ParsedBsaleError {
  if (!body || typeof body !== 'object') return {};
  const b = body as Record<string, unknown>;

  let message: string | undefined;
  if (typeof b.message === 'string' && b.message.trim()) {
    message = b.message;
  } else if (typeof b.error === 'string' && b.error.trim()) {
    message = b.error;
  } else if (typeof b.error_description === 'string' && b.error_description.trim()) {
    message = b.error_description;
  }

  let code: string | undefined;
  const candidate = b.code ?? b.error_code ?? b.errorCode;
  if (typeof candidate === 'string' || typeof candidate === 'number') {
    code = String(candidate);
  }

  const details = b.details ?? b.errors ?? b.fields ?? undefined;

  return { message, code, details };
}

/**
 * Custom error class for Bsale API errors.
 * Provides helper getters to identify common error types and parses the
 * response body to expose `code`, `details`, and a richer `message`.
 */
export class BsaleApiError extends Error {
  /** HTTP status code from the API response */
  readonly status: number;
  /** Raw response body */
  readonly responseBody: unknown;
  /** Request path that caused the error */
  readonly path: string;
  /** Bsale-provided error code (best-effort parsing) */
  readonly code?: string;
  /** Validation details / error array (best-effort parsing) */
  readonly details?: unknown;

  constructor(message: string, status: number, responseBody: unknown, path: string) {
    const parsed = parseBsaleErrorBody(responseBody);
    const fullMessage = parsed.message ? `${message} — ${parsed.message}` : message;
    super(fullMessage);
    this.name = 'BsaleApiError';
    this.status = status;
    this.responseBody = responseBody;
    this.path = path;
    this.code = parsed.code;
    this.details = parsed.details;
  }

  /** Whether this is a rate limit error (429) */
  get isRateLimit(): boolean {
    return this.status === 429;
  }

  /** Whether this is a server error (5xx) */
  get isServerError(): boolean {
    return this.status >= 500;
  }

  /** Whether this is a not found error (404) */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** Whether this is a client error (4xx, excluding 429) */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500 && this.status !== 429;
  }
}
