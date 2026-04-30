/** Consumo de stock (egreso). */
export interface BsaleStockConsumption {
  readonly id: number;
  readonly consumptionDate: number;
  readonly note?: string;
  readonly imagestionCcdescription?: string;
  readonly imagestionCenterCostId?: number | null;
  readonly updateStock?: 0 | 1;
  readonly consumptionTypeId?: number;
  readonly office?: { readonly id: number; readonly href: string };
  readonly user?: { readonly id: number; readonly href: string };
  readonly details?: { readonly href: string };
  readonly href: string;
}

/** Item del sub-recurso `/stocks/consumptions/{id}/details`. */
export interface BsaleStockConsumptionDetail {
  readonly id: number;
  readonly quantity: number;
  readonly cost: number;
  readonly variantStock: number;
  readonly variant: { readonly id: number; readonly href: string };
  readonly href: string;
}

/** Detalle de input para POST. Identifica variante por `variantId`/`code`/`barCode`. */
export interface BsaleStockConsumptionDetailCreate {
  readonly quantity: number;
  readonly variantId?: number;
  readonly code?: string;
  readonly barCode?: string;
  readonly serialNumber?: string;
}

/** Payload `POST /stocks/consumptions.json`. */
export interface BsaleStockConsumptionPayload {
  readonly officeId: number;
  readonly note?: string;
  readonly consumptionTypeId?: number;
  readonly details: ReadonlyArray<BsaleStockConsumptionDetailCreate>;
}
