/** Standard paginated list response from the Bsale API */
export interface BsaleListResponse<T> {
  readonly count: number;
  readonly limit: number;
  readonly offset: number;
  readonly items: T[];
  readonly next?: string;
}

/** Query parameters for Bsale API requests */
export interface BsaleQueryParams {
  /** Number of items per page (max 50) */
  limit?: number;
  /** Number of items to skip */
  offset?: number;
  /** Comma-separated list of relations to expand */
  expand?: string;
  /** Comma-separated list of fields to return */
  fields?: string;
  /** Allow any additional filter params */
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/** Options for the listAll pagination helper */
export interface BsalePaginateOptions {
  /** Maximum number of items to fetch (default: all) */
  readonly maxItems?: number;
  /** Items per page (default: 50, max: 50) */
  readonly pageSize?: number;
}
