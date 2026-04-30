/** Datos de transacción exitosa o pendiente. */
export interface BsalePaymentSuccessData {
  readonly cardNumber: string;
  readonly quota?: number;
  readonly quotaAmount?: number;
  readonly payType?: string;
  readonly status: string;
  /** ISO 8601 (`"2024-10-08T12:08:55Z"`) — anomalía vs Unix ts. */
  readonly transactionDate: string;
}

/** Payload `POST /v1/payment/success/{py_token}`. */
export interface BsalePaymentSuccessPayload {
  readonly id: string;
  readonly authorizationCode: string;
  readonly data: BsalePaymentSuccessData;
}

/** Payload `POST /v1/payment/fail/{py_token}`. */
export interface BsalePaymentFailPayload {
  readonly id: string;
  readonly msg: string;
  readonly data?: string | Record<string, unknown>;
}

/** Payload `POST /v1/payment/log/{py_token}`. */
export interface BsalePaymentLogPayload {
  readonly msg: string;
}

/** Payload `POST /v1/payment/pending/{py_token}`. */
export interface BsalePaymentPendingPayload {
  readonly authorizationCode: string;
  readonly data: BsalePaymentSuccessData;
}

/** Response común de los endpoints de pasarela. */
export interface BsalePaymentGatewayResponse {
  readonly code: number;
  readonly data: {
    readonly token: string;
    readonly order: string;
    readonly status: string;
    readonly amount: number;
    readonly redirectTo?: string;
  };
}
