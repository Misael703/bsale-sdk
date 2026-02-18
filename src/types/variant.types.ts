/** Bsale product variant entity */
export interface BsaleVariant {
  readonly id: number;
  readonly description: string;
  readonly unlimitedStock: number;
  readonly allowNegativeStock: number;
  readonly state: number;
  readonly barCode?: string;
  readonly code?: string;
  readonly serialNumber?: number;
  readonly product?: {
    readonly id: number;
    readonly href: string;
  };
  readonly attribute_values?: {
    readonly href: string;
  };
  readonly costs?: {
    readonly href: string;
  };
  readonly href: string;
}

/** Payload for creating or updating a variant */
export interface BsaleVariantPayload {
  readonly description?: string;
  readonly unlimitedStock?: number;
  readonly allowNegativeStock?: number;
  readonly state?: number;
  readonly barCode?: string;
  readonly code?: string;
  readonly productId?: number;
}
