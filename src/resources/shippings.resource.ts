import { BaseResource } from './base.resource';
import type { BsaleShipping, BsaleShippingPayload } from '../types';

/** Resource for managing Bsale shippings (despachos) */
export class ShippingsResource extends BaseResource<BsaleShipping> {
  protected readonly path = 'shippings';

  /**
   * Creates a new shipping.
   * @param data - Shipping data
   * @returns The created shipping
   */
  async create(data: BsaleShippingPayload): Promise<BsaleShipping> {
    return this.http.post<BsaleShipping>('/shippings.json', data);
  }

  /**
   * Updates an existing shipping.
   * @param id - Shipping ID
   * @param data - Shipping data to update
   * @returns The updated shipping
   */
  async update(id: number, data: BsaleShippingPayload): Promise<BsaleShipping> {
    return this.http.put<BsaleShipping>(`/shippings/${id}.json`, data);
  }
}
