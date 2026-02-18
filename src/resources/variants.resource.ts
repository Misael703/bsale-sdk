import { BaseResource } from './base.resource';
import type { BsaleVariant, BsaleVariantPayload } from '../types';

/** Resource for managing Bsale product variants */
export class VariantsResource extends BaseResource<BsaleVariant> {
  protected readonly path = 'variants';

  /**
   * Creates a new variant.
   * @param data - Variant data
   * @returns The created variant
   */
  async create(data: BsaleVariantPayload): Promise<BsaleVariant> {
    return this.http.post<BsaleVariant>('/variants.json', data);
  }

  /**
   * Updates an existing variant.
   * @param id - Variant ID
   * @param data - Variant data to update
   * @returns The updated variant
   */
  async update(id: number, data: BsaleVariantPayload): Promise<BsaleVariant> {
    return this.http.put<BsaleVariant>(`/variants/${id}.json`, data);
  }

  /**
   * Gets cost information for a variant.
   * @param variantId - Variant ID
   * @returns Cost data
   */
  async getCosts(variantId: number): Promise<unknown> {
    return this.http.get(`/variants/${variantId}/costs.json`);
  }
}
