import { BaseResource } from './base.resource';
import type { BsaleStockConsumption, BsaleStockConsumptionPayload } from '../types';

/** Resource for managing Bsale stock consumptions */
export class StockConsumptionsResource extends BaseResource<BsaleStockConsumption> {
  protected readonly path = 'stocks/consumptions';

  /**
   * Creates a new stock consumption.
   * @param data - Stock consumption data with office, date, and detail lines
   * @returns The created stock consumption
   */
  async create(data: BsaleStockConsumptionPayload): Promise<BsaleStockConsumption> {
    return this.http.post<BsaleStockConsumption>('/stocks/consumptions.json', data);
  }
}
