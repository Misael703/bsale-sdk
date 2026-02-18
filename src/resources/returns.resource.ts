import { BaseResource } from './base.resource';
import type {
  BsaleReturn,
  BsaleReturnDetail,
  BsaleReturnCreatePayload,
  BsaleReturnAnnulment,
  BsaleReturnAnnulmentPayload,
  BsaleListResponse,
  BsaleQueryParams,
} from '../types';

/** Resource for managing Bsale returns (devoluciones) */
export class ReturnsResource extends BaseResource<BsaleReturn> {
  protected readonly path = 'returns';

  /**
   * Lists details for a specific return.
   * @param returnId - Return ID
   * @param params - Optional query parameters
   * @returns Paginated list of return details
   */
  async getDetails(returnId: number, params?: BsaleQueryParams): Promise<BsaleListResponse<BsaleReturnDetail>> {
    return this.http.get<BsaleListResponse<BsaleReturnDetail>>(`/returns/${returnId}/details.json`, params);
  }

  /**
   * Creates a new return (credit note).
   * @param data - Return data
   * @returns The created return
   */
  async create(data: BsaleReturnCreatePayload): Promise<BsaleReturn> {
    return this.http.post<BsaleReturn>('/returns.json', data);
  }

  /**
   * Annuls a return by creating a debit note.
   * @param data - Annulment data
   * @returns The annulment result
   */
  async annul(data: BsaleReturnAnnulmentPayload): Promise<BsaleReturnAnnulment> {
    return this.http.post<BsaleReturnAnnulment>('/returns/annulments.json', data);
  }
}
