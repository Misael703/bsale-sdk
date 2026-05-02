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
}
