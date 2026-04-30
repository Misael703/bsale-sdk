import { BaseResource } from './base.resource';
import type {
  BsaleStockReception,
  BsaleStockReceptionDetail,
  BsaleStockReceptionPayload,
  BsaleStockReceptionUpdatePayload,
  BsaleListResponse,
  BsaleQueryParams,
} from '../types';

/** Recepciones de stock (ingresos). */
export class StockReceptionsResource extends BaseResource<BsaleStockReception> {
  protected readonly path = 'stocks/receptions';

  /** Crea una recepción. Identifica variantes por `code`/`id`/`barCode`. */
  async create(data: BsaleStockReceptionPayload): Promise<BsaleStockReception> {
    return this.http.post<BsaleStockReception>('/stocks/receptions.json', data);
  }

  /** Actualiza una recepción. **Los detalles requieren `variantId`** (no `code`/`barCode`). */
  async update(id: number, data: BsaleStockReceptionUpdatePayload): Promise<BsaleStockReception> {
    return this.http.put<BsaleStockReception>(`/stocks/receptions/${id}.json`, data);
  }

  /** Lista los items de una recepción. */
  async getDetails(
    receptionId: number,
    params?: BsaleQueryParams,
  ): Promise<BsaleListResponse<BsaleStockReceptionDetail>> {
    return this.http.get<BsaleListResponse<BsaleStockReceptionDetail>>(
      `/stocks/receptions/${receptionId}/details.json`,
      params,
    );
  }

  /** Item individual de una recepción. */
  async getDetailById(
    receptionId: number,
    detailId: number,
  ): Promise<BsaleStockReceptionDetail> {
    return this.http.get<BsaleStockReceptionDetail>(
      `/stocks/receptions/${receptionId}/details/${detailId}.json`,
    );
  }
}
