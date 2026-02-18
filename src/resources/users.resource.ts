import { BaseResource } from './base.resource';
import type {
  BsaleUser,
  BsaleUserSalesSummary,
  BsaleDocument,
  BsaleReturn,
  BsaleListResponse,
  BsaleQueryParams,
} from '../types';

/** Resource for managing Bsale users (read-only) */
export class UsersResource extends BaseResource<BsaleUser> {
  protected readonly path = 'users';

  /**
   * Gets the sales summary, optionally filtered by user and date range.
   * @param params - Query params: userid, startdate, enddate
   * @returns Sales summary
   * @example getSalesSummary({ userid: 113 })
   * @example getSalesSummary({ userid: 113, startdate: 1438560000, enddate: 1438560000 })
   */
  async getSalesSummary(params?: BsaleQueryParams): Promise<BsaleUserSalesSummary> {
    return this.http.get<BsaleUserSalesSummary>('/users/sales_summary.json', params);
  }

  /**
   * Lists sales (documents) for a user.
   * @param userId - User ID
   * @param params - Optional query parameters
   * @returns Paginated list of documents
   */
  async getSales(userId: number, params?: BsaleQueryParams): Promise<BsaleListResponse<BsaleDocument>> {
    return this.http.get<BsaleListResponse<BsaleDocument>>(`/users/${userId}/sales.json`, params);
  }

  /**
   * Lists returns for a user.
   * @param userId - User ID
   * @param params - Optional query parameters
   * @returns Paginated list of returns
   */
  async getReturns(userId: number, params?: BsaleQueryParams): Promise<BsaleListResponse<BsaleReturn>> {
    return this.http.get<BsaleListResponse<BsaleReturn>>(`/users/${userId}/returns.json`, params);
  }
}
