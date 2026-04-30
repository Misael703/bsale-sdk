/** Descuento configurable. */
export interface BsaleDiscount {
  readonly id: number;
  readonly name: string;
  /** % como string (ej. "14.3"). */
  readonly percentage: string | number;
  readonly state: 0 | 1;
  /** Aparece en GET (alias o legado de `autoDiscount`). */
  readonly automatic?: 0 | 1;
  /** Aparece en POST/PUT. */
  readonly autoDiscount?: 0 | 1;
  /** 0=porcentaje, 1=lista de precios. */
  readonly type: 0 | 1;
  readonly minQuantity?: number;
  readonly byDate?: 0 | 1;
  /** Formato `"DD/MM/YYYY"` (anomalía vs Unix ts). */
  readonly startDate?: string | null;
  readonly endDate?: string | null;
  readonly relation?: number;
  readonly basePriceListId?: number | null;
  readonly discountPriceListId?: number | null;
  readonly href: string;
}

/** Payload `POST /v2/discounts/new.json`. */
export interface BsaleCreateDiscountPayload {
  readonly name: string;
  readonly percentage: number | string;
  readonly type: 0 | 1;
  readonly state: 0 | 1;
  readonly autoDiscount?: 0 | 1;
  readonly minQuantity?: number;
  readonly byDate?: 0 | 1;
  /** Formato `"DD/MM/YYYY"`. */
  readonly startDate?: string | null;
  readonly endDate?: string | null;
  readonly relation?: number;
  readonly basePriceListId?: number | null;
  readonly discountPriceListId?: number | null;
  readonly accessProfiles?: ReadonlyArray<number>;
  readonly restrictedPriceLists?: ReadonlyArray<number>;
}

/** Item de detalle del descuento (relación con producto/variante). */
export interface BsaleDiscountDetail {
  readonly id: number;
  readonly product?: { readonly id: number; readonly name: string };
  readonly variant?: { readonly id: number; readonly description: string; readonly sku: string };
  readonly discountId: number;
  readonly deletedDetail: 0 | 1;
}

/** Payload para asociar producto o variante al descuento. */
export type BsaleAddDiscountDetailPayload =
  | { readonly productId: number }
  | { readonly variantId: number };
