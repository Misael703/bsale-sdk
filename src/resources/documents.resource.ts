import { BaseResource } from './base.resource';
import type {
  BsaleDocument,
  BsaleDocumentCreatePayload,
  BsaleDocumentDetailItem,
  BsaleDocumentReferenceItem,
  BsaleDocumentTaxItem,
  BsaleDocumentSellerItem,
  BsaleDocumentAttributeItem,
  BsaleDocumentSummary,
  BsaleDocumentCost,
  BsaleListResponse,
  BsaleQueryParams,
} from '../types';

/** Documentos tributarios (facturas, boletas, NC, NDb, guías, etc.). */
export class DocumentsResource extends BaseResource<BsaleDocument> {
  protected readonly path = 'documents';

  /** Crea un documento. */
  async create(data: BsaleDocumentCreatePayload): Promise<BsaleDocument> {
    return this.http.post<BsaleDocument>('/documents.json', data);
  }

  /**
   * Documento + todas sus líneas en un solo flujo, optimizado en cantidad de requests:
   * usa `expand=details` para traer doc + primeros 25 detalles en la misma llamada, y
   * pagina el resto sólo si el documento tiene más de 25 líneas.
   *
   * Costo en requests:
   * - ≤ 25 líneas → 1 request total.
   * - N > 25 líneas → `1 + ⌈(N-25)/50⌉` requests.
   *
   * @param id - ID del documento.
   * @param options.expand - Sub-recursos adicionales a expandir (ej. `['user']`).
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
  ): Promise<{ document: BsaleDocument; details: BsaleDocumentDetailItem[] }> {
    const expandList = ['details', ...(options?.expand ?? [])];
    const requestOptions =
      options?.signal || options?.skipCache
        ? { signal: options.signal, skipCache: options.skipCache }
        : undefined;

    const document = await this.getById(id, { expand: expandList.join(',') }, requestOptions);

    const raw = document as BsaleDocument & {
      details?: BsaleListResponse<BsaleDocumentDetailItem> | { href: string };
    };
    const embedded =
      raw.details && 'items' in raw.details
        ? (raw.details as BsaleListResponse<BsaleDocumentDetailItem>)
        : undefined;

    const details = await this.paginateSubresource<BsaleDocumentDetailItem>(
      `/documents/${id}/details.json`,
      {
        embedded,
        signal: options?.signal,
        skipCache: options?.skipCache,
      },
    );

    return { document, details };
  }

  /**
   * Elimina un documento **no-electrónico**. Requiere `officeId` como query param.
   * Documentos electrónicos no se pueden eliminar via API.
   */
  async delete(id: number, officeId: number): Promise<void> {
    await this.http.delete(`/documents/${id}.json?officeId=${officeId}`);
  }

  /** Lista documentos en un rango de fechas (atajo sobre `emissiondaterange`). */
  async getByDateRange(
    from: number,
    to: number,
    params?: BsaleQueryParams,
  ): Promise<BsaleListResponse<BsaleDocument>> {
    return this.list({ ...params, emissiondaterange: `[${from},${to}]` });
  }

  /** Lista los items (detalles) de un documento. */
  async getDetails(
    documentId: number,
    params?: BsaleQueryParams,
  ): Promise<BsaleListResponse<BsaleDocumentDetailItem>> {
    return this.http.get<BsaleListResponse<BsaleDocumentDetailItem>>(
      `/documents/${documentId}/details.json`,
      params,
    );
  }

  /** Item individual del documento. */
  async getDetailById(
    documentId: number,
    detailId: number,
  ): Promise<BsaleDocumentDetailItem> {
    return this.http.get<BsaleDocumentDetailItem>(
      `/documents/${documentId}/details/${detailId}.json`,
    );
  }

  /** Resumen agregado de documentos. */
  async getSummary(
    params?: BsaleQueryParams,
  ): Promise<ReadonlyArray<BsaleDocumentSummary>> {
    return this.http.get<ReadonlyArray<BsaleDocumentSummary>>(
      '/documents/summary.json',
      params,
    );
  }

  /** Resumen específico de boletas electrónicas (RCOF). */
  async getSummaryTicket(
    params?: BsaleQueryParams,
  ): Promise<ReadonlyArray<BsaleDocumentSummary>> {
    return this.http.get<ReadonlyArray<BsaleDocumentSummary>>(
      '/documents/summary/ticket.json',
      params,
    );
  }

  /** Costos asociados a ventas despachadas. */
  async getCosts(params?: BsaleQueryParams): Promise<ReadonlyArray<BsaleDocumentCost>> {
    return this.http.get<ReadonlyArray<BsaleDocumentCost>>(
      '/documents/costs.json',
      params,
    );
  }

  /** Referencias electrónicas del documento. */
  async getReferences(
    documentId: number,
    params?: BsaleQueryParams,
  ): Promise<BsaleListResponse<BsaleDocumentReferenceItem>> {
    return this.http.get<BsaleListResponse<BsaleDocumentReferenceItem>>(
      `/documents/${documentId}/references.json`,
      params,
    );
  }

  /** Referencia individual. */
  async getReferenceById(
    documentId: number,
    refId: number,
  ): Promise<BsaleDocumentReferenceItem> {
    return this.http.get<BsaleDocumentReferenceItem>(
      `/documents/${documentId}/references/${refId}.json`,
    );
  }

  /** Impuestos del documento. */
  async getTaxes(
    documentId: number,
    params?: BsaleQueryParams,
  ): Promise<BsaleListResponse<BsaleDocumentTaxItem>> {
    return this.http.get<BsaleListResponse<BsaleDocumentTaxItem>>(
      `/documents/${documentId}/document_taxes.json`,
      params,
    );
  }

  /** Impuesto específico. */
  async getTaxById(documentId: number, taxId: number): Promise<BsaleDocumentTaxItem> {
    return this.http.get<BsaleDocumentTaxItem>(
      `/documents/${documentId}/document_taxes/${taxId}.json`,
    );
  }

  /** Vendedores asociados al documento (puede haber varios). */
  async getSellers(
    documentId: number,
    params?: BsaleQueryParams,
  ): Promise<BsaleListResponse<BsaleDocumentSellerItem>> {
    return this.http.get<BsaleListResponse<BsaleDocumentSellerItem>>(
      `/documents/${documentId}/sellers.json`,
      params,
    );
  }

  /** Atributos dinámicos no-electrónicos del documento. */
  async getAttributes(
    documentId: number,
    params?: BsaleQueryParams,
  ): Promise<BsaleListResponse<BsaleDocumentAttributeItem>> {
    return this.http.get<BsaleListResponse<BsaleDocumentAttributeItem>>(
      `/documents/${documentId}/attributes.json`,
      params,
    );
  }
}
