/** Bsale document entity */
export interface BsaleDocument {
  readonly id: number;
  readonly emissionDate: number;
  readonly expirationDate: number;
  readonly generationDate: number;
  readonly number: number;
  readonly serialNumber?: string;
  readonly trackingNumber?: string;
  readonly totalAmount: number;
  readonly netAmount: number;
  readonly taxAmount: number;
  readonly exemptAmount: number;
  readonly notExemptAmount: number;
  readonly urlPdf?: string;
  readonly urlXml?: string;
  readonly urlPublicView?: string;
  readonly urlTimbre?: string;
  readonly state: number;
  readonly document_type?: {
    readonly id: number;
    readonly href: string;
  };
  readonly client?: {
    readonly id: number;
    readonly href: string;
  };
  readonly office?: {
    readonly id: number;
    readonly href: string;
  };
  readonly details?: {
    readonly href: string;
  };
  readonly sellers?: {
    readonly href: string;
  };
  readonly href: string;
}

/** Detail line for a document */
export interface BsaleDocumentDetail {
  readonly variantId?: number;
  readonly netUnitValue?: number;
  readonly quantity?: number;
  readonly taxId?: string;
  readonly discount?: number;
  readonly comment?: string;
}

/** Payment information for a document */
export interface BsaleDocumentPayment {
  readonly paymentTypeId: number;
  readonly amount: number;
  readonly recordDate?: number;
}

/** Reference to another document */
export interface BsaleDocumentReference {
  readonly documentTypeId?: number;
  readonly number?: number;
  readonly referenceDate?: number;
  readonly reason?: string;
  readonly codeSii?: number;
}

/** Dispatch (shipping) information for a document */
export interface BsaleDocumentDispatch {
  readonly address?: string;
  readonly municipality?: string;
  readonly city?: string;
}

/** Payload for creating a new document */
export interface BsaleDocumentCreatePayload {
  readonly documentTypeId: number;
  readonly officeId?: number;
  readonly emissionDate?: number;
  readonly expirationDate?: number;
  readonly declareSii?: number;
  readonly priceListId?: number;
  readonly coinId?: number;
  readonly sendEmail?: number;
  readonly sellerId?: number;
  readonly client?: {
    readonly code?: string;
    readonly city?: string;
    readonly municipality?: string;
    readonly activity?: string;
    readonly company?: string;
    readonly address?: string;
    readonly email?: string;
    readonly firstName?: string;
    readonly lastName?: string;
  };
  readonly details: BsaleDocumentDetail[];
  readonly payments?: BsaleDocumentPayment[];
  readonly references?: BsaleDocumentReference[];
  readonly dispatch?: BsaleDocumentDispatch;
}
