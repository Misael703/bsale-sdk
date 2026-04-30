import { BaseResource } from './base.resource';
import type { BsaleBookType } from '../types';

/** Tipos de libro tributario (Venta, Compra, Boleta). Solo lectura. */
export class BookTypesResource extends BaseResource<BsaleBookType> {
  protected readonly path = 'book_types';
}
