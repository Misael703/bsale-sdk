/** Recepción de stock (ingreso). */
export interface BsaleStockReception {
  readonly id: number;
  readonly admissionDate: number;
  readonly document?: string;
  readonly documentNumber?: string | number;
  readonly note?: string;
  readonly imagestionCctId?: number;
  readonly imagestionCcDescription?: string;
  readonly internalDispatchId?: number;
  readonly updateStock?: 0 | 1;
  readonly office?: { readonly id: number; readonly href: string };
  readonly user?: { readonly id: number; readonly href: string };
  readonly details?: { readonly href: string };
  readonly href: string;
}

/** Item del sub-recurso `/stocks/receptions/{id}/details`. */
export interface BsaleStockReceptionDetail {
  readonly id: number;
  readonly quantity: number;
  readonly cost: number;
  readonly variantStock: number;
  readonly serialNumber?: string | null;
  readonly variant: { readonly id: number; readonly href: string };
  readonly href: string;
}

/** Detalle de input para POST: identifica variante por `code`/`id`/`barCode`. */
export interface BsaleStockReceptionDetailCreate {
  readonly quantity: number;
  readonly cost: number;
  readonly code?: string;
  readonly id?: number;
  readonly barCode?: string;
  readonly serialNumber?: string;
}

/** Detalle de input para PUT: requiere `variantId`. */
export interface BsaleStockReceptionDetailUpdate {
  readonly quantity: number;
  readonly cost: number;
  readonly variantId: number;
  readonly serialNumber?: string;
}

/** Payload `POST /stocks/receptions.json`. */
export interface BsaleStockReceptionPayload {
  readonly document: 'Guía' | 'Factura' | 'Otro' | string;
  readonly officeId: number;
  readonly documentNumber?: number | string;
  readonly note?: string;
  readonly details: ReadonlyArray<BsaleStockReceptionDetailCreate>;
}

/** Payload `PUT /stocks/receptions/{id}.json`. */
export interface BsaleStockReceptionUpdatePayload {
  readonly document?: string;
  readonly officeId?: number;
  readonly documentNumber?: number | string;
  readonly note?: string;
  readonly details?: ReadonlyArray<BsaleStockReceptionDetailUpdate>;
}
