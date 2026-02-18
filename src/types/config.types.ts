/** Configuration options for the Bsale SDK client */
export interface BsaleConfig {
  /** Bsale API access token */
  readonly accessToken: string;
  /** Base URL for the Bsale API (default: https://api.bsale.io/v1) */
  readonly baseUrl?: string;
  /** Request timeout in milliseconds (default: 15000) */
  readonly timeout?: number;
  /** Maximum number of retry attempts for failed requests (default: 3) */
  readonly maxRetries?: number;
  /** Cache time-to-live in milliseconds (default: 60000) */
  readonly cacheTtlMs?: number;
  /** Optional logger callback for request/response logging */
  readonly logger?: (message: string, data?: Record<string, unknown>) => void;
}
