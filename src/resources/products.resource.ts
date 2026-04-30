import { BaseResource } from './base.resource';
import type {
  BsaleProduct,
  BsaleProductPayload,
  BsaleProductUpdatePayload,
  BsaleProductTax,
  BsaleVariant,
  BsaleCreatePackPayload,
  BsalePack,
  BsaleListResponse,
  BsaleQueryParams,
} from '../types';

/** Productos y servicios. */
export class ProductsResource extends BaseResource<BsaleProduct> {
  protected readonly path = 'products';

  /** Lista las variantes de un producto. */
  async getVariants(
    productId: number,
    params?: BsaleQueryParams,
  ): Promise<BsaleListResponse<BsaleVariant>> {
    return this.http.get<BsaleListResponse<BsaleVariant>>(
      `/products/${productId}/variants.json`,
      params,
    );
  }

  /** Lista los impuestos asociados a un producto. */
  async getTaxes(
    productId: number,
    params?: BsaleQueryParams,
  ): Promise<BsaleListResponse<BsaleProductTax>> {
    return this.http.get<BsaleListResponse<BsaleProductTax>>(
      `/products/${productId}/product_taxes.json`,
      params,
    );
  }

  /** Obtiene un impuesto específico de un producto. */
  async getTaxById(productId: number, taxId: number): Promise<BsaleProductTax> {
    return this.http.get<BsaleProductTax>(`/products/${productId}/product_taxes/${taxId}.json`);
  }

  /** Crea un producto. */
  async create(data: BsaleProductPayload): Promise<BsaleProduct> {
    return this.http.post<BsaleProduct>('/products.json', data);
  }

  /** Actualiza un producto (solo `name`, `productTypeId`, `allowDecimal`, `description`). */
  async update(
    id: number,
    data: Omit<BsaleProductUpdatePayload, 'id'>,
  ): Promise<BsaleProduct> {
    return this.http.put<BsaleProduct>(`/products/${id}.json`, { id: String(id), ...data });
  }

  /** Soft delete: cambia `state` a 1. */
  async delete(id: number): Promise<void> {
    await this.http.delete(`/products/${id}.json`);
  }

  /**
   * Crea un pack/promoción.
   * **Usa el endpoint `/v2/products/pack.json`** (versión 2 — única excepción).
   * Desempaqueta el wrapper `{ code, data }` y retorna el pack creado.
   */
  async createPack(data: BsaleCreatePackPayload): Promise<BsalePack> {
    const response = await this.http.post<{ code: string | number; data: BsalePack }>(
      '/v2/products/pack.json',
      data,
    );
    return response.data;
  }
}
