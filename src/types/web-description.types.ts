/** Tipo de descripción web. */
export type BsaleWebDescriptionType = 'normal' | 'virtual';

/** Imagen de producto web. */
export interface BsaleProductPicture {
  readonly id: number;
  readonly href: string;
  readonly state: 0 | 1;
  readonly legendImage: string;
}

/** Descripción web (publicación de un producto en la tienda online). */
export interface BsaleWebDescription {
  readonly id: number;
  readonly productId: number;
  readonly idVariantDefault: number;
  readonly urlSlug?: string;
  readonly name: string;
  readonly description?: string;
  readonly displayNotice?: string;
  readonly state: 0 | 1;
  readonly mkProductType?: BsaleWebDescriptionType;
  readonly urlImg?: string;
  readonly urlVideo?: string | null;
  readonly shippingUnit?: number | null;
  readonly width?: number;
  readonly depth?: number;
  readonly length?: number;
  readonly variants?: ReadonlyArray<unknown> | { readonly href: string };
  readonly collections?: ReadonlyArray<unknown> | { readonly href: string };
  readonly variant?: { readonly id: number };
  readonly order?: number | null;
  readonly link?: string;
  readonly href?: string;
}

/** Item input dentro de `pictures[]` al crear. */
export interface BsaleWebDescriptionPictureInput {
  readonly href: string;
  readonly legendImage?: string;
  readonly order?: number;
}

/** Item input dentro de `orderedVariants[]`. */
export interface BsaleWebDescriptionOrderedVariantInput {
  readonly id: number;
  readonly order?: number;
  readonly show?: 0 | 1;
}

/** Item input dentro de `variantsShipping[]`. */
export interface BsaleWebDescriptionVariantShippingInput {
  readonly width: number;
  readonly depth: number;
  readonly length: number;
}

/** Payload `POST /v2/products/market_info.json`. */
export interface BsaleCreateWebDescriptionPayload {
  readonly productId: number;
  readonly idVariantDefault: number;
  readonly name: string;
  readonly state: 0 | 1;
  readonly variantShippingAll: 0 | 1;
  readonly productType: BsaleWebDescriptionType;
  readonly displayNotice?: string;
  readonly urlImg?: string;
  readonly urlVideo?: string;
  readonly description?: string;
  readonly order?: number;
  readonly integration?: Record<string, unknown>;
  readonly orderedVariants?: ReadonlyArray<BsaleWebDescriptionOrderedVariantInput>;
  readonly variantsShipping?: ReadonlyArray<BsaleWebDescriptionVariantShippingInput>;
  readonly pictures?: ReadonlyArray<BsaleWebDescriptionPictureInput>;
  readonly width?: number | null;
  readonly depth?: number | null;
  readonly length?: number | null;
  readonly descriptions?: ReadonlyArray<unknown>;
}

/** Payload `PUT /v2/products/market_info/{id}.json` (solo 3 campos). */
export interface BsaleUpdateWebDescriptionPayload {
  readonly name?: string;
  readonly description?: string;
  readonly displayNotice?: string;
}

/** Colección de e-commerce. */
export interface BsaleCollection {
  readonly id: number;
  readonly name: string;
  readonly urlSlug?: string;
  readonly state: 0 | 1;
  readonly description?: string | null;
  readonly image?: string | null;
  readonly lyId?: number | null;
  readonly mkId?: number;
  readonly tdId?: number | null;
  readonly integration?: unknown;
}

/** Payload para asociar producto a colección. */
export interface BsaleAddProductToCollectionPayload {
  /** SKU de la variante. */
  readonly code: string;
}

/** Medidas de envío de una variante. */
export interface BsaleVariantShipping {
  readonly id: number;
  readonly weight: number;
  readonly width: number;
  /** **Sic**: typo en API real (`deph`, debería ser `depth`). */
  readonly deph: number;
  readonly length: number;
  readonly match: 0 | 1;
  readonly productVariantId: number;
}

/** Payload `POST /v2/variants/shipping.json`. */
export interface BsaleCreateVariantShippingPayload {
  readonly productVariantId: number;
  readonly weight: number;
  readonly width: number;
  readonly depth: number;
  readonly length: number;
  readonly match: 0 | 1;
}

/** Payload `PUT /v2/variants/{variantId}/shipping.json`. */
export type BsaleUpdateVariantShippingPayload = Partial<BsaleCreateVariantShippingPayload>;
