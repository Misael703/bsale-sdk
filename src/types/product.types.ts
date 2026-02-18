/** Bsale product entity */
export interface BsaleProduct {
  readonly id: number;
  readonly name: string;
  readonly description?: string;
  readonly classification: number;
  readonly ledgerAccount?: string;
  readonly costCenter?: string;
  readonly allowDecimal: number;
  readonly stockControl: number;
  readonly printDetailPack: number;
  readonly state: number;
  readonly product_type?: {
    readonly id: number;
    readonly href: string;
  };
  readonly product_taxes?: {
    readonly href: string;
  };
  readonly variants?: {
    readonly href: string;
  };
  readonly href: string;
}

/** Payload for creating or updating a product */
export interface BsaleProductPayload {
  readonly name?: string;
  readonly description?: string;
  readonly classification?: number;
  readonly ledgerAccount?: string;
  readonly costCenter?: string;
  readonly allowDecimal?: number;
  readonly stockControl?: number;
  readonly printDetailPack?: number;
  readonly state?: number;
  readonly productTypeId?: number;
}
