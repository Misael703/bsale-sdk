/** Standard paginated list response from the Bsale API */
export interface BsaleListResponse<T> {
  readonly count: number;
  readonly limit: number;
  readonly offset: number;
  readonly items: T[];
  readonly next?: string;
}

/**
 * Valor aceptado en un query param. Se serializa con `String(value)`;
 * `null` y `undefined` se omiten de la URL.
 */
export type BsaleQueryValue = string | number | boolean | null | undefined;

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
  /** Filtros adicionales del recurso (`state`, `productid`, `emissiondaterange`, ...). */
  [key: string]: BsaleQueryValue;
}

/**
 * Carril del limitador de velocidad. `high` para tráfico interactivo o de
 * emisión; `low` para syncs en segundo plano, que ceden el paso a `high`.
 */
export type BsaleRequestPriority = 'high' | 'low';

/** Options for the listAll pagination helper */
export interface BsalePaginateOptions {
  /** Maximum number of items to fetch (default: all) */
  readonly maxItems?: number;
  /** Items per page (default: 50, max: 50) */
  readonly pageSize?: number;
  /** Allows cancelling the long-running pagination loop. */
  readonly signal?: AbortSignal;
  /** Bypass cache for every page request. */
  readonly skipCache?: boolean;
  /** Carril del limitador para cada página (default: `high`). */
  readonly priority?: BsaleRequestPriority;
}

type TrimSpaces<S extends string> = S extends ` ${infer Rest}`
  ? TrimSpaces<Rest>
  : S extends `${infer Rest} `
    ? TrimSpaces<Rest>
    : S;

/** Separa un literal `expand` (`'product,costs'`) en la unión de sus relaciones. */
export type BsaleExpandKeys<S extends string> = S extends `${infer Head},${infer Rest}`
  ? TrimSpaces<Head> | BsaleExpandKeys<Rest>
  : TrimSpaces<S>;

type ExpandOne<T, X, E extends string> = [BsaleExpandKeys<E> & keyof X] extends [never]
  ? T
  : Omit<T, BsaleExpandKeys<E> & keyof X> & {
      readonly [K in BsaleExpandKeys<E> & keyof X]: X[K];
    };

/**
 * Tipo de un item leído con `expand`. `X` es el mapa de expansiones del
 * recurso (relación → forma embebida) y `E` el literal pasado en `expand`.
 * Las relaciones de `E` presentes en `X` reemplazan su referencia `{ id, href }`
 * por la forma completa; las que no están en `X` no cambian el tipo.
 * Si `E` no es un literal (ej. un `string` armado en runtime), devuelve `T`.
 *
 * ```ts
 * type V = BsaleExpanded<BsaleVariant, BsaleVariantExpansions, 'product'>;
 * // Omit<BsaleVariant, 'product'> & { readonly product: BsaleProduct }
 * ```
 */
export type BsaleExpanded<T, X, E extends string> = [E] extends [never]
  ? T
  : string extends E
    ? T
    : E extends string
      ? ExpandOne<T, X, E>
      : never;

/** Mapa de expansiones vacío: el recurso no declara `expand` tipado. */
export type BsaleNoExpansions = Record<never, never>;
