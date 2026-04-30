/** Producto del catálogo. */
export interface BsaleProduct {
  readonly id: number;
  readonly name: string;
  readonly description?: string;
  /** 0 = producto, 1 = servicio, 3 = pack/promoción */
  readonly classification: 0 | 1 | 3;
  readonly ledgerAccount?: string | null;
  readonly costCenter?: string | null;
  readonly allowDecimal: 0 | 1;
  readonly stockControl: 0 | 1;
  readonly printDetailPack: 0 | 1;
  /** 0 = activo, 1 = inactivo */
  readonly state: 0 | 1;
  readonly prestashopProductId?: number;
  /** **Sic**: typo histórico en API (`presashop` sin "t"). Respetar. */
  readonly presashopAttributeId?: number;
  readonly product_type?: { readonly id: number; readonly href: string };
  readonly product_taxes?: { readonly href: string };
  readonly variants?: { readonly href: string };
  readonly href: string;
}

/** Item del sub-recurso `/products/{id}/product_taxes`. */
export interface BsaleProductTax {
  readonly id: string | number;
  readonly tax: { readonly id: string; readonly href: string };
  readonly href: string;
}

/** Payload `POST /products.json`. */
export interface BsaleProductPayload {
  readonly name: string;
  readonly description?: string;
  readonly classification?: 0 | 1;
  readonly stockControl?: 0 | 1;
  readonly productTypeId: number;
  readonly allowDecimal?: 0 | 1;
  readonly serialNumber?: 0 | 1;
  readonly isLot?: 0 | 1;
  /** IDs de impuestos a asociar. Si se omite, usa los default del tenant. */
  readonly taxes?: ReadonlyArray<number>;
}

/** Payload `PUT /products/{id}.json` (solo 5 campos editables según docs). */
export interface BsaleProductUpdatePayload {
  readonly id: string | number;
  readonly name?: string;
  readonly productTypeId?: number;
  readonly allowDecimal?: 0 | 1;
  readonly description?: string;
}

/** Item dentro de `packDetails[]` al crear un pack. */
export interface BsalePackDetailInput {
  readonly variantPromoId: number;
  readonly quantity: number;
  readonly productPromoId?: number;
  readonly multipleVariant?: 0 | 1;
}

/** Payload `POST /v2/products/pack.json`. */
export interface BsaleCreatePackPayload {
  readonly productTypeId: number;
  readonly basePrice: number;
  readonly name: string;
  readonly barCode: string;
  readonly code: string;
  readonly priceWithTax?: 0 | 1;
  readonly printDetailPack?: 0 | 1;
  readonly packDetails: ReadonlyArray<BsalePackDetailInput>;
}

/** Item dentro de `packDetail[]` en el response. */
export interface BsalePackDetailItem {
  readonly id: number;
  readonly productId: number;
  readonly variantId: number;
  readonly quantity: number;
  readonly state: number;
  readonly packId: number;
  readonly multipleVariant: 0 | 1;
  readonly packInfo?: Record<string, unknown>;
}

/** Response `POST /v2/products/pack.json`. Wrapper `{ code, data }` desempaquetado. */
export interface BsalePack {
  readonly id: number;
  readonly name: string;
  readonly classification: 3;
  readonly printPackDetail: 0 | 1;
  readonly state: number;
  readonly productTypeId: number;
  readonly brandId: number;
  readonly sku: string;
  readonly barCode: string;
  readonly packDetail: ReadonlyArray<BsalePackDetailItem>;
}
