/** Bsale stock entity */
export interface BsaleStock {
  readonly id: number;
  readonly quantity: number;
  readonly quantityReserved: number;
  readonly quantityAvailable: number;
  /** Sin `expand` el `id` llega como **string** (verificado en vivo 2026-09). */
  readonly variant?: {
    readonly id: string;
    readonly href: string;
  };
  /** Sin `expand` el `id` llega como **string** (verificado en vivo 2026-09). */
  readonly office?: {
    readonly id: string;
    readonly href: string;
  };
  readonly href: string;
}
