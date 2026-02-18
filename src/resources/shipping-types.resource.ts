import { BaseResource } from './base.resource';
import type { BsaleShippingType } from '../types';

/** Resource for managing Bsale shipping types (tipos de despacho, read-only) */
export class ShippingTypesResource extends BaseResource<BsaleShippingType> {
  protected readonly path = 'shipping_types';
}
