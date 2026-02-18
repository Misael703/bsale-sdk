import { BaseResource } from './base.resource';
import type { BsaleOffice } from '../types';

/** Resource for querying Bsale offices/branches (read-only) */
export class OfficesResource extends BaseResource<BsaleOffice> {
  protected readonly path = 'offices';
}
