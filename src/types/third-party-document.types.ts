/** Bsale third-party document (documento de terceros) entity */
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
  readonly specificTaxCode?: string;
  readonly specificTaxAmount?: string;
  readonly additionalTaxAmount?: string;
  readonly ivaNotRecoverableAmount?: number;
  readonly totalAmount: number;
  readonly bookType?: string;
  /** 0=correct, 1=sent, 2=rejected */
  readonly reportedSii?: number;
  readonly thirdSii?: number;
  readonly month: number;
  readonly year: number;
  readonly specificTaxRate?: string;
  readonly canceled?: number;
  readonly ivaAmountWithheld?: number;
  readonly addBook?: number;
  readonly urlPdf?: string;
  readonly urlXml?: string;
  readonly fixedAssetAmount?: number;
  readonly liquidationCode?: string;
  readonly commissionTotalNetAmount?: number;
  readonly commissionTotalExemptAmount?: number;
  readonly commissionTotalIvaAmount?: number;
  readonly docsCount?: number;
  readonly include?: number;
  readonly siiReceptionDate?: number;
  readonly siiInProgress?: number;
  readonly siiStatus?: string[];
}
