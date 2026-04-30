import type { HttpClient } from '../client/http-client';
import type {
  BsaleCourierOrder,
  BsaleCourierLogPayload,
  BsaleCourierLabelPayload,
  BsaleQueryParams,
} from '../types';

/**
 * Órdenes de envío para integración con couriers (e-commerce).
 *
 * Vive en host distinto: `courier.bsale.io`. Las órdenes se descubren vía
 * webhook (topic `courierOrder`) — el courier consulta y reporta progreso.
 *
 * **No confundir con [[shippings]]** (guías de despacho DTE).
 */
export class CourierOrdersResource {
  constructor(private readonly http: HttpClient) {}

  /** Detalle de una orden de envío. */
  async getById(id: number, params?: BsaleQueryParams): Promise<{ code: number; data: BsaleCourierOrder }> {
    return this.http.get(`/couriers/orders/${id}.json`, params);
  }

  /** Reporta un evento de estado del envío (despachado / entregado / con error). */
  async submitLog(payload: BsaleCourierLogPayload): Promise<unknown> {
    return this.http.post('/logs.json', payload);
  }

  /** Asigna tracking number + label tras crear el envío en el courier. */
  async setLabel(
    orderId: number,
    payload: Omit<BsaleCourierLabelPayload, 'orderId'>,
  ): Promise<unknown> {
    return this.http.put(`/couriers/orders/${orderId}/label.json`, {
      orderId,
      ...payload,
    });
  }
}
