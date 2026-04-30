/** Forma de pago. */
export interface BsalePaymentType {
  readonly id: number;
  readonly name: string;
  readonly isVirtual: 0 | 1;
  readonly isCheck: 0 | 1;
  readonly maxCheck: number | null;
  readonly isCreditNote: 0 | 1;
  readonly isClientCredit: 0 | 1;
  readonly isCash: 0 | 1;
  readonly isCreditMemo: 0 | 1;
  readonly state: 0 | 1;
  readonly maxClientCuota?: number;
  readonly ledgerAccount?: string | null;
  readonly ledgerCode?: string | null;
  readonly isAgreementBank?: 0 | 1;
  readonly agreementCode?: string;
  readonly href: string;
}

/** Payload `POST /payment_types.json`. */
export interface BsaleCreatePaymentTypePayload {
  readonly name: string;
  readonly isCheck?: 0 | 1;
  /** Requerido si `isCheck=1`. */
  readonly maxCheck?: number;
  readonly isCash?: 0 | 1;
  readonly isClientCredit?: 0 | 1;
  readonly isCreditNote?: 0 | 1;
  readonly isCreditMemo?: 0 | 1;
  readonly ledgerAccount?: string;
  readonly ledgerCode?: string;
}
