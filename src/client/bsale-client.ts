import { HttpClient } from './http-client';
import {
  ProductsResource,
  VariantsResource,
  DocumentsResource,
  ClientsResource,
  PriceListsResource,
  StocksResource,
  DocumentTypesResource,
  OfficesResource,
  ShippingsResource,
  PaymentTypesResource,
  StockReceptionsResource,
  StockConsumptionsResource,
  ReturnsResource,
  ThirdPartyDocumentsResource,
  ProductTypesResource,
  UsersResource,
  ShippingTypesResource,
} from '../resources';
import type { BsaleConfig, BsaleWebhookPayload } from '../types';

const WEBHOOK_TOPIC_TO_RESOURCE: Record<string, string> = {
  product: 'products',
  variant: 'variants',
  document: 'documents',
  price: 'price_lists',
  stock: 'stocks',
};

/**
 * Main entry point for the Bsale SDK.
 * Provides access to all API resources and cache management.
 */
export class BsaleClient {
  private readonly http: HttpClient;

  /** Products resource */
  readonly products: ProductsResource;
  /** Variants resource */
  readonly variants: VariantsResource;
  /** Documents resource */
  readonly documents: DocumentsResource;
  /** Clients resource */
  readonly clients: ClientsResource;
  /** Price lists resource */
  readonly priceLists: PriceListsResource;
  /** Stocks resource */
  readonly stocks: StocksResource;
  /** Document types resource */
  readonly documentTypes: DocumentTypesResource;
  /** Offices (branches) resource */
  readonly offices: OfficesResource;
  /** Shippings resource */
  readonly shippings: ShippingsResource;
  /** Payment types resource */
  readonly paymentTypes: PaymentTypesResource;
  /** Stock receptions resource */
  readonly stockReceptions: StockReceptionsResource;
  /** Stock consumptions resource */
  readonly stockConsumptions: StockConsumptionsResource;
  /** Returns (devoluciones) resource */
  readonly returns: ReturnsResource;
  /** Third-party documents resource */
  readonly thirdPartyDocuments: ThirdPartyDocumentsResource;
  /** Product types resource */
  readonly productTypes: ProductTypesResource;
  /** Users resource */
  readonly users: UsersResource;
  /** Shipping types resource */
  readonly shippingTypes: ShippingTypesResource;

  constructor(config: BsaleConfig) {
    this.http = new HttpClient(config);
    this.products = new ProductsResource(this.http);
    this.variants = new VariantsResource(this.http);
    this.documents = new DocumentsResource(this.http);
    this.clients = new ClientsResource(this.http);
    this.priceLists = new PriceListsResource(this.http);
    this.stocks = new StocksResource(this.http);
    this.documentTypes = new DocumentTypesResource(this.http);
    this.offices = new OfficesResource(this.http);
    this.shippings = new ShippingsResource(this.http);
    this.paymentTypes = new PaymentTypesResource(this.http);
    this.stockReceptions = new StockReceptionsResource(this.http);
    this.stockConsumptions = new StockConsumptionsResource(this.http);
    this.returns = new ReturnsResource(this.http);
    this.thirdPartyDocuments = new ThirdPartyDocumentsResource(this.http);
    this.productTypes = new ProductTypesResource(this.http);
    this.users = new UsersResource(this.http);
    this.shippingTypes = new ShippingTypesResource(this.http);
  }

  /**
   * Clears the entire HTTP cache.
   */
  clearCache(): void {
    this.http.invalidateCache();
  }

  /**
   * Clears cached entries for a specific resource.
   * @param resource - Resource path pattern (e.g., 'products', 'variants')
   */
  clearResourceCache(resource: string): void {
    this.http.invalidateCache(resource);
  }

  /**
   * Handles a Bsale webhook payload by invalidating the cache
   * for the affected resource.
   * @param payload - Webhook payload from Bsale
   */
  handleWebhook(payload: BsaleWebhookPayload): void {
    const resource = WEBHOOK_TOPIC_TO_RESOURCE[payload.topic];
    if (resource) {
      this.http.invalidateCache(resource);
    }
  }
}
