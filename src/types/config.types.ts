/**
 * Optional override for each Bsale API host. Defaults are documented at:
 * https://docs.bsale.dev (only Chile is supported by this SDK).
 */
export interface BsaleHosts {
  /** Main API. Default: https://api.bsale.io */
  readonly api?: string;
  /** Aceptación/reclamo de DTE de terceros. Default: https://bsp-api.bsale.io */
  readonly bsp?: string;
  /** Metadata de la instancia (token-based). Default: https://credential.bsale.io */
  readonly credential?: string;
  /** Integración con couriers. Default: https://courier.bsale.io */
  readonly courier?: string;
  /** Pasarela de pagos (lado MPE). Default: https://bcash.bsale.io */
  readonly bcash?: string;
}

/** Configuration options for the Bsale SDK client (Chile only) */
export interface BsaleConfig {
  /** Bsale API access token */
  readonly accessToken: string;
  /**
   * Hosts overrides. Útil para apuntar a entornos sandbox o proxies.
   * Si solo se consume el recurso principal, omitir.
   */
  readonly hosts?: BsaleHosts;
  /**
   * @deprecated Usar `hosts.api` en su lugar. Si se pasa, se interpreta como
   * el host principal (`api.bsale.io`). Mantenido para compatibilidad con v0.1.x.
   */
  readonly baseUrl?: string;
  /** Request timeout in milliseconds (default: 15000) */
  readonly timeout?: number;
  /** Maximum number of retry attempts for failed requests (default: 3) */
  readonly maxRetries?: number;
  /** Cache time-to-live in milliseconds (default: 60000) */
  readonly cacheTtlMs?: number;
  /**
   * Máximo de entradas en el cache LRU (default: 1000). Cuando se supera,
   * se descarta la entrada accedida menos recientemente.
   */
  readonly cacheMaxEntries?: number;
  /**
   * TTL por recurso (en ms) que sobrescribe `cacheTtlMs` para los paths cuyo
   * primer segmento coincida con la key. Ej. `{ stocks: 5_000, document_types: 3_600_000 }`.
   */
  readonly cacheTtlByResource?: Readonly<Record<string, number>>;
  /** Optional logger callback for request/response logging */
  readonly logger?: (message: string, data?: Record<string, unknown>) => void;
}
