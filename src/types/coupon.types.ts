/** Tipo de descuento del cupón. */
export type BsaleCouponType = '0' | '1' | '2';

/** Configuración del cupón. */
export interface BsaleCouponProperties {
  readonly fromDate: number;
  readonly toDate?: number;
  readonly uses?: string;
  /** **Sic**: typo histórico en API (`repeteable`, debería ser `repeatable`). */
  readonly repeteable?: boolean;
  readonly combinable?: boolean;
  readonly collections?: ReadonlyArray<string>;
  readonly products?: ReadonlyArray<number>;
  readonly maxAmount?: string;
  readonly minAmount?: string;
}

/** Cupón de descuento. */
export interface BsaleCoupon {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly serialNumber: string;
  readonly type: BsaleCouponType | string;
  readonly amount: number | string;
  readonly disabled: 0 | 1 | string;
  readonly properties?: BsaleCouponProperties;
  readonly createdAt?: number;
  readonly updatedAt?: number;
  readonly currencyId?: number;
  readonly used?: number | { readonly href: string };
  readonly movementsCount?: number;
  readonly href: string;
}

/** Payload `POST /loyalty/coupons.json`. */
export interface BsaleCreateCouponPayload {
  readonly name: string;
  readonly description?: string;
  readonly type: BsaleCouponType;
  readonly amount: string | number;
  readonly serialNumber: string;
  readonly properties: BsaleCouponProperties;
}

/** Payload `PUT /loyalty/coupons/{id}.json` (parcial). */
export type BsaleUpdateCouponPayload = Partial<BsaleCreateCouponPayload> & {
  readonly disabled?: 0 | 1;
};
