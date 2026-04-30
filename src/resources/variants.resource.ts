import { BaseResource } from './base.resource';
import type {
  BsaleVariant,
  BsaleVariantPayload,
  BsaleVariantAttributeValue,
  BsaleVariantCosts,
  BsaleListResponse,
  BsaleQueryParams,
} from '../types';

/** Variantes de productos. */
export class VariantsResource extends BaseResource<BsaleVariant> {
  protected readonly path = 'variants';

  /** Crea una variante. Requiere que el producto padre exista. */
  async create(data: BsaleVariantPayload): Promise<BsaleVariant> {
    return this.http.post<BsaleVariant>('/variants.json', data);
  }

  /** Actualiza campos de una variante. */
  async update(id: number, data: BsaleVariantPayload): Promise<BsaleVariant> {
    return this.http.put<BsaleVariant>(`/variants/${id}.json`, data);
  }

  /** Soft delete: cambia `state` a 1. */
  async delete(id: number): Promise<void> {
    await this.http.delete(`/variants/${id}.json`);
  }

  /** Costo histórico (FIFO) de una variante. */
  async getCosts(variantId: number): Promise<BsaleVariantCosts> {
    return this.http.get<BsaleVariantCosts>(`/variants/${variantId}/costs.json`);
  }

  /** Lista los valores de atributos asignados a una variante. */
  async getAttributeValues(
    variantId: number,
    params?: BsaleQueryParams,
  ): Promise<BsaleListResponse<BsaleVariantAttributeValue>> {
    return this.http.get<BsaleListResponse<BsaleVariantAttributeValue>>(
      `/variants/${variantId}/attribute_values.json`,
      params,
    );
  }

  /** Obtiene un valor de atributo individual. */
  async getAttributeValueById(
    variantId: number,
    attributeValueId: number,
  ): Promise<BsaleVariantAttributeValue> {
    return this.http.get<BsaleVariantAttributeValue>(
      `/variants/${variantId}/attribute_values/${attributeValueId}.json`,
    );
  }
}
