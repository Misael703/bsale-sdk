/** Bsale stock entity */
export interface BsaleStock {
  readonly id: number;
  readonly quantity: number;
  readonly quantityReserved: number;
  readonly quantityAvailable: number;
  readonly variant?: {
    readonly id: number;
    readonly href: string;
  };
  readonly office?: {
    readonly id: number;
    readonly href: string;
  };
  readonly href: string;
}
