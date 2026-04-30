/** Tipo de libro tributario SII (Venta, Compra, Boleta). */
export interface BsaleBookType {
  readonly id: number;
  readonly name: string;
  readonly dteProcess: 'Venta' | 'Compra' | 'Boleta' | string;
  readonly code: string;
  readonly state: 0 | 1;
  readonly href: string;
}
