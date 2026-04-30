import { BaseResource } from './base.resource';
import { HttpClient } from '../client/http-client';
import type {
  BsaleThirdPartyDocument,
  BsaleClaimPayload,
  BsaleClaimResponse,
  BsaleClaimStatusItem,
  BsaleClaimQuery,
} from '../types';

/**
 * Documentos de terceros (compras recibidas).
 *
 * Los endpoints de aceptación/reclamo (`/dtes/claims.json`) viven en
 * `bsp-api.bsale.io`, no en `api.bsale.io`. El resource recibe un segundo
 * `HttpClient` (`bspHttp`) para esos endpoints.
 */
export class ThirdPartyDocumentsResource extends BaseResource<BsaleThirdPartyDocument> {
  protected readonly path = 'third_party_documents';

  constructor(
    http: HttpClient,
    private readonly bspHttp?: HttpClient,
  ) {
    super(http);
  }

  /** Acepta o reclama un DTE recibido. Devuelve `trackingNumber` para consultar status. */
  async submitClaim(data: BsaleClaimPayload): Promise<BsaleClaimResponse> {
    if (!this.bspHttp) {
      throw new Error('submitClaim requires the bsp HttpClient (bsp-api.bsale.io)');
    }
    return this.bspHttp.post<BsaleClaimResponse>('/dtes/claims.json', data);
  }

  /**
   * Consulta el estado de un claim.
   * Por `trackingNumber`: retorna objeto único.
   * Por `documentCode` + `documentNumber`: retorna array.
   */
  async getClaimStatus(
    query: BsaleClaimQuery,
  ): Promise<{
    code: number;
    data: BsaleClaimStatusItem | ReadonlyArray<BsaleClaimStatusItem>;
  }> {
    if (!this.bspHttp) {
      throw new Error('getClaimStatus requires the bsp HttpClient (bsp-api.bsale.io)');
    }
    const params: Record<string, unknown> = {};
    if ('trackingNumber' in query) {
      params.tracking_number = query.trackingNumber;
    } else {
      params.document_code = query.documentCode;
      params.document_number = query.documentNumber;
    }
    return this.bspHttp.get('/dtes/claims.json', params);
  }
}
