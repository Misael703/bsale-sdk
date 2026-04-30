import type { HttpClient } from '../client/http-client';
import type {
  BsaleDiscount,
  BsaleCreateDiscountPayload,
  BsaleAddDiscountDetailPayload,
  BsaleDiscountDetail,
  BsaleListResponse,
  BsaleQueryParams,
} from '../types';

/**
 * Descuentos.
 *
 * **Mezcla `/v1/` (lectura) y `/v2/` (escritura)**. POST usa el path anómalo
 * `/v2/discounts/new.json`. Las fechas usan formato `"DD/MM/YYYY"` (no Unix ts).
 *
 * Para "eliminar" un descuento se desactiva con `update(id, { state: 1 })` —
 * la API no expone DELETE de descuento completo (solo de detalles).
 */
export class DiscountsResource {
  constructor(private readonly http: HttpClient) {}

  async list(params?: BsaleQueryParams): Promise<BsaleListResponse<BsaleDiscount>> {
    return this.http.get<BsaleListResponse<BsaleDiscount>>('/discounts.json', params);
  }

  async getById(id: number): Promise<BsaleDiscount> {
    return this.http.get<BsaleDiscount>(`/discounts/${id}.json`);
  }

  async count(params?: BsaleQueryParams): Promise<{ count: number }> {
    return this.http.get<{ count: number }>('/discounts/count.json', params);
  }

  /** Detalles del descuento (productos/variantes asociados). Endpoint v2. */
  async getDetails(
    discountId: number,
    params?: BsaleQueryParams,
  ): Promise<{
    code: string | number;
    href: string;
    count: number;
    limit: number;
    offset: number;
    data: ReadonlyArray<BsaleDiscountDetail>;
  }> {
    return this.http.get(`/v2/discounts/${discountId}/details.json`, params);
  }

  /** Crea un descuento. Endpoint anómalo: `/v2/discounts/new.json`. */
  async create(
    data: BsaleCreateDiscountPayload,
  ): Promise<{ code: string | number; data: BsaleDiscount }> {
    return this.http.post('/v2/discounts/new.json', data);
  }

  /** Actualiza un descuento. Endpoint v2. */
  async update(
    id: number,
    data: Partial<BsaleCreateDiscountPayload>,
  ): Promise<{ code: string | number; data: BsaleDiscount }> {
    return this.http.put(`/v2/discounts/${id}.json`, data);
  }

  /** Asocia un producto o variante al descuento. */
  async addDetail(
    discountId: number,
    data: BsaleAddDiscountDetailPayload,
  ): Promise<{ code: string | number; data: BsaleDiscountDetail }> {
    return this.http.post(`/v2/discounts/${discountId}/details.json`, data);
  }

  /** Elimina un detalle (relación) del descuento. */
  async removeDetail(detailId: number): Promise<{ code: string; data: { success: boolean; id: number } }> {
    return this.http.delete(`/v2/discounts/details/${detailId}.json`);
  }
}
