import type { HttpClient } from '../client/http-client';
import type {
  BsaleStockConsumptionType,
  BsaleListResponse,
  BsaleQueryParams,
} from '../types';

/**
 * Tipos de consumo de stock. Solo expone `list()` — la API no documenta
 * `getById` ni `count`. No extiende `BaseResource` porque su estructura de
 * campos es atípica (`cntId`, `cntI18nName`, etc.).
 */
export class StockConsumptionTypesResource {
  constructor(private readonly http: HttpClient) {}

  async list(
    params?: BsaleQueryParams,
  ): Promise<BsaleListResponse<BsaleStockConsumptionType>> {
    return this.http.get<BsaleListResponse<BsaleStockConsumptionType>>(
      '/stock_consumption_types.json',
      params,
    );
  }
}
