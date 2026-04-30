import { BaseResource } from './base.resource';
import type {
  BsaleCurrency,
  BsaleExchangeRate,
  BsaleListResponse,
  BsaleQueryParams,
  BsaleDocument,
} from '../types';

/**
 * Monedas (path API: `/coins`).
 *
 * El SDK expone esto como `client.currencies` (más legible) pero el path real
 * es `coins`.
 */
export class CurrenciesResource extends BaseResource<BsaleCurrency> {
  protected readonly path = 'coins';

  /**
   * Tipo de cambio histórico para una fecha específica.
   * **Path inusual**: el timestamp va en el path, no como query param.
   */
  async getExchangeRate(currencyId: number, unixTimestamp: number): Promise<BsaleExchangeRate> {
    return this.http.get<BsaleExchangeRate>(
      `/coins/${currencyId}/exchange_rate/${unixTimestamp}.json`,
    );
  }

  /** Documentos de venta emitidos en esta moneda. */
  async getSales(
    currencyId: number,
    params?: { startdate?: number; enddate?: number } & BsaleQueryParams,
  ): Promise<BsaleListResponse<BsaleDocument>> {
    return this.http.get<BsaleListResponse<BsaleDocument>>(
      `/coins/${currencyId}/sales.json`,
      params,
    );
  }

  /** Atajo para obtener la moneda default del tenant. */
  async getDefault(): Promise<BsaleCurrency | undefined> {
    const response = await this.list({ default: true } as BsaleQueryParams);
    return response.items[0];
  }
}
