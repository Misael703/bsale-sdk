import { HttpClient } from '../client/http-client';
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
   * @param params - Optional query parameters (limit, offset, expand, fields, filters)
   * @returns Paginated list response
   */
  async list(params?: BsaleQueryParams): Promise<BsaleListResponse<T>> {
    return this.http.get<BsaleListResponse<T>>(`/${this.path}.json`, params);
  }

  /**
   * Fetches ALL items across all pages, respecting optional maxItems limit.
   * Automatically handles pagination with a max page size of 50.
   * @param params - Optional query parameters (filters, expand, fields)
   * @param options - Pagination options (maxItems, pageSize)
   * @returns Array of all items
   */
  async listAll(params?: BsaleQueryParams, options?: BsalePaginateOptions): Promise<T[]> {
    const pageSize = Math.min(options?.pageSize ?? MAX_PAGE_SIZE, MAX_PAGE_SIZE);
    const maxItems = options?.maxItems;
    const items: T[] = [];
    let offset = 0;

    while (true) {
      const response = await this.list({ ...params, limit: pageSize, offset });
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
   * @param id - Item ID
   * @param params - Optional query parameters (expand, fields)
   * @returns The item
   */
  async getById(id: number, params?: BsaleQueryParams): Promise<T> {
    return this.http.get<T>(`/${this.path}/${id}.json`, params);
  }

  /**
   * Returns the total count of items matching the given parameters.
   * @param params - Optional query parameters (filters)
   * @returns Object with count property
   */
  async count(params?: BsaleQueryParams): Promise<{ count: number }> {
    return this.http.get<{ count: number }>(`/${this.path}/count.json`, params);
  }
}
