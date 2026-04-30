import { BaseResource } from './base.resource';
import type { BsaleTax } from '../types';

/** Impuestos configurados (IVA, ILA, etc.). Solo lectura. */
export class TaxesResource extends BaseResource<BsaleTax> {
  protected readonly path = 'taxes';
}
