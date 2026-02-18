/** Bsale payment type (forma de pago) entity */
export interface BsalePaymentType {
  readonly id: number;
  readonly name: string;
  readonly isVirtual: number;
  readonly maxCheck: number;
  readonly state: number;
  readonly href: string;
}
