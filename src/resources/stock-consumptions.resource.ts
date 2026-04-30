import { BaseResource } from './base.resource';
import type {
  BsaleStockConsumption,
  BsaleStockConsumptionDetail,
  BsaleStockConsumptionPayload,
  BsaleListResponse,
  BsaleQueryParams,
} from '../types';

/** Consumos de stock (egresos sin venta). */
export class StockConsumptionsResource extends BaseResource<BsaleStockConsumption> {
  protected readonly path = 'stocks/consumptions';

  /** Crea un consumo. Una vez creado no se puede modificar ni eliminar. */
  async create(data: BsaleStockConsumptionPayload): Promise<BsaleStockConsumption> {
    return this.http.post<BsaleStockConsumption>('/stocks/consumptions.json', data);
  }

  /** Lista los items de un consumo. */
  async getDetails(
    consumptionId: number,
    params?: BsaleQueryParams,
  ): Promise<BsaleListResponse<BsaleStockConsumptionDetail>> {
    return this.http.get<BsaleListResponse<BsaleStockConsumptionDetail>>(
      `/stocks/consumptions/${consumptionId}/details.json`,
      params,
    );
  }

  /** Item individual de un consumo. */
  async getDetailById(
    consumptionId: number,
    detailId: number,
  ): Promise<BsaleStockConsumptionDetail> {
    return this.http.get<BsaleStockConsumptionDetail>(
      `/stocks/consumptions/${consumptionId}/details/${detailId}.json`,
    );
  }
}
