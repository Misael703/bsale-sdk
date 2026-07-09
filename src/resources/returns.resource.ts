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
   * Devolución + todos sus detalles en un solo flujo, optimizado en cantidad de
   * requests: usa `expand=details` para traer la devolución + primeros 25 detalles
   * en la misma llamada, y pagina el resto sólo si tiene más de 25 líneas.
   *
   * El embed de `expand` capa la colección anidada a 25 items silenciosamente; el
   * endpoint dedicado `/returns/{id}/details.json` respeta `limit` hasta 50, así que
   * se pagina hasta agotar y `details` refleja el total real (no un conteo truncado).
   *
   * Costo en requests:
   * - ≤ 25 líneas → 1 request total.
   * - N > 25 líneas → `1 + ⌈(N-25)/50⌉` requests.
   *
   * La devolución se retorna bajo la clave `returnDoc` (no `return`, palabra
   * reservada) — es el `BsaleReturn` completo.
   *
   * @param id - ID de la devolución.
   * @param options.expand - Sub-recursos adicionales a expandir (ej. `['credit_note']`).
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
  ): Promise<{ returnDoc: BsaleReturn; details: BsaleReturnDetail[] }> {
    const expandList = ['details', ...(options?.expand ?? [])];
    const requestOptions =
      options?.signal || options?.skipCache
        ? { signal: options.signal, skipCache: options.skipCache }
        : undefined;

    const returnDoc = await this.getById(id, { expand: expandList.join(',') }, requestOptions);

    const raw = returnDoc as BsaleReturn & {
      details?: BsaleListResponse<BsaleReturnDetail> | { href: string };
    };
    const embedded =
      raw.details && 'items' in raw.details
        ? (raw.details as BsaleListResponse<BsaleReturnDetail>)
        : undefined;

    const details = await this.paginateSubresource<BsaleReturnDetail>(
      `/returns/${id}/details.json`,
      {
        embedded,
        signal: options?.signal,
        skipCache: options?.skipCache,
      },
    );

    return { returnDoc, details };
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
