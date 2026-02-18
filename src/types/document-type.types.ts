/** Bsale document type entity (boleta, factura, nota de crédito, etc.) */
export interface BsaleDocumentType {
  readonly id: number;
  readonly name: string;
  readonly initialNumber: number;
  readonly codeSii: number;
  readonly isElectronicDocument: number;
  readonly breakdownTax: number;
  readonly use: number;
  readonly isSalesNote: number;
  readonly isExempt: number;
  readonly state: number;
  readonly href: string;
}
