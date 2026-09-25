import { HttpClient, type HttpRequestOptions } from '../client/http-client';
import { toAbortError } from '../utils/abort.utils';
import type {
  BsaleExpanded,
  BsaleListResponse,
  BsaleNoExpansions,
  BsaleQueryParams,
  BsalePaginateOptions,
  BsaleRequestPriority,
} from '../types';

const MAX_PAGE_SIZE = 50;

/** Params con el literal de `expand` capturado para tipar la respuesta. */
type ExpandParams<E extends string> = BsaleQueryParams & { readonly expand?: E };

/** Opciones de paginación que se reenvían a cada request de página. */
interface PageRequestOptions {
  readonly signal?: AbortSignal;
  readonly skipCache?: boolean;
  readonly priority?: BsaleRequestPriority;
}

/**
 * Abstract base class for Bsale API resources.
 * Provides standard CRUD and pagination methods.
 *
 * `X` es el mapa de expansiones del recurso (relación → forma embebida).
 * Con él, `list`, `listAll`, `iterate` y `getById` tipan el resultado según el
 * literal de `expand`: `variants.list({ expand: 'product' })` devuelve items
 * con `product: BsaleProduct`. Recursos sin mapa no cambian su tipo.
 */
export abstract class BaseResource<T, X extends object = BsaleNoExpansions> {
  /** API resource path (e.g., 'products') */
  protected abstract readonly path: string;

  constructor(protected readonly http: HttpClient) {}

  /**
   * Lists items with optional query parameters.
   */
  async list<E extends string = never>(
    params?: ExpandParams<E>,
    requestOptions?: HttpRequestOptions,
  ): Promise<BsaleListResponse<BsaleExpanded<T, X, E>>> {
    return this.http.get<BsaleListResponse<BsaleExpanded<T, X, E>>>(
      `/${this.path}.json`,
      params,
      requestOptions,
    );
  }

  /**
   * Fetches ALL items across all pages, respecting optional maxItems limit.
   * Automatically handles pagination with a max page size of 50.
   * Termina cuando el offset alcanza el `count` del listado, no por página
   * corta (ver `iterate`). Honors `options.signal` to abort between pages.
   */
  async listAll<E extends string = never>(
    params?: ExpandParams<E>,
    options?: BsalePaginateOptions,
  ): Promise<BsaleExpanded<T, X, E>[]> {
    const items: BsaleExpanded<T, X, E>[] = [];
    for await (const item of this.iterate(params, options)) {
      items.push(item);
    }
    return items;
  }

  /**
   * Iterador asíncrono que pagina bajo demanda. Memoria-eficiente para
   * datasets grandes: emite items uno a uno sin cargar todo en RAM.
   *
   * Termina cuando el offset alcanza el `count` del listado (o ante una página
   * vacía). Una página corta que no es la última no corta la iteración: el
   * offset avanza por los items recibidos, así que en el peor caso se repite
   * un item, nunca se salta uno.
   *
   * ```ts
   * for await (const doc of client.documents.iterate({ ... })) { ... }
   * ```
   */
  async *iterate<E extends string = never>(
    params?: ExpandParams<E>,
    options?: BsalePaginateOptions,
  ): AsyncIterableIterator<BsaleExpanded<T, X, E>> {
    const maxItems = options?.maxItems;
    let yielded = 0;

    const pages = this.paginate<BsaleExpanded<T, X, E>>(
      (query, requestOptions) => this.list<E>({ ...params, ...query }, requestOptions),
      options,
    );

    for await (const page of pages) {
      for (const item of page) {
        yield item;
        yielded++;
        if (maxItems && yielded >= maxItems) return;
      }
    }
  }

  /**
   * Fetches a single item by its ID. Acepta el id como string porque varias
   * referencias de la API lo entregan así (ej. `variant.product.id`).
   */
  async getById<E extends string = never>(
    id: number | string,
    params?: ExpandParams<E>,
    requestOptions?: HttpRequestOptions,
  ): Promise<BsaleExpanded<T, X, E>> {
    return this.http.get<BsaleExpanded<T, X, E>>(
      `/${this.path}/${id}.json`,
      params,
      requestOptions,
    );
  }

  /**
   * Returns the total count of items matching the given parameters.
   */
  async count(
    params?: BsaleQueryParams,
    requestOptions?: HttpRequestOptions,
  ): Promise<{ count: number }> {
    return this.http.get<{ count: number }>(`/${this.path}/count.json`, params, requestOptions);
  }

  /**
   * Pagina cualquier sub-recurso (`/documents/{id}/details.json`, etc.) hasta agotar
   * sus items. Acepta una primera página ya fetcheada (típicamente la embebida vía
   * `expand=<sub>`) para evitar un request inicial redundante.
   *
   * El endpoint dedicado de sub-recurso respeta `limit` hasta 50 (a diferencia del
   * embebido del `expand`, que fuerza 25 silenciosamente).
   *
   * @param path - Path absoluto del sub-recurso (ej. `/documents/824738/details.json`).
   * @param options.params - Query params adicionales.
   * @param options.embedded - Primera página ya fetcheada (ahorra 1 request si `count` ya cubre).
   * @param options.pageSize - Tamaño de página para el loop (default 50).
   * @param options.signal - AbortSignal para cancelar entre páginas.
   * @param options.skipCache - Bypass de cache en cada página.
   * @param options.priority - Carril del limitador para cada página.
   */
  protected async paginateSubresource<U>(
    path: string,
    options?: PageRequestOptions & {
      readonly params?: BsaleQueryParams;
      readonly embedded?: BsaleListResponse<U>;
      readonly pageSize?: number;
    },
  ): Promise<U[]> {
    const all: U[] = [];
    let startOffset = 0;

    if (options?.embedded) {
      all.push(...options.embedded.items);
      if (all.length >= options.embedded.count) {
        return all;
      }
      startOffset = all.length;
    }

    const pages = this.paginate<U>(
      (query, requestOptions) =>
        this.http.get<BsaleListResponse<U>>(path, { ...options?.params, ...query }, requestOptions),
      options,
      startOffset,
    );
    for await (const page of pages) {
      all.push(...page);
    }

    return all;
  }

  /**
   * Motor de paginación por offset compartido por `iterate`, `listAll` y
   * `paginateSubresource`. Emite los items de cada página.
   *
   * Termina por `count` y no por página corta: Bsale puede devolver una página
   * con menos items que `limit` sin que sea la última, y cortar ahí terminaba
   * el recorrido en silencio como si fuera completo. El `count` se relee en
   * cada página (puede cambiar mientras se recorre). Si el endpoint no trae
   * `count`, se cae al criterio anterior (`next` ausente o página corta).
   */
  private async *paginate<U>(
    fetchPage: (
      query: { readonly limit: number; readonly offset: number },
      requestOptions: HttpRequestOptions | undefined,
    ) => Promise<BsaleListResponse<U>>,
    options: (PageRequestOptions & { readonly pageSize?: number }) | undefined,
    startOffset = 0,
  ): AsyncGenerator<U[]> {
    const pageSize = Math.min(options?.pageSize ?? MAX_PAGE_SIZE, MAX_PAGE_SIZE);
    const requestOptions = toRequestOptions(options);
    let offset = startOffset;

    while (true) {
      if (options?.signal?.aborted) {
        throw toAbortError(options.signal, 'Pagination aborted');
      }

      const page = await fetchPage({ limit: pageSize, offset }, requestOptions);
      offset += page.items.length;
      yield page.items;

      if (isLastPage(page, offset, pageSize)) return;
    }
  }
}

function isLastPage<U>(page: BsaleListResponse<U>, nextOffset: number, pageSize: number): boolean {
  // Una página vacía nunca avanza el offset: seguir sería un loop infinito.
  if (page.items.length === 0) return true;
  if (typeof page.count === 'number') return nextOffset >= page.count;
  return !page.next || page.items.length < pageSize;
}

function toRequestOptions(options: PageRequestOptions | undefined): HttpRequestOptions | undefined {
  if (!options?.signal && !options?.skipCache && !options?.priority) return undefined;
  return { signal: options.signal, skipCache: options.skipCache, priority: options.priority };
}
