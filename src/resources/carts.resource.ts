import type { HttpClient } from '../client/http-client';
import type { BsaleCartItem, BsaleCartPayload, BsaleQueryParams } from '../types';

/**
 * Carros de compra (e-commerce).
 *
 * Los carros NO reservan stock — la reserva ocurre solo al confirmar el
 * checkout con `generateDocument=1`.
 */
export class CartsResource {
  constructor(private readonly http: HttpClient) {}

  /** Lista los items de un carro. */
  async getDetails(
    cartId: number,
    params?: BsaleQueryParams,
  ): Promise<{
    code: string | number;
    href: string;
    count: number;
    limit: number;
    offset: number;
    data: ReadonlyArray<BsaleCartItem>;
  }> {
    return this.http.get(`/cart/${cartId}/detail.json`, params);
  }

  /** Crea un carro nuevo con su lista inicial de items. */
  async create(data: BsaleCartPayload): Promise<{
    code: string | number;
    data: { id: number; createAt: number; cartDetails: ReadonlyArray<BsaleCartItem>; url: string };
  }> {
    return this.http.post('/cart/new.json', data);
  }

  /**
   * Edita un carro. Items con `id` se actualizan; sin `id` se agregan.
   */
  async update(cartId: number, data: BsaleCartPayload): Promise<unknown> {
    return this.http.put(`/cart/${cartId}.json`, data);
  }

  /** Elimina un item del carro. */
  async removeItem(cartId: number, itemId: number): Promise<{ code: number; data: string }> {
    return this.http.delete(`/cart/${cartId}/detail/${itemId}.json`);
  }
}
