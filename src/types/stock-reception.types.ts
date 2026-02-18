/** Bsale stock reception entity */
export interface BsaleStockReception {
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

/** Detail line for a stock reception */
export interface BsaleStockReceptionDetail {
  readonly variantId: number;
  readonly quantity: number;
  readonly cost?: number;
}

/** Payload for creating a stock reception */
export interface BsaleStockReceptionPayload {
  readonly officeId: number;
  readonly admissionDate?: number;
  readonly document?: string;
  readonly note?: string;
  readonly details: BsaleStockReceptionDetail[];
}
