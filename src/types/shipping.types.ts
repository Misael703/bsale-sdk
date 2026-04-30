/** Despacho (guía de despacho DTE). */
export interface BsaleShipping {
  readonly id: number;
  readonly shippingDate: number;
  readonly address?: string | null;
  readonly municipality?: string;
  readonly city?: string;
  readonly district?: string;
  readonly recipient?: string | null;
  readonly state: number;
  /** Solo en traslados internos: 0 = no recibida, 1 = recibida */
  readonly received?: number;
  readonly office?: { readonly id: number; readonly href: string };
  readonly user?: { readonly id: number; readonly href: string };
  readonly shipping_type?: { readonly id: number; readonly href: string };
  readonly guide?: {
    readonly id: number;
    readonly href: string;
    readonly number?: number;
    readonly urlPublicView?: string;
    readonly urlPdf?: string;
    readonly urlPublicViewOriginal?: string;
    readonly urlPdfOriginal?: string;
  };
  readonly details?: { readonly href: string };
  readonly href: string;
}

/** Item del sub-recurso `/shippings/{id}/details`. */
export interface BsaleShippingDetail {
  readonly id: number;
  readonly quantity: number;
  readonly variantStock: number;
  readonly variantCost: number;
  readonly variant: { readonly id: number; readonly href: string };
  readonly href: string;
}

/** Item de detalle al crear un despacho — modalidad "desde documento". */
export interface BsaleShippingDetailFromDocument {
  readonly detailId: number;
  readonly quantity: number;
}

/** Item de detalle al crear un despacho — modalidad "manual". */
export interface BsaleShippingDetailManual {
  readonly code: string;
  readonly quantity: number;
  readonly netUnitValue: number;
}

/** Cliente embebido en un despacho. */
export interface BsaleShippingClient {
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
}

/** Payload para `POST /shippings.json`. */
export interface BsaleCreateShippingPayload {
  /** Tipo de documento (alternativa: `codeSii`) */
  readonly documentTypeId?: number;
  /** Código tributario SII (alternativa: `documentTypeId`) */
  readonly codeSii?: string;
  /** Sucursal de origen */
  readonly officeId?: number;
  /** Lista de precios */
  readonly priceListId?: number;
  /** Fecha de emisión (Unix segundos) */
  readonly emissionDate: number;
  /** Tipo de despacho (ver shipping_types) */
  readonly shippingTypeId: number;
  readonly municipality?: string;
  readonly city?: string;
  readonly address?: string;
  readonly recipient?: string;
  /** 0/1 — declarar al SII */
  readonly declareSii?: 0 | 1;
  /** Sucursal destino — requerida para traslado interno (`shippingTypeId=5`). */
  readonly destinationOfficeId?: number;
  /** Items del despacho. Aceptan dos modalidades: "desde documento" o "manual". */
  readonly details?: ReadonlyArray<BsaleShippingDetailFromDocument | BsaleShippingDetailManual>;
  /** Datos del cliente (opcional). */
  readonly client?: BsaleShippingClient;
}
