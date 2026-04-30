/**
 * Bsale webhook payload — unión discriminada por `topic`.
 *
 * El campo `resource` puede usar prefijo `/v2/` o `/v1/` según el topic; el
 * SDK invalida cache leyendo `topic` y `resourceId` (no `resource`).
 */
export type BsaleWebhookPayload =
  | BsaleDocumentWebhookPayload
  | BsaleProductWebhookPayload
  | BsaleVariantWebhookPayload
  | BsalePriceWebhookPayload
  | BsaleStockWebhookPayload
  | BsalePaymentWebhookPayload
  | BsaleCourierOrderWebhookPayload;

interface BsaleWebhookBase {
  readonly cpnId: number;
  readonly resource: string;
  readonly resourceId: string;
  readonly action: 'post' | 'put' | 'delete';
  /** Unix timestamp en segundos */
  readonly send: number;
}

export interface BsaleDocumentWebhookPayload extends BsaleWebhookBase {
  readonly topic: 'document';
  readonly officeId?: string;
}

export interface BsaleProductWebhookPayload extends BsaleWebhookBase {
  readonly topic: 'product';
  readonly action: 'post' | 'put';
}

export interface BsaleVariantWebhookPayload extends BsaleWebhookBase {
  readonly topic: 'variant';
  readonly action: 'post' | 'put';
}

export interface BsalePriceWebhookPayload extends BsaleWebhookBase {
  readonly topic: 'price';
  readonly action: 'put';
  readonly priceListId: string;
}

export interface BsaleStockWebhookPayload extends BsaleWebhookBase {
  readonly topic: 'stock';
  readonly action: 'put';
  readonly officeId: string;
}

export interface BsalePaymentWebhookPayload extends BsaleWebhookBase {
  readonly topic: 'payment';
  readonly action: 'post' | 'put';
  readonly officeId?: string;
}

export interface BsaleCourierOrderWebhookPayload extends BsaleWebhookBase {
  readonly topic: 'courierOrder';
  readonly action: 'post' | 'put';
  /** ID del seller asociado a la orden */
  readonly sellerId: number;
  /** Token interno del usuario para autenticar el callback */
  readonly userToken: string;
}

/** Topics conocidos */
export type BsaleWebhookTopic = BsaleWebhookPayload['topic'];
