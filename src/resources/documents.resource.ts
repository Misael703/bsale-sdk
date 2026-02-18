import { BaseResource } from './base.resource';
import type { BsaleDocument, BsaleDocumentCreatePayload, BsaleListResponse, BsaleQueryParams } from '../types';

/** Resource for managing Bsale documents (invoices, receipts, etc.) */
export class DocumentsResource extends BaseResource<BsaleDocument> {
  protected readonly path = 'documents';

  /**
   * Creates a new document.
   * @param data - Document creation payload
   * @returns The created document
   */
  async create(data: BsaleDocumentCreatePayload): Promise<BsaleDocument> {
    return this.http.post<BsaleDocument>('/documents.json', data);
  }

  /**
   * Lists documents within a date range using Bsale's emissiondaterange filter.
   * @param from - Start date as Unix timestamp (seconds)
   * @param to - End date as Unix timestamp (seconds)
   * @param params - Optional additional query parameters
   * @returns Paginated list of documents
   */
  async getByDateRange(
    from: number,
    to: number,
    params?: BsaleQueryParams,
  ): Promise<BsaleListResponse<BsaleDocument>> {
    return this.list({ ...params, emissiondaterange: `[${from},${to}]` });
  }

  /**
   * Gets details (line items) for a specific document.
   * @param documentId - Document ID
   * @param params - Optional query parameters
   * @returns Document details
   */
  async getDetails(documentId: number, params?: BsaleQueryParams): Promise<unknown> {
    return this.http.get(`/documents/${documentId}/details.json`, params);
  }

  /**
   * Gets a summary of documents matching the given parameters.
   * @param params - Query parameters for filtering
   * @returns Summary data
   */
  async getSummary(params?: BsaleQueryParams): Promise<unknown> {
    return this.http.get('/documents/summary.json', params);
  }
}
