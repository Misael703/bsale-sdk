/** Código tributario DTE (catálogo SII). */
export interface BsaleDteCode {
  readonly id: number;
  readonly name: string;
  /** Código SII (string, aunque sea numérico — ej. "33", "61"). */
  readonly codeSii: string;
  readonly state: 0 | 1;
  readonly href: string;
}
