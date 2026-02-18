import { BaseResource } from './base.resource';
import type {
  BsalePriceList,
  BsalePriceListDetail,
  BsalePriceListDetailPayload,
  BsaleListResponse,
  BsaleQueryParams,
} from '../types';

/** Resource for managing Bsale price lists (read-only, details can be updated via PUT) */
export class PriceListsResource extends BaseResource<BsalePriceList> {
  protected readonly path = 'price_lists';

  /**
   * Gets details (variant prices) for a specific price list.
   * @param priceListId - Price list ID
   * @param params - Optional query parameters
   * @returns Paginated list of price list details
   */
  async getDetails(
    priceListId: number,
    params?: BsaleQueryParams,
  ): Promise<BsaleListResponse<BsalePriceListDetail>> {
    return this.http.get<BsaleListResponse<BsalePriceListDetail>>(
      `/price_lists/${priceListId}/details.json`,
      params,
    );
  }

  /**
   * Updates a specific detail within a price list.
   * @param priceListId - Price list ID
   * @param detailId - Detail ID
   * @param data - Updated price data
   * @returns The updated detail
   */
  async updateDetail(
    priceListId: number,
    detailId: number,
    data: BsalePriceListDetailPayload,
  ): Promise<BsalePriceListDetail> {
    return this.http.put<BsalePriceListDetail>(
      `/price_lists/${priceListId}/details/${detailId}.json`,
      data,
    );
  }
}
