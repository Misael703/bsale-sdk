import type { HttpClient } from '../client/http-client';
import type {
  BsaleCoupon,
  BsaleCreateCouponPayload,
  BsaleUpdateCouponPayload,
  BsaleListResponse,
  BsaleQueryParams,
} from '../types';

/**
 * Cupones (path: `/loyalty/coupons`).
 *
 * No extiende `BaseResource` porque el path es atípico (`loyalty/...`) y el
 * recurso no expone `count`. Para "eliminar" un cupón se desactiva con
 * `PUT { disabled: 1 }`.
 */
export class CouponsResource {
  constructor(private readonly http: HttpClient) {}

  async list(params?: BsaleQueryParams): Promise<BsaleListResponse<BsaleCoupon>> {
    return this.http.get<BsaleListResponse<BsaleCoupon>>('/loyalty/coupons.json', params);
  }

  async getById(id: number): Promise<{ code: string | number; data: BsaleCoupon }> {
    return this.http.get('/loyalty/coupons/' + id + '.json');
  }

  async create(data: BsaleCreateCouponPayload): Promise<{ code: string | number; data: BsaleCoupon | BsaleCoupon[] }> {
    return this.http.post('/loyalty/coupons.json', data);
  }

  async update(
    id: number,
    data: BsaleUpdateCouponPayload,
  ): Promise<{ code: string | number; data: BsaleCoupon }> {
    return this.http.put('/loyalty/coupons/' + id + '.json', data);
  }

  /** Atajo: `update(id, { disabled: 1 })`. */
  async disable(id: number): Promise<{ code: string | number; data: BsaleCoupon }> {
    return this.update(id, { disabled: 1 });
  }
}
