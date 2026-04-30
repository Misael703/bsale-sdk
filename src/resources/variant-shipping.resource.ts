import type { HttpClient } from '../client/http-client';
import type {
  BsaleVariantShipping,
  BsaleCreateVariantShippingPayload,
  BsaleUpdateVariantShippingPayload,
} from '../types';

/**
 * Medidas de envío de variantes.
 *
 * **Atención al typo histórico**: el response trae `deph` (sin "t"); el
 * payload de POST/PUT usa `depth`. El SDK respeta ambos.
 */
export class VariantShippingResource {
  constructor(private readonly http: HttpClient) {}

  /** Medidas de las variantes asociadas a una descripción web. */
  async getByMarketInfo(
    marketInfoId: number,
  ): Promise<{ code: number; data: ReadonlyArray<BsaleVariantShipping> }> {
    return this.http.get(`/v2/products/market_info/${marketInfoId}/variant_shipping.json`);
  }

  /** Crea las medidas para una variante. */
  async create(
    data: BsaleCreateVariantShippingPayload,
  ): Promise<{ code: number; data: BsaleVariantShipping }> {
    return this.http.post('/v2/variants/shipping.json', data);
  }

  /** Actualiza las medidas de una variante. */
  async update(
    variantId: number,
    data: BsaleUpdateVariantShippingPayload,
  ): Promise<{ code: number; data: BsaleVariantShipping }> {
    return this.http.put(`/v2/variants/${variantId}/shipping.json`, data);
  }
}
