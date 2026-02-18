/**
 * Custom error class for Bsale API errors.
 * Provides helper getters to identify common error types.
 */
export class BsaleApiError extends Error {
  /** HTTP status code from the API response */
  readonly status: number;
  /** Raw response body */
  readonly responseBody: unknown;
  /** Request path that caused the error */
  readonly path: string;

  constructor(message: string, status: number, responseBody: unknown, path: string) {
    super(message);
    this.name = 'BsaleApiError';
    this.status = status;
    this.responseBody = responseBody;
    this.path = path;
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
}
