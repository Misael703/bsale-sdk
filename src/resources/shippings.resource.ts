import { BaseResource } from './base.resource';
import type {
  BsaleShipping,
  BsaleShippingDetail,
  BsaleCreateShippingPayload,
  BsaleListResponse,
  BsaleQueryParams,
} from '../types';

/**
 * Despachos (guías de despacho DTE).
 *
 * Crear un despacho descuenta stock automáticamente; eliminarlo lo revierte.
 * No existe endpoint PUT en la API oficial.
 */
export class ShippingsResource extends BaseResource<BsaleShipping> {
  protected readonly path = 'shippings';

  /** Crea un despacho. Genera automáticamente la guía DTE asociada. */
  async create(data: BsaleCreateShippingPayload): Promise<BsaleShipping> {
    return this.http.post<BsaleShipping>('/shippings.json', data);
  }

  /**
   * Despacho + todas sus líneas en un solo flujo, optimizado en cantidad de requests:
   * usa `expand=details` para traer el despacho + primeros 25 detalles en la misma
   * llamada, y pagina el resto sólo si tiene más de 25 líneas.
   *
   * El embed de `expand` capa la colección anidada a 25 items silenciosamente; el
   * endpoint dedicado `/shippings/{id}/details.json` respeta `limit` hasta 50, así que
   * se pagina hasta agotar y `details` refleja el total real (no un conteo truncado).
   *
   * Costo en requests:
   * - ≤ 25 líneas → 1 request total.
   * - N > 25 líneas → `1 + ⌈(N-25)/50⌉` requests.
   *
   * @param id - ID del despacho.
   * @param options.expand - Sub-recursos adicionales a expandir (ej. `['guide']`).
   *   `details` siempre se incluye automáticamente.
   * @param options.signal - AbortSignal propagado a todas las requests.
   * @param options.skipCache - Bypass de cache.
   */
  async getWithDetails(
    id: number,
    options?: {
      readonly expand?: ReadonlyArray<string>;
      readonly signal?: AbortSignal;
      readonly skipCache?: boolean;
    },
  ): Promise<{ shipping: BsaleShipping; details: BsaleShippingDetail[] }> {
    const expandList = ['details', ...(options?.expand ?? [])];
    const requestOptions =
      options?.signal || options?.skipCache
        ? { signal: options.signal, skipCache: options.skipCache }
        : undefined;

    const shipping = await this.getById(id, { expand: expandList.join(',') }, requestOptions);

    const raw = shipping as BsaleShipping & {
      details?: BsaleListResponse<BsaleShippingDetail> | { href: string };
    };
    const embedded =
      raw.details && 'items' in raw.details
        ? (raw.details as BsaleListResponse<BsaleShippingDetail>)
        : undefined;

    const details = await this.paginateSubresource<BsaleShippingDetail>(
      `/shippings/${id}/details.json`,
      {
        embedded,
        signal: options?.signal,
        skipCache: options?.skipCache,
      },
    );

    return { shipping, details };
  }

  /**
   * Anula un despacho. Pone `state=1` y **revierte el descuento de stock**.
   * Response: `{ status, data: <despacho con state=1> }`.
   */
  async delete(id: number): Promise<{ status: string; data: BsaleShipping }> {
    return this.http.delete<{ status: string; data: BsaleShipping }>(`/shippings/${id}.json`);
  }

  /** Lista los items de un despacho. */
  async getDetails(
    shippingId: number,
    params?: BsaleQueryParams,
  ): Promise<BsaleListResponse<BsaleShippingDetail>> {
    return this.http.get<BsaleListResponse<BsaleShippingDetail>>(
      `/shippings/${shippingId}/details.json`,
      params,
    );
  }

  /** Obtiene un item individual del despacho. */
  async getDetailById(shippingId: number, detailId: number): Promise<BsaleShippingDetail> {
    return this.http.get<BsaleShippingDetail>(
      `/shippings/${shippingId}/details/${detailId}.json`,
    );
  }

  /** Lista las guías de despacho asociadas a un documento (boleta/factura) original. */
  async listByDocument(documentId: number): Promise<BsaleListResponse<BsaleShipping>> {
    return this.list({ documentid: documentId });
  }
}
