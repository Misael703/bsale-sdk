import { BaseResource } from './base.resource';
import type {
  BsaleProductType,
  BsaleProductTypePayload,
  BsaleProductTypeAttribute,
  BsaleProduct,
  BsaleListResponse,
  BsaleQueryParams,
} from '../types';

/** Resource for managing Bsale product types (tipos de producto/servicio) */
export class ProductTypesResource extends BaseResource<BsaleProductType> {
  protected readonly path = 'product_types';

  /**
   * Lists products belonging to a specific product type.
   * @param productTypeId - Product type ID
   * @param params - Optional query parameters
   * @returns Paginated list of products
   */
  async getProducts(productTypeId: number, params?: BsaleQueryParams): Promise<BsaleListResponse<BsaleProduct>> {
    return this.http.get<BsaleListResponse<BsaleProduct>>(`/product_types/${productTypeId}/products.json`, params);
  }

  /**
   * Lists attributes for a specific product type.
   * @param productTypeId - Product type ID
   * @param params - Optional query parameters
   * @returns Paginated list of attributes
   */
  async getAttributes(productTypeId: number, params?: BsaleQueryParams): Promise<BsaleListResponse<BsaleProductTypeAttribute>> {
    return this.http.get<BsaleListResponse<BsaleProductTypeAttribute>>(`/product_types/${productTypeId}/attributes.json`, params);
  }

  /**
   * Creates a new product type.
   * @param data - Product type data
   * @returns The created product type
   */
  async create(data: BsaleProductTypePayload): Promise<BsaleProductType> {
    return this.http.post<BsaleProductType>('/product_types.json', data);
  }

  /**
   * Updates an existing product type.
   * @param id - Product type ID
   * @param data - Product type data to update
   * @returns The updated product type
   */
  async update(id: number, data: BsaleProductTypePayload): Promise<BsaleProductType> {
    return this.http.put<BsaleProductType>(`/product_types/${id}.json`, data);
  }

  /**
   * Deletes a product type.
   * @param id - Product type ID
   */
  async delete(id: number): Promise<void> {
    await this.http.delete(`/product_types/${id}.json`);
  }
}
