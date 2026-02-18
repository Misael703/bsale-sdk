import { BaseResource } from './base.resource';
import type { BsaleProduct, BsaleProductPayload, BsaleVariant, BsaleListResponse, BsaleQueryParams } from '../types';

/** Resource for managing Bsale products */
export class ProductsResource extends BaseResource<BsaleProduct> {
  protected readonly path = 'products';

  /**
   * Lists variants for a specific product.
   * @param productId - Product ID
   * @param params - Optional query parameters
   * @returns Paginated list of variants
   */
  async getVariants(productId: number, params?: BsaleQueryParams): Promise<BsaleListResponse<BsaleVariant>> {
    return this.http.get<BsaleListResponse<BsaleVariant>>(`/products/${productId}/variants.json`, params);
  }

  /**
   * Creates a new product.
   * @param data - Product data
   * @returns The created product
   */
  async create(data: BsaleProductPayload): Promise<BsaleProduct> {
    return this.http.post<BsaleProduct>('/products.json', data);
  }

  /**
   * Updates an existing product.
   * @param id - Product ID
   * @param data - Product data to update
   * @returns The updated product
   */
  async update(id: number, data: BsaleProductPayload): Promise<BsaleProduct> {
    return this.http.put<BsaleProduct>(`/products/${id}.json`, data);
  }
}
