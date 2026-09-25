import type { BsaleExpanded } from './common.types';
import type { BsaleProduct } from './product.types';

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
  /**
   * 1 si la variante permite series repetidas (lotes). No figura en la tabla
   * de respuesta de docs.bsale.dev/variantes (solo como input de producto),
   * pero `GET /variants.json` lo devuelve (verificado en vivo, 2026-09).
   */
  readonly isLot?: 0 | 1;
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
  /**
   * Referencia al producto padre. Sin `expand` el `id` llega como **string**
   * (`{ "id": "24410" }`, verificado en vivo 2026-09) aunque la doc lo muestre
   * numérico. Con `expand: 'product'` usar `BsaleVariantWithProduct`.
   */
  readonly product?: { readonly id: string; readonly href: string };
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

/**
 * Relaciones de `/variants` que se pueden pedir con `expand` y su forma
 * embebida. `product` llega como objeto completo, 1:1 (verificado en vivo 2026-09).
 */
export interface BsaleVariantExpansions {
  readonly product: BsaleProduct;
}

/** Variante leída con `expand: 'product'`: el producto viene embebido completo. */
export type BsaleVariantWithProduct = BsaleExpanded<
  BsaleVariant,
  BsaleVariantExpansions,
  'product'
>;

/** Response de `/variants/{id}/costs.json` (no paginado). */
export interface BsaleVariantCosts {
  /**
   * Costo promedio. La doc lo muestra como string (`"4140.0"`), pero la API
   * devuelve un número (`2915.37`, verificado en vivo 2026-09).
   */
  readonly averageCost: number;
  /** Costo total del stock valorizado. No documentado; lo devuelve la API (verificado en vivo 2026-09). */
  readonly totalCost?: number;
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
