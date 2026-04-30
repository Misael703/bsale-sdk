import { BaseResource } from './base.resource';
import type {
  BsalePayment,
  BsalePaymentCreatePayload,
  BsalePaymentGrouped,
  BsaleClientPurchase,
  BsaleUnpaidDocumentsResponse,
  BsaleQueryParams,
} from '../types';

/**
 * Pagos aplicados a documentos.
 *
 * Solo se pueden crear pagos sobre documentos cuya forma de pago original sea
 * de tipo crédito. No hay PUT ni DELETE — los pagos son inmutables.
 */
export class PaymentsResource extends BaseResource<BsalePayment> {
  protected readonly path = 'payments';

  /** Crea un pago. El `documentId` debe corresponder a un documento a crédito. */
  async create(data: BsalePaymentCreatePayload): Promise<BsalePayment> {
    return this.http.post<BsalePayment>('/payments.json', data);
  }

  /** Pagos agrupados por forma de pago — útil para reportería de cierre. */
  async getGroupedByPaymentTypes(
    params?: BsaleQueryParams,
  ): Promise<ReadonlyArray<BsalePaymentGrouped>> {
    return this.http.get<ReadonlyArray<BsalePaymentGrouped>>(
      '/payments/group_payment_types.json',
      params,
    );
  }

  /**
   * Documentos de venta del cliente. Pasar `clientId` o `code` (RUT).
   * Endpoint: `GET /clients/purchases.json` (path bajo `/clients` pero
   * conceptualmente parte de pagos/cobranzas).
   */
  async getClientPurchases(
    query: { clientId?: number; code?: string },
  ): Promise<ReadonlyArray<BsaleClientPurchase>> {
    return this.http.get<ReadonlyArray<BsaleClientPurchase>>('/clients/purchases.json', {
      ...(query.clientId !== undefined ? { clientid: query.clientId } : {}),
      ...(query.code !== undefined ? { code: query.code } : {}),
    });
  }

  /**
   * Documentos pendientes de pago de un cliente, separados en vencidos y por vencer.
   * Pasar `comparisonDate` para definir el corte (default: ahora).
   */
  async getClientUnpaidDocuments(query: {
    clientId?: number;
    code?: string;
    comparisonDate?: number;
  }): Promise<BsaleUnpaidDocumentsResponse> {
    return this.http.get<BsaleUnpaidDocumentsResponse>('/clients/unpaid_documents.json', {
      ...(query.clientId !== undefined ? { clientid: query.clientId } : {}),
      ...(query.code !== undefined ? { code: query.code } : {}),
      ...(query.comparisonDate !== undefined ? { comparisondate: query.comparisonDate } : {}),
    });
  }
}
