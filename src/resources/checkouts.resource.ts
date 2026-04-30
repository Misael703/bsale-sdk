import type { HttpClient } from '../client/http-client';
import type {
  BsaleCheckout,
  BsaleCreateCheckoutPayload,
  BsaleUpdateCheckoutPayload,
  BsaleQueryParams,
} from '../types';

/**
 * Checkouts de e-commerce (pre-ventas).
 *
 * Mezcla de paths inconsistentes — list/POST/PUT en `/markets/checkout`,
 * GET por token en `/v2/token/checkout`, DELETE en `/checkout` (sin `markets`).
 */
export class CheckoutsResource {
  constructor(private readonly http: HttpClient) {}

  /** Lista checkouts con filtros. */
  async list(
    params?: BsaleQueryParams & {
      token?: string;
      clientName?: string;
      clientEmail?: string;
      marketId?: number;
      dateStart?: number;
      dateEnd?: number;
      payProcess?: 'success' | 'pending' | 'for_validate' | 'fail';
    },
  ): Promise<{
    code: number;
    href: string;
    count: number;
    limit: number;
    offset: number;
    data: ReadonlyArray<BsaleCheckout>;
  }> {
    return this.http.get('/markets/checkout/list.json', params);
  }

  /** Detalle por token (endpoint v2 — recomendado). */
  async getByToken(token: string): Promise<{ code: number; data: BsaleCheckout }> {
    return this.http.get(`/v2/token/checkout/${token}.json`);
  }

  /** Crea un checkout. Si `generateDocument=1`, genera documento DTE automáticamente. */
  async create(data: BsaleCreateCheckoutPayload): Promise<{
    code: string | number;
    data: BsaleCheckout;
  }> {
    return this.http.post('/markets/checkout.json', data);
  }

  /** Actualiza un checkout (parcial). */
  async update(
    id: number,
    data: BsaleUpdateCheckoutPayload,
  ): Promise<{ code: string | number; data: BsaleCheckout }> {
    return this.http.put(`/markets/checkout/${id}.json`, data);
  }

  /** Elimina (soft) un checkout. **Path sin `markets`** — anomalía documentada. */
  async delete(id: number): Promise<{ code: string | number; data: BsaleCheckout }> {
    return this.http.delete(`/checkout/${id}.json`);
  }
}
