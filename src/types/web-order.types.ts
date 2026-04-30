/** Estado de procesamiento del pago en checkout. */
export type BsalePayProcess = 'success' | 'pending' | 'for_validate' | 'fail';

/** Estado de despacho de la orden. */
export type BsaleOrderStatus = 0 | 6 | 7;

/** Item del carro (response). */
export interface BsaleCartItem {
  readonly id: number;
  readonly quantity: number;
  readonly unitValue: number;
  readonly netUnitValue: number;
  readonly discount: number;
  readonly itemName: string;
  readonly total: number;
  readonly image?: string;
  readonly idVarianteProducto: number;
  readonly sku?: string;
  readonly link?: string;
  readonly productWebId?: number;
  readonly cartId: number;
  readonly taxList?: ReadonlyArray<number>;
  readonly shipping?: {
    readonly id: number;
    readonly weight?: number;
    readonly width?: number;
    readonly deph?: number;
    readonly length?: number;
    readonly match?: 0 | 1;
  };
  readonly name?: string;
  readonly value?: number;
  readonly href?: string;
}

/** Item input al crear/actualizar carro. */
export interface BsaleCartItemPayload {
  /** Para edición: incluir `id` del item existente; sin `id` se crea uno nuevo. */
  readonly id?: number;
  readonly quantity: number;
  readonly unitValue: number;
  readonly netUnitValue?: number;
  readonly itemName: string;
  readonly idVarianteProducto: number;
  readonly productWebId: number;
  readonly image?: string;
  readonly discount?: number;
}

/** Payload `POST /cart/new.json` y `PUT /cart/{id}.json`. */
export interface BsaleCartPayload {
  readonly cartDetails: ReadonlyArray<BsaleCartItemPayload>;
}

/** Datos B2B opcionales de un checkout. */
export interface BsaleCheckoutExtrasUserData {
  readonly user_rut?: string;
  readonly razon_social?: string;
  readonly giro_cliente?: string;
  readonly direccion?: string;
  readonly ciudad?: string;
  readonly comuna?: string;
}

/** Checkout (pre-venta confirmada). */
export interface BsaleCheckout {
  readonly id: number;
  readonly token: string;
  readonly clientName: string;
  readonly clientLastName: string;
  readonly clientEmail: string;
  readonly clientPhone: string;
  readonly id_tipo_documento_tributario?: number;
  readonly clientCountry?: string;
  readonly clientState?: string;
  readonly clientCity?: string;
  readonly clientStreet?: string;
  readonly clientCityZone?: string;
  readonly clientPostcode?: string;
  readonly clientBuildingNumber?: string;
  readonly dynamicAttributes?: ReadonlyArray<unknown>;
  readonly extrasUserData?: BsaleCheckoutExtrasUserData;
  readonly cartId: number;
  readonly cartDetails?: ReadonlyArray<unknown>;
  readonly spcId?: number;
  readonly ptId: number;
  readonly ptName?: string;
  readonly payUrl?: string;
  readonly createAt: number;
  readonly shippingCost: number;
  readonly isMafs?: 0 | 1;
  readonly discountCost?: number;
  readonly active: 0 | 1;
  readonly shippingComment?: string;
  readonly totalCart: number;
  readonly pickStoreId?: number;
  readonly pickName?: string;
  readonly pickCode?: string;
  readonly id_venta_documento_tributario?: number;
  readonly documentNumber?: number;
  readonly documentToken?: string;
  readonly storeId?: number;
  readonly storeName?: string;
  readonly marketId: number;
  readonly isService?: 0 | 1;
  readonly withdrawStore: 0 | 1;
  readonly payProcess: BsalePayProcess;
  readonly payError?: number;
  readonly payResponse?: string;
  readonly stName?: string;
  readonly total: number;
  readonly clientId?: number;
  readonly url?: string;
  readonly orderStatus: BsaleOrderStatus;
  readonly currency?: {
    readonly decimals: number;
    readonly symbol: string | null;
    readonly decimalSeparator: string | null;
  };
  readonly integrationDetail?: string;
}

/** Payload `POST /markets/checkout.json`. */
export interface BsaleCreateCheckoutPayload {
  readonly clientName: string;
  readonly clientLastName: string;
  readonly clientEmail: string;
  readonly clientPhone: string;
  readonly code?: string;
  readonly marketId: number;
  /** 0 = despacho a domicilio, 1 = retiro en sucursal. */
  readonly withdrawStore: 0 | 1;
  readonly shippingCost?: number;
  readonly ptId: number;
  readonly payProcess?: BsalePayProcess;
  readonly clientCountry?: string;
  readonly clientState?: string;
  readonly clientCityZone?: string;
  readonly clientStreet?: string;
  readonly clientPostcode?: string;
  readonly clientBuildingNumber?: string;
  readonly id_tipo_documento_tributario?: number;
  readonly pickStoreId?: number;
  readonly pickName?: string;
  readonly pickCode?: string;
  readonly extrasUserData?: BsaleCheckoutExtrasUserData;
  readonly cartDetails: ReadonlyArray<{
    readonly quantity: number;
    readonly netUnitValue: number;
    readonly idVarianteProducto: number;
    readonly productWebId: number;
  }>;
  /** 1 = generar pedido web (pre-venta) automáticamente. */
  readonly generateDocument?: 0 | 1;
}

/** Payload `PUT /markets/checkout/{id}.json` (parcial). */
export type BsaleUpdateCheckoutPayload = Partial<BsaleCreateCheckoutPayload> & {
  readonly id_venta_documento_tributario?: number;
  readonly documentNumber?: number;
  readonly documentToken?: string;
};
