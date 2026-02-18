import { BaseResource } from './base.resource';
import type { BsaleDocumentType } from '../types';

/** Resource for querying Bsale document types (read-only) */
export class DocumentTypesResource extends BaseResource<BsaleDocumentType> {
  protected readonly path = 'document_types';
}
