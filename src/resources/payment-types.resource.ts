import { BaseResource } from './base.resource';
import type { BsalePaymentType } from '../types';

/** Resource for querying Bsale payment types (read-only) */
export class PaymentTypesResource extends BaseResource<BsalePaymentType> {
  protected readonly path = 'payment_types';
}
