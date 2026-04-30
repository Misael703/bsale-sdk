/** Variante de un producto. */
export interface BsaleVariant {
  readonly id: number;
  readonly description: string;
  readonly unlimitedStock: 0 | 1;
  readonly allowNegativeStock: 0 | 1;
  /** 0 = activa, 1 = inactiva */
  readonly state: number;
  readonly barCode?: string;
  readonly code?: string;
  readonly serialNumber?: 0 | 1;
  /** Campos legacy de Imagestion (todos vienen aunque sean 0). */
  readonly imagestionCenterCost?: number | string;
  readonly imagestionAccount?: number | string;
  readonly imagestionConceptCod?: number | string;
  readonly imagestionProyectCod?: number | string;
  readonly imagestionCategoryCod?: number;
  readonly imagestionProductId?: number;
  /** Campos legacy de PrestaShop. */
  readonly prestashopCombinationId?: number;
  readonly prestashopValueId?: number;
  readonly product?: { readonly id: number; readonly href: string };
  readonly attribute_values?: { readonly href: string };
  readonly costs?: { readonly href: string };
  readonly href: string;
}

/** Item del sub-recurso `/variants/{id}/attribute_values` (input). */
/** Valor de atributo asignado a una variante. */
export interface BsaleVariantAttributeValueInput {
  /** Valor del atributo (ej. "Talla M") */
  readonly description: string;
  /** ID del atributo definido en el tipo de producto */
  readonly attributeId: number;
}

/** Item del sub-recurso `/variants/{id}/attribute_values`. */
export interface BsaleVariantAttributeValue {
  readonly id: number;
  readonly description: string;
  readonly attribute: { readonly id: number; readonly href: string };
  readonly href: string;
}

/** Response de `/variants/{id}/costs.json` (no paginado). */
export interface BsaleVariantCosts {
  readonly averageCost: string;
  readonly history: ReadonlyArray<{
    readonly reception_detail: { readonly id: number; readonly href: string };
    readonly admissionDate: number;
    readonly cost: number;
    readonly availableFifo: number;
  }>;
}

/** Payload base para crear o actualizar una variante. */
export interface BsaleVariantPayload {
  readonly description?: string;
  readonly unlimitedStock?: 0 | 1;
  readonly allowNegativeStock?: 0 | 1;
  readonly state?: number;
  readonly barCode?: string;
  readonly code?: string;
  readonly productId?: number;
  readonly attribute_values?: ReadonlyArray<BsaleVariantAttributeValueInput>;
}
