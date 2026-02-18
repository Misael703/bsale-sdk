import { BaseResource } from './base.resource';
import type { BsaleThirdPartyDocument } from '../types';

/** Resource for managing Bsale third-party documents (documentos de terceros) */
export class ThirdPartyDocumentsResource extends BaseResource<BsaleThirdPartyDocument> {
  protected readonly path = 'third_party_documents';
}
