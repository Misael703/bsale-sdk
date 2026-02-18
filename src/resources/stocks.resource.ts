import { BaseResource } from './base.resource';
import type { BsaleStock, BsaleListResponse } from '../types';

/** Resource for querying Bsale stock (read-only) */
export class StocksResource extends BaseResource<BsaleStock> {
  protected readonly path = 'stocks';

  /**
   * Gets stock for a specific variant and office combination.
   * @param variantId - Variant ID
   * @param officeId - Office (branch) ID
   * @returns Paginated list of stock entries
   */
  async getByVariantAndOffice(
    variantId: number,
    officeId: number,
  ): Promise<BsaleListResponse<BsaleStock>> {
    return this.list({ variantid: variantId, officeid: officeId });
  }
}
