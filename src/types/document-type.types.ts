/** Tipo de documento (boleta, factura, NC, NDb, guía, etc.). */
export interface BsaleDocumentType {
  readonly id: number;
  readonly name: string;
  readonly initialNumber: number;
  /** Código tributario SII como string (ej. "33", "39", "61"). */
  readonly codeSii: string;
  readonly isElectronicDocument: 0 | 1;
  readonly breakdownTax: 0 | 1;
  /** 0=venta, 1=devolución, 2=despacho, 3=liquidación. */
  readonly use: 0 | 1 | 2 | 3;
  readonly isSalesNote: 0 | 1;
  readonly isExempt: 0 | 1;
  readonly restrictsTax: 0 | 1;
  readonly useClient: 0 | 1;
  readonly messageBodyFormat?: string | null;
  readonly thermalPrinter: 0 | 1;
  readonly state: 0 | 1;
  readonly copyNumber: number;
  readonly isCreditNote: 0 | 1;
  readonly continuedHigh: 0 | 1;
  readonly ledgerAccount?: string | null;
  readonly ipadPrint: 0 | 1;
  /** Tipo mixto en API real: a veces string, a veces 0/1. */
  readonly ipadPrintHigh: string | 0 | 1;
  readonly book_type?: { readonly id: string; readonly href: string };
  readonly href: string;
}

/** Payload `PUT /document_types.json` (path sin ID — se identifica por `id` en body). */
export interface BsaleUpdateDocumentTypePayload {
  readonly id: number;
  readonly name?: string;
  readonly state?: 0 | 1;
  readonly useClient?: 0 | 1;
}

/** Response del endpoint `/document_types/caf.json`. */
export interface BsaleCaf {
  readonly startDate: number;
  readonly expirationDate: number;
  readonly startNumber: number;
  readonly endNumber: number;
  readonly lastNumberUsed: number;
  readonly numbersAvailable: number;
  readonly expired: boolean;
}

/** Response del endpoint `/document_types/number_availables.json`. */
export interface BsaleNumbersAvailable {
  /** Snake_case literal en la API — respetar. */
  readonly numbers_available: number;
  readonly last: number;
}
