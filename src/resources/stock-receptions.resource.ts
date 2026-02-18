import { BaseResource } from './base.resource';
import type { BsaleStockReception, BsaleStockReceptionPayload } from '../types';

/** Resource for managing Bsale stock receptions */
export class StockReceptionsResource extends BaseResource<BsaleStockReception> {
  protected readonly path = 'stocks/receptions';

  /**
   * Creates a new stock reception.
   * @param data - Stock reception data with office, date, and detail lines
   * @returns The created stock reception
   */
  async create(data: BsaleStockReceptionPayload): Promise<BsaleStockReception> {
    return this.http.post<BsaleStockReception>('/stocks/receptions.json', data);
  }
}
