/** Condición de venta (plazo de pago a crédito). */
export interface BsaleSaleCondition {
  readonly id: number;
  readonly name: string;
  readonly timeCondition: number;
  /** Unidad de tiempo (0 = días según la doc; otros valores no documentados). */
  readonly timeUnity: number;
  readonly state: 0 | 1;
  readonly href: string;
}
