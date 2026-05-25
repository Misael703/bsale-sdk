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
