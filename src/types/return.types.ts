/** Bsale return (devolución) entity */
export interface BsaleReturn {
  readonly href: string;
  readonly id: number;
  readonly code: string;
  readonly returnDate: number;
  readonly motive: string;
  /** Payment return method: 0=cash refund, 1=new sale payment, 2=credit line, 3=other */
  readonly type: number;
  readonly priceAdjustment: number;
  readonly editTexts: number;
  readonly amount: number;
  readonly office?: {
    readonly href: string;
    readonly id: number;
  };
  readonly reference_document?: {
    readonly href: string;
    readonly id: number;
  };
  readonly credit_note?: {
    readonly href: string;
    readonly id: number;
  };
  readonly details?: {
    readonly href: string;
  };
}

/** Bsale return detail entity */
export interface BsaleReturnDetail {
  readonly href: string;
  readonly id: number;
  readonly quantity: number;
  readonly quantityDevStock: number;
  readonly variantStock: number;
  readonly variantCost: number;
}

/** Detail line for creating a return */
export interface BsaleReturnDetailPayload {
  /** Original document detail ID */
  readonly documentDetailId: number;
  readonly quantity: number;
  /** Net unit value */
  readonly unitValue?: string;
  readonly comment?: string;
  readonly additionalText?: string;
}

/** Payment info for a return (when type=1) */
export interface BsaleReturnPayment {
  readonly recordDate?: number;
  readonly amount: number;
  readonly paymentTypeId: number;
  readonly documentTypeId?: number;
  readonly number?: number;
}

/** Payload for creating a return */
export interface BsaleReturnCreatePayload {
  readonly documentTypeId: number;
  readonly officeId: number;
  readonly referenceDocumentId: number;
  readonly emissionDate?: number;
  readonly expirationDate?: number;
  readonly motive?: string;
  readonly declareSii?: number;
  readonly priceAdjustment?: number;
  readonly editTexts?: number;
  /** 0=cash refund, 1=new sale payment, 2=credit line, 3=other */
  readonly type?: number;
  readonly client?: {
    readonly code?: string;
    readonly city?: string;
    readonly company?: string;
    readonly municipality?: string;
    readonly activity?: string;
    readonly address?: string;
    readonly firstName?: string;
    readonly lastName?: string;
  };
  readonly details: BsaleReturnDetailPayload[];
  readonly payments?: BsaleReturnPayment[];
}

/** Payload for annulling a return (creates a debit note) */
export interface BsaleReturnAnnulmentPayload {
  readonly documentTypeId: number;
  readonly referenceDocumentId: number;
  readonly emissionDate?: number;
  readonly expirationDate?: number;
  readonly declareSii?: number;
}

/** Response from annulling a return */
export interface BsaleReturnAnnulment {
  readonly href: string;
  readonly id: number;
  readonly annulmentDate: number;
  readonly amount: number;
  readonly office?: {
    readonly href: string;
    readonly id: number;
  };
  readonly debit_note?: {
    readonly href: string;
    readonly id: number;
  };
}
