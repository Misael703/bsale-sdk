/** Pago aplicado a un documento. */
export interface BsalePayment {
  readonly id: number;
  /** Puede venir como timestamp o como string vacío en algunos endpoints. */
  readonly recordDate: number | string;
  readonly amount: number | string;
  readonly operationNumber?: string | null;
  readonly accountingDate?: number | string;
  readonly checkDate?: number | null;
  readonly checkNumber?: number | null;
  readonly checkAmount?: number | string | null;
  readonly checkTaken?: 0 | 1;
  readonly isCreditPayment?: 0 | 1;
  readonly createdAt?: number;
  readonly state: 0 | 1;
  readonly payment_type?: { readonly id: string; readonly href: string };
  readonly document?: { readonly id: string; readonly href: string };
  readonly documents?: ReadonlyArray<{ readonly id: string; readonly href: string }>;
  readonly office?: { readonly id: string; readonly href: string };
  readonly user?: { readonly id: string; readonly href: string };
  readonly href: string;
}

/** Atributo dinámico embebido en POST de pago. */
export interface BsalePaymentDynamicAttribute {
  readonly description: string;
  readonly dynamicAttributeId: number;
}

/** Payload `POST /payments.json`. */
export interface BsalePaymentCreatePayload {
  readonly recordDate: number;
  readonly documentId: number;
  readonly amount: number;
  readonly paymentTypeId: number;
  readonly dynamicAttributes?: ReadonlyArray<BsalePaymentDynamicAttribute>;
}

/** Item de `/payments/group_payment_types.json`. */
export interface BsalePaymentGrouped {
  readonly recordDate: number;
  readonly paymentTypeTotalAmount: number;
  readonly paymentTypeId: number;
  readonly paymentTypeName: string;
  readonly paymentLedgerAccount?: string | null;
  readonly isCheck: 0 | 1;
  readonly isCreditNote: 0 | 1;
  readonly isClientCredit: 0 | 1;
  readonly isCash: 0 | 1;
  readonly isCreditMemo: 0 | 1;
  readonly codesii: string;
  readonly officeId: number;
  readonly officeName: string;
  readonly officeCostCenter?: string;
  readonly details: ReadonlyArray<unknown>;
}

/** Documento de venta de un cliente (response de `/clients/purchases`). */
export type BsaleClientPurchase = Record<string, unknown>;

/** Item de `unpaid_documents`. */
export interface BsaleUnpaidDocument {
  readonly id: number;
  readonly name: string;
  readonly number: number;
  readonly emissionDate: number;
  readonly expirationDate: number;
  readonly totalAmount: number;
  readonly totalAmountOwed: number;
  readonly href: string;
}

/** Response de `/clients/unpaid_documents.json`. */
export interface BsaleUnpaidDocumentsResponse {
  readonly overdueDebt: number;
  readonly upcomingDebt: number;
  readonly totalDebt: number;
  readonly client: {
    readonly id: number;
    readonly firstName?: string;
    readonly lastName?: string;
    readonly code?: string;
    readonly company?: string;
    readonly href: string;
  };
  readonly overdue_documents: ReadonlyArray<BsaleUnpaidDocument>;
  readonly upcoming_documents: ReadonlyArray<BsaleUnpaidDocument>;
}
