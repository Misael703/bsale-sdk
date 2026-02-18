/** Bsale user entity */
export interface BsaleUser {
  readonly href: string;
  readonly id: number;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly state: number;
  readonly defaultOffice?: {
    readonly href: string;
    readonly id: number;
  };
}

/** Bsale user sales summary */
export interface BsaleUserSalesSummary {
  readonly userId: number;
  readonly totalSales: number;
  readonly totalAmount: number;
}
