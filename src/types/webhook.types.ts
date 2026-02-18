/** Bsale webhook payload sent via POST to configured URLs */
export interface BsaleWebhookPayload {
  readonly cpnId: number;
  /** Resource URL (uses /v2/ path) */
  readonly resource: string;
  readonly resourceId: string;
  readonly topic: 'product' | 'variant' | 'document' | 'price' | 'stock';
  readonly action: 'post' | 'put' | 'delete';
  /** Unix timestamp in seconds */
  readonly send: number;
  /** Office ID (present only on some topics) */
  readonly officeId?: string;
  /** Price list ID (present only on price topic) */
  readonly priceListId?: string;
}
