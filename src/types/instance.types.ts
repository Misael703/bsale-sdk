/** Metadata básica de la instancia (tenant). */
export interface BsaleInstance {
  readonly id: number;
  /** RUT de la empresa. */
  readonly code: string;
  readonly name: string;
  readonly state: 0 | 1;
  readonly country: string;
  readonly trial: 0 | 1;
  readonly trialEnd: number;
}
