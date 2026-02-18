/** Bsale shipping (despacho) entity */
export interface BsaleShipping {
  readonly id: number;
  readonly shippingDate: number;
  readonly address?: string;
  readonly municipality?: string;
  readonly city?: string;
  readonly recipient?: string;
  readonly state: number;
  readonly office?: {
    readonly id: number;
    readonly href: string;
  };
  readonly shipping_type?: {
    readonly id: number;
    readonly href: string;
  };
  readonly guide?: {
    readonly id: number;
    readonly href: string;
  };
  readonly document?: {
    readonly id: number;
    readonly href: string;
  };
  readonly href: string;
}

/** Payload for creating or updating a shipping */
export interface BsaleShippingPayload {
  readonly shippingDate?: number;
  readonly address?: string;
  readonly municipality?: string;
  readonly city?: string;
  readonly recipient?: string;
  readonly state?: number;
  readonly officeId?: number;
  readonly shippingTypeId?: number;
  readonly guideId?: number;
  readonly documentId?: number;
}
