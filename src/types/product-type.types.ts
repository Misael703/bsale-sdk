/** Bsale product type (tipo de producto/servicio) entity */
export interface BsaleProductType {
  readonly href: string;
  readonly id: number;
  readonly name: string;
  readonly isEditable: number;
  readonly state: number;
  readonly imagestionCategoryId?: number;
  readonly prestashopCategoryId?: number;
  readonly attributes?: {
    readonly href: string;
  };
}

/** Bsale product type attribute */
export interface BsaleProductTypeAttribute {
  readonly href: string;
  readonly id: number;
  readonly name: string;
  readonly isMandatory: number;
  readonly generateVariantName: number;
  readonly hasOptions: number;
  /** Pipe-delimited options (e.g. "Nintendo|Microsoft|Sony") */
  readonly options?: string;
  readonly state: number;
}

/** Attribute payload for creating/updating a product type */
export interface BsaleProductTypeAttributePayload {
  /** Include id when updating an existing attribute; omit to create new */
  readonly id?: number;
  readonly name: string;
  readonly isMandatory?: number;
  readonly generateVariantName?: number;
  readonly hasOptions?: number;
  /** Pipe-delimited options */
  readonly options?: string;
  readonly state?: number;
}

/** Payload for creating or updating a product type */
export interface BsaleProductTypePayload {
  readonly name: string;
  readonly attributes?: BsaleProductTypeAttributePayload[];
}
