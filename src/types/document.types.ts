/** Documento tributario (factura, boleta, NC, etc.). */
export interface BsaleDocument {
  readonly id: number;
  readonly emissionDate: number;
  readonly expirationDate: number;
  readonly generationDate: number;
  readonly rcofDate?: number;
  readonly number: number;
  readonly serialNumber?: string;
  readonly trackingNumber?: string;
  readonly totalAmount: number;
  readonly netAmount: number;
  readonly taxAmount: number;
  readonly exemptAmount: number;
  readonly notExemptAmount?: number;
  readonly exportTotalAmount?: number;
  readonly exportNetAmount?: number;
  readonly exportTaxAmount?: number;
  readonly exportExemptAmount?: number;
  readonly commissionRate?: number;
  readonly commissionNetAmount?: number;
  readonly commissionTaxAmount?: number;
  readonly commissionTotalAmount?: number;
  readonly percentageTaxWithheld?: number;
  readonly purchaseTaxAmount?: number;
  readonly purchaseTotalAmount?: number;
  readonly ted?: string;
  readonly urlTimbre?: string;
  readonly urlPublicView?: string;
  readonly urlPdf?: string;
  readonly urlPublicViewOriginal?: string;
  readonly urlPdfOriginal?: string;
  readonly urlXml?: string;
  readonly token?: string;
  readonly state: 0 | 1;
  readonly commercialState?: number;
  readonly address?: string;
  readonly municipality?: string;
  readonly city?: string;
  /** 0=correcto, 1=enviado, 2=rechazado */
  readonly informedSii?: 0 | 1 | 2;
  readonly responseMsgSii?: string;
  readonly salesId?: string;
  readonly document_type?: { readonly id: number | string; readonly href: string };
  readonly client?: { readonly id: number | string; readonly href: string };
  readonly office?: { readonly id: number | string; readonly href: string };
  readonly user?: { readonly id: number | string; readonly href: string };
  readonly coin?: { readonly id: number | string; readonly href: string };
  readonly references?: { readonly href: string };
  readonly document_taxes?: { readonly href: string };
  readonly details?: { readonly href: string };
  readonly sellers?: { readonly href: string };
  readonly attributes?: { readonly href: string };
  readonly href: string;
}

/** Item del sub-recurso `/documents/{id}/details`. */
export interface BsaleDocumentDetailItem {
  readonly id: number;
  readonly lineNumber: number;
  readonly quantity: number;
  readonly netUnitValue: number;
  readonly totalUnitValue: number;
  readonly netAmount: number;
  readonly taxAmount: number;
  readonly totalAmount: number;
  readonly netDiscount?: number;
  readonly totalDiscount?: number;
  readonly variant?: {
    readonly id: number;
    readonly description?: string;
    readonly code?: string;
    readonly href: string;
  };
  readonly note?: string;
  readonly relatedDetailId?: number;
  readonly href: string;
}

/** Item del sub-recurso `/documents/{id}/references`. */
export interface BsaleDocumentReferenceItem {
  readonly id: number;
  readonly referenceDate: number;
  readonly number: string;
  readonly reason: string;
  readonly dte_code: { readonly id: string; readonly href: string };
  readonly href: string;
}

/** Item del sub-recurso `/documents/{id}/document_taxes`. */
export interface BsaleDocumentTaxItem {
  readonly id: number;
  readonly totalAmount: number;
  readonly exemptAmount: number;
  readonly tax: { readonly id: string; readonly href: string };
  readonly href: string;
}

/** Item del sub-recurso `/documents/{id}/sellers`. */
export interface BsaleDocumentSellerItem {
  readonly id: number;
  readonly firstName: string;
  readonly lastName: string;
  readonly href: string;
}

/** Item del sub-recurso `/documents/{id}/attributes` (atributos no electrónicos). */
export interface BsaleDocumentAttributeItem {
  readonly id: number;
  readonly name: string;
  readonly value: string;
  readonly href: string;
}

/** Item del summary `/documents/summary.json`. */
export interface BsaleDocumentSummary {
  readonly generationDate: string | number;
  readonly emissionDate?: string | number;
  readonly documentTypeName: string;
  readonly codeSii: string;
  readonly month: number;
  readonly year: number;
  readonly officeId: number;
  readonly officeName: string;
  readonly officeCostCenter?: string;
  readonly count: number;
  readonly totalNetAmount: number;
  readonly totalTaxAmount: number;
  readonly totalAmount: number;
  readonly totalExemptAmount: number;
  readonly taxes: ReadonlyArray<{
    readonly taxId: number;
    readonly taxName: string;
    readonly taxAmount: number;
  }>;
  readonly details?: ReadonlyArray<{
    readonly itemLedgerAccount?: string;
    readonly totalNetAmount?: number;
  }>;
  readonly documentId?: number;
  readonly documentNumber?: number;
}

/** Costos del endpoint `/documents/costs.json`. */
export interface BsaleDocumentCost {
  readonly id: number;
  readonly name: string;
  readonly number: number;
  readonly totalCost: number;
  readonly cost_detail: ReadonlyArray<unknown>;
  readonly href: string;
}

/** Detail input al crear un documento. */
export interface BsaleDocumentDetail {
  readonly variantId?: number;
  readonly code?: string;
  readonly barCode?: string;
  readonly netUnitValue: number;
  readonly quantity: number;
  /** IDs de impuestos como string array (`"[1,2]"`). */
  readonly taxId?: string;
  /** Alternativa: array de objetos. */
  readonly taxes?: ReadonlyArray<{ readonly code: number; readonly percentage: number }>;
  readonly comment?: string;
  readonly discount?: number;
  readonly detailId?: number;
}

/** Payment input al crear un documento. */
export interface BsaleDocumentPayment {
  readonly paymentTypeId: number;
  readonly amount: number;
  readonly recordDate?: number;
}

/** Referencia a otro documento. */
export interface BsaleDocumentReference {
  readonly number: string;
  readonly referenceDate: number;
  readonly reason: string;
  readonly codeSii: number;
}

/** Atributo dinámico embebido en POST. */
export interface BsaleDocumentDynamicAttribute {
  readonly description: string;
  readonly dynamicAttributeId: number;
}

/** Datos aduanales para exportaciones. */
export interface BsaleDocumentCustomsData {
  readonly clauseCode?: string;
  readonly clauseAmount?: number;
  readonly saleModeId?: number;
  readonly countryCode?: string;
  readonly transportPathId?: number;
  readonly totalPackages?: number;
}

/** Despacho embebido (legacy — preferir [[shippings]]). */
export interface BsaleDocumentDispatch {
  readonly address?: string;
  readonly municipality?: string;
  readonly city?: string;
}

/** Payload `POST /documents.json`. */
export interface BsaleDocumentCreatePayload {
  readonly documentTypeId?: number;
  readonly codeSii?: number;
  readonly officeId?: number;
  readonly priceListId?: number;
  readonly emissionDate: number;
  readonly expirationDate: number;
  readonly declareSii?: 0 | 1;
  readonly sellerId?: number;
  readonly dispatch?: 0 | 1 | BsaleDocumentDispatch;
  readonly renovationId?: number;
  readonly renovationDate?: number;
  readonly salesId?: string;
  readonly sendEmail?: 0 | 1;
  readonly commissionRate?: number;
  readonly commissionCodeSii?: number;
  readonly percentageTaxWithheld?: number;
  readonly coinId?: number;
  readonly hasCustomsData?: 0 | 1;
  readonly exchangeRate?: number;
  readonly exportNetAmount?: number;
  readonly exportTaxAmount?: number;
  readonly exportTotalAmount?: number;
  readonly exportExemptAmount?: number;
  readonly observation?: string;
  /** Datos del cliente embebidos (alternativa: pasar `clientId`). */
  readonly client?: {
    readonly code?: string;
    readonly company?: string;
    readonly firstName?: string;
    readonly lastName?: string;
    readonly municipality?: string;
    readonly city?: string;
    readonly activity?: string;
    readonly address?: string;
    readonly email?: string;
    readonly companyOrPerson?: 0 | 1;
  };
  /** Cliente existente (alternativa al objeto `client`). */
  readonly clientId?: number;
  /** Dirección existente del cliente. */
  readonly addressId?: number;
  readonly details: ReadonlyArray<BsaleDocumentDetail>;
  readonly payments?: ReadonlyArray<BsaleDocumentPayment>;
  readonly references?: ReadonlyArray<BsaleDocumentReference>;
  readonly dynamicAttributes?: ReadonlyArray<BsaleDocumentDynamicAttribute>;
  readonly customsData?: BsaleDocumentCustomsData;
}
