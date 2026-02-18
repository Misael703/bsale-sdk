/** Bsale shipping type (tipo de despacho) entity */
export interface BsaleShippingType {
  readonly href: string;
  readonly id: number;
  readonly name: string;
  readonly codeSii?: string;
  readonly useDestinationOffice?: number;
  readonly state: number;
}
