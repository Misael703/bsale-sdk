import { BaseResource } from './base.resource';
import type { BsaleSaleCondition } from '../types';

/** Condiciones de venta (plazos a crédito). Solo lectura. */
export class SaleConditionsResource extends BaseResource<BsaleSaleCondition> {
  protected readonly path = 'sale_conditions';
}
