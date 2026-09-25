/** Bsale price list entity */
export interface BsalePriceList {
  /** Llega como **string** (`"310"`, verificado en vivo 2026-09) aunque la doc lo muestre numérico. */
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly state: number;
  readonly coin?: {
    readonly id: number;
    readonly href: string;
  };
  readonly details?: {
    readonly href: string;
  };
  readonly href: string;
}

/** Price list detail (variant price within a price list) */
export interface BsalePriceListDetail {
  readonly id: number;
  readonly variantValue: number;
  readonly variantValueWithTaxes: number;
  readonly variant?: {
    readonly id: number;
    readonly href: string;
  };
  readonly href: string;
}

/** Payload for updating a price list detail */
export interface BsalePriceListDetailPayload {
  readonly variantValue?: number;
  readonly variantValueWithTaxes?: number;
}
