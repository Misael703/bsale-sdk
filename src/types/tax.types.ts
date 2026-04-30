/** Impuesto configurado en el tenant (IVA, ILA, etc.). */
export interface BsaleTax {
  readonly id: number;
  readonly name: string;
  /** Porcentaje como **string** (ej. "19.0"). */
  readonly percentage: string;
  readonly forAllProducts: 0 | 1;
  readonly ledgerAccount?: string | null;
  /** Código interno de Bsale (no el `codeSii` directamente). */
  readonly code: string;
  readonly state: 0 | 1;
  readonly href: string;
}
