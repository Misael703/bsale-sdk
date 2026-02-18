/** Bsale stock consumption entity */
export interface BsaleStockConsumption {
  readonly id: number;
  readonly admissionDate: number;
  readonly document?: string;
  readonly note?: string;
  readonly imagestionCcWorked: number;
  readonly imagestionCcDocId: number;
  readonly state: number;
  readonly office?: {
    readonly id: number;
    readonly href: string;
  };
  readonly details?: {
    readonly href: string;
  };
  readonly href: string;
}

/** Detail line for a stock consumption */
export interface BsaleStockConsumptionDetail {
  readonly variantId: number;
  readonly quantity: number;
}

/** Payload for creating a stock consumption */
export interface BsaleStockConsumptionPayload {
  readonly officeId: number;
  readonly admissionDate?: number;
  readonly document?: string;
  readonly note?: string;
  readonly details: BsaleStockConsumptionDetail[];
}
