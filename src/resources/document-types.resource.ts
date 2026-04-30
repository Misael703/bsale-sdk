import { BaseResource } from './base.resource';
import type {
  BsaleDocumentType,
  BsaleUpdateDocumentTypePayload,
  BsaleCaf,
  BsaleNumbersAvailable,
} from '../types';

/** Tipos de documento. */
export class DocumentTypesResource extends BaseResource<BsaleDocumentType> {
  protected readonly path = 'document_types';

  /**
   * Actualiza un tipo de documento.
   * **Anomalía**: el endpoint es `PUT /document_types.json` (sin ID en URL);
   * el ID va en el body. Solo `name`, `state`, `useClient` son editables.
   */
  async update(data: BsaleUpdateDocumentTypePayload): Promise<BsaleDocumentType> {
    return this.http.put<BsaleDocumentType>('/document_types.json', data);
  }

  /**
   * Estado del CAF (Código de Asignación de Folios) del SII.
   * Pasar `codeSii` o `documentTypeId` (uno requerido).
   */
  async getCaf(params: {
    codeSii?: string | number;
    documentTypeId?: number;
    nextNumber?: number;
  }): Promise<BsaleCaf> {
    const query: Record<string, unknown> = {};
    if (params.codeSii !== undefined) query.codesii = params.codeSii;
    if (params.documentTypeId !== undefined) query.documenttypeid = params.documentTypeId;
    if (params.nextNumber !== undefined) query.nextnumber = params.nextNumber;
    return this.http.get<BsaleCaf>('/document_types/caf.json', query);
  }

  /**
   * Folios disponibles para un tipo de documento.
   * Pasar `codeSii` o `documentTypeId` (uno requerido).
   */
  async getNumberAvailables(params: {
    codeSii?: string | number;
    documentTypeId?: number;
  }): Promise<BsaleNumbersAvailable> {
    const query: Record<string, unknown> = {};
    if (params.codeSii !== undefined) query.codesii = params.codeSii;
    if (params.documentTypeId !== undefined) query.documenttypeid = params.documentTypeId;
    return this.http.get<BsaleNumbersAvailable>('/document_types/number_availables.json', query);
  }
}
