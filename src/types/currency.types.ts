/** Moneda configurada en el tenant. */
export interface BsaleCurrency {
  readonly id: number;
  readonly name: string;
  readonly symbol: string;
  readonly decimals: number;
  readonly totalRound: 0 | 1;
  readonly href: string;
}

/** Response de `/coins/{id}/exchange_rate/{unixtime}.json`. */
export interface BsaleExchangeRate {
  readonly exchangeRate: number;
}
