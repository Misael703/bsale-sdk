/** Documento de terceros (compra recibida). */
export interface BsaleThirdPartyDocument {
  readonly href: string;
  readonly id: number;
  readonly codeSii: string;
  readonly emissionDate: number;
  readonly number: number;
  readonly clientCode: string;
  readonly clientActivity?: string;
  readonly exemptAmount: number;
  readonly netAmount: number;
  readonly iva: number;
  readonly ivaAmount: number;
  readonly ivaOutOfTimeAmount?: number;
  readonly specificTaxCode?: string | null;
  readonly specificTaxAmount?: string;
  readonly additionalTaxAmount?: string | null;
  readonly ivaNotRecoverableAmount?: number;
  readonly totalAmount: number;
  readonly bookType?: string;
  /** 0=correcto, 1=enviado, 2=rechazado */
  readonly reportedSii?: number;
  readonly thirdSii?: number | boolean;
  readonly month: number;
  readonly year: number;
  readonly specificTaxRate?: string | null;
  readonly canceled?: number | boolean;
  readonly ivaAmountWithheld?: number;
  readonly addBook?: number | boolean;
  readonly urlPdf?: string | null;
  readonly urlXml?: string | null;
  readonly fixedAssetAmount?: number;
  readonly liquidationCode?: string | null;
  readonly commissionTotalNetAmount?: number;
  readonly commissionTotalExemptAmount?: number;
  readonly commissionTotalIvaAmount?: number;
  readonly docsCount?: number;
  readonly include?: number;
  readonly siiReceptionDate?: number;
  readonly siiInProgress?: boolean;
  readonly siiStatus?: ReadonlyArray<BsaleSiiActionCode>;
}

/** Códigos de acción / estado SII para DTE de terceros. */
export type BsaleSiiActionCode = 'ACD' | 'RCD' | 'ERM' | 'RFP' | 'RFT' | 'RFX' | 'PAG';

/** Payload `POST /v1/dtes/claims.json` (host `bsp-api.bsale.io`). */
export interface BsaleClaimPayload {
  readonly document: {
    readonly issuer: { readonly code: string };
    /** Código tributario (string) */
    readonly code: string;
    readonly number: number;
  };
  readonly actionCode: BsaleSiiActionCode;
}

/** Response del POST de claims. */
export interface BsaleClaimResponse {
  readonly code: number;
  readonly data: {
    readonly cpn: { readonly date: string; readonly id: number; readonly code: string };
    readonly document: {
      readonly number: string;
      readonly code: string;
      readonly issuer: { readonly code: string };
    };
    readonly events: ReadonlyArray<unknown>;
    readonly trackingNumber: string;
  };
}

/** Item de status de un claim. */
export interface BsaleClaimStatusItem {
  readonly trackingNumber: string;
  readonly cpnCode: string;
  readonly issuerCode: string;
  readonly actionCode: BsaleSiiActionCode;
  readonly documentCode: string;
  readonly documentNumber: string;
  readonly response: { readonly code: string; readonly description: string };
  readonly generationDate: number;
}

/** Query para `GET /v1/dtes/claims.json`. */
export type BsaleClaimQuery =
  | { readonly trackingNumber: string }
  | { readonly documentCode: string; readonly documentNumber: number };
