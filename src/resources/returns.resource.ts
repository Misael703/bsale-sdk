import { BaseResource } from './base.resource';
import type {
  BsaleReturn,
  BsaleReturnDetail,
  BsaleReturnCreatePayload,
  BsaleReturnAnnulment,
  BsaleReturnAnnulmentPayload,
  BsaleListResponse,
  BsaleQueryParams,
} from '../types';

/** Devoluciones (notas de crédito y notas de débito al anular). */
export class ReturnsResource extends BaseResource<BsaleReturn> {
  protected readonly path = 'returns';

  /** Lista los detalles de una devolución. */
  async getDetails(
    returnId: number,
    params?: BsaleQueryParams,
  ): Promise<BsaleListResponse<BsaleReturnDetail>> {
    return this.http.get<BsaleListResponse<BsaleReturnDetail>>(
      `/returns/${returnId}/details.json`,
      params,
    );
  }

  /** Obtiene un detalle individual. */
  async getDetailById(returnId: number, detailId: number): Promise<BsaleReturnDetail> {
    return this.http.get<BsaleReturnDetail>(
      `/returns/${returnId}/details/${detailId}.json`,
    );
  }

  /** Crea una devolución (nota de crédito). */
  async create(data: BsaleReturnCreatePayload): Promise<BsaleReturn> {
    return this.http.post<BsaleReturn>('/returns.json', data);
  }

  /**
   * Anula una devolución generando una nota de débito.
   * @param returnId ID de la devolución a anular
   */
  async annul(returnId: number, data: BsaleReturnAnnulmentPayload): Promise<BsaleReturnAnnulment> {
    return this.http.post<BsaleReturnAnnulment>(
      `/returns/${returnId}/annulments.json`,
      data,
    );
  }

  /** Lista las devoluciones (NC) que referencian a un documento original. */
  async listByReferenceDocument(documentId: number): Promise<BsaleListResponse<BsaleReturn>> {
    return this.list({ referencedocumentid: documentId });
  }
}
