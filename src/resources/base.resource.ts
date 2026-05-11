import { HttpClient, type HttpRequestOptions } from '../client/http-client';
import type { BsaleListResponse, BsaleQueryParams, BsalePaginateOptions } from '../types';

const MAX_PAGE_SIZE = 50;

/**
 * Abstract base class for Bsale API resources.
 * Provides standard CRUD and pagination methods.
 */
export abstract class BaseResource<T> {
  /** API resource path (e.g., 'products') */
  protected abstract readonly path: string;

  constructor(protected readonly http: HttpClient) {}

  /**
   * Lists items with optional query parameters.
   */
  async list(
    params?: BsaleQueryParams,
    requestOptions?: HttpRequestOptions,
  ): Promise<BsaleListResponse<T>> {
    return this.http.get<BsaleListResponse<T>>(`/${this.path}.json`, params, requestOptions);
  }

  /**
   * Fetches ALL items across all pages, respecting optional maxItems limit.
   * Automatically handles pagination with a max page size of 50.
   * Honors `options.signal` to abort the pagination loop between pages.
   */
  async listAll(params?: BsaleQueryParams, options?: BsalePaginateOptions): Promise<T[]> {
    const pageSize = Math.min(options?.pageSize ?? MAX_PAGE_SIZE, MAX_PAGE_SIZE);
    const maxItems = options?.maxItems;
    const items: T[] = [];
    let offset = 0;

    const requestOptions: HttpRequestOptions | undefined =
      options?.signal || options?.skipCache
        ? { signal: options.signal, skipCache: options.skipCache }
        : undefined;

    while (true) {
      if (options?.signal?.aborted) {
        throw options.signal.reason instanceof Error
          ? options.signal.reason
          : Object.assign(new Error('Pagination aborted'), { name: 'AbortError' });
      }

      const response = await this.list({ ...params, limit: pageSize, offset }, requestOptions);
      items.push(...response.items);

      if (maxItems && items.length >= maxItems) {
        return items.slice(0, maxItems);
      }

      if (!response.next || response.items.length < pageSize) {
        break;
      }

      offset += pageSize;
    }

    return items;
  }

  /**
   * Iterador asíncrono que pagina bajo demanda. Memoria-eficiente para
   * datasets grandes: emite items uno a uno sin cargar todo en RAM.
   *
   * ```ts
   * for await (const doc of client.documents.iterate({ ... })) { ... }
   * ```
   */
  async *iterate(
    params?: BsaleQueryParams,
    options?: BsalePaginateOptions,
  ): AsyncIterableIterator<T> {
    const pageSize = Math.min(options?.pageSize ?? MAX_PAGE_SIZE, MAX_PAGE_SIZE);
    const maxItems = options?.maxItems;
    let offset = 0;
    let yielded = 0;

    const requestOptions: HttpRequestOptions | undefined =
      options?.signal || options?.skipCache
        ? { signal: options.signal, skipCache: options.skipCache }
        : undefined;

    while (true) {
      if (options?.signal?.aborted) {
        throw options.signal.reason instanceof Error
          ? options.signal.reason
          : Object.assign(new Error('Pagination aborted'), { name: 'AbortError' });
      }

      const response = await this.list({ ...params, limit: pageSize, offset }, requestOptions);

      for (const item of response.items) {
        yield item;
        yielded++;
        if (maxItems && yielded >= maxItems) return;
      }

      if (!response.next || response.items.length < pageSize) return;
      offset += pageSize;
    }
  }

  /**
   * Fetches a single item by its ID.
   */
  async getById(
    id: number,
    params?: BsaleQueryParams,
    requestOptions?: HttpRequestOptions,
  ): Promise<T> {
    return this.http.get<T>(`/${this.path}/${id}.json`, params, requestOptions);
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
   */
  protected async paginateSubresource<U>(
    path: string,
    options?: {
      readonly params?: BsaleQueryParams;
      readonly embedded?: BsaleListResponse<U>;
      readonly pageSize?: number;
      readonly signal?: AbortSignal;
      readonly skipCache?: boolean;
    },
  ): Promise<U[]> {
    const pageSize = Math.min(options?.pageSize ?? MAX_PAGE_SIZE, MAX_PAGE_SIZE);
    const all: U[] = [];
    let offset = 0;

    const requestOptions: HttpRequestOptions | undefined =
      options?.signal || options?.skipCache
        ? { signal: options.signal, skipCache: options.skipCache }
        : undefined;

    if (options?.embedded) {
      all.push(...options.embedded.items);
      const total = options.embedded.count;
      if (all.length >= total) {
        return all;
      }
      offset = all.length;
    }

    while (true) {
      if (options?.signal?.aborted) {
        throw options.signal.reason instanceof Error
          ? options.signal.reason
          : Object.assign(new Error('Pagination aborted'), { name: 'AbortError' });
      }

      const page = await this.http.get<BsaleListResponse<U>>(
        path,
        { ...options?.params, limit: pageSize, offset },
        requestOptions,
      );

      all.push(...page.items);

      if (!page.next || page.items.length < pageSize) {
        break;
      }

      offset += page.items.length;
    }

    return all;
  }
}
