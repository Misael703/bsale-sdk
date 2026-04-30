import type { HttpClient } from '../client/http-client';
import type {
  BsalePaymentSuccessPayload,
  BsalePaymentFailPayload,
  BsalePaymentLogPayload,
  BsalePaymentPendingPayload,
  BsalePaymentGatewayResponse,
} from '../types';

/**
 * Pasarela de pagos (lado del Medio de Pago Externo / MPE).
 *
 * **Audiencia atípica**: este recurso es para que un proveedor de pasarela
 * (Mercado Pago, Webpay, Khipu, etc.) reporte transacciones a Bsale. Un SDK
 * típico de tenant **no lo usa**.
 *
 * Vive en host `bcash.bsale.io`. La auth es por `py_token` en el path —
 * **NO se envía header `access_token`**.
 */
export class PaymentsGatewayResource {
  constructor(private readonly http: HttpClient) {}

  async reportSuccess(
    pyToken: string,
    payload: BsalePaymentSuccessPayload,
  ): Promise<BsalePaymentGatewayResponse> {
    return this.http.post(`/payment/success/${pyToken}`, payload, { skipAuth: true });
  }

  async reportFail(
    pyToken: string,
    payload: BsalePaymentFailPayload,
  ): Promise<BsalePaymentGatewayResponse> {
    return this.http.post(`/payment/fail/${pyToken}`, payload, { skipAuth: true });
  }

  async submitLog(
    pyToken: string,
    payload: BsalePaymentLogPayload,
  ): Promise<BsalePaymentGatewayResponse> {
    return this.http.post(`/payment/log/${pyToken}`, payload, { skipAuth: true });
  }

  async reportPending(
    pyToken: string,
    payload: BsalePaymentPendingPayload,
  ): Promise<BsalePaymentGatewayResponse> {
    return this.http.post(`/payment/pending/${pyToken}`, payload, { skipAuth: true });
  }

  async getState(pyToken: string): Promise<BsalePaymentGatewayResponse> {
    return this.http.get(`/payment/state/${pyToken}`, undefined, { skipAuth: true });
  }
}
