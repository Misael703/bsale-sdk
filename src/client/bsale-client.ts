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
  PaymentsResource,
  DynamicAttributesResource,
  DiscountsResource,
  CurrenciesResource,
  SaleConditionsResource,
  InstancesResource,
  BookTypesResource,
  DteCodesResource,
  TaxesResource,
  StockConsumptionTypesResource,
  CartsResource,
  CheckoutsResource,
  WebDescriptionsResource,
  CollectionsResource,
  VariantShippingResource,
  CouponsResource,
  CourierOrdersResource,
  PaymentsGatewayResource,
} from '../resources';
import type {
  BsaleConfig,
  BsaleMiddleware,
  BsaleWebhookPayload,
  BsaleWebhookTopic,
} from '../types';

const DEFAULT_HOSTS = {
  api: 'https://api.bsale.io',
  bsp: 'https://bsp-api.bsale.io',
  credential: 'https://credential.bsale.io',
  courier: 'https://courier.bsale.io',
  bcash: 'https://bcash.bsale.io',
} as const;

const WEBHOOK_TOPIC_TO_RESOURCE: Record<BsaleWebhookTopic, string> = {
  product: 'products',
  variant: 'variants',
  document: 'documents',
  price: 'price_lists',
  stock: 'stocks',
  payment: 'payments',
  courierOrder: 'couriers',
};

/**
 * Main entry point for the Bsale SDK (Chile).
 *
 * El cliente mantiene un pool interno de HttpClients (uno por host). Por
 * defecto solo se usa `api.bsale.io`; los otros 4 hosts (`bsp-api`,
 * `credential`, `courier`, `bcash`) se inicializan eagerly y se asignan a
 * los recursos que los necesitan.
 */
export class BsaleClient {
  private readonly apiHttp: HttpClient;
  private readonly bspHttp: HttpClient;
  private readonly credentialHttp: HttpClient;
  private readonly courierHttp: HttpClient;
  private readonly bcashHttp: HttpClient;

  // ===== Recursos del host principal (`api.bsale.io`) =====

  /** Productos y servicios. */
  readonly products: ProductsResource;
  /** Variantes de productos. */
  readonly variants: VariantsResource;
  /** Documentos tributarios. */
  readonly documents: DocumentsResource;
  /** Clientes. */
  readonly clients: ClientsResource;
  /** Listas de precio. */
  readonly priceLists: PriceListsResource;
  /** Stock por sucursal × variante. */
  readonly stocks: StocksResource;
  /** Tipos de documento. */
  readonly documentTypes: DocumentTypesResource;
  /** Sucursales. */
  readonly offices: OfficesResource;
  /** Despachos (guías de despacho DTE). */
  readonly shippings: ShippingsResource;
  /** Formas de pago. */
  readonly paymentTypes: PaymentTypesResource;
  /** Recepciones de stock. */
  readonly stockReceptions: StockReceptionsResource;
  /** Consumos de stock. */
  readonly stockConsumptions: StockConsumptionsResource;
  /** Devoluciones (notas de crédito/débito). */
  readonly returns: ReturnsResource;
  /** Documentos de terceros. */
  readonly thirdPartyDocuments: ThirdPartyDocumentsResource;
  /** Tipos de producto. */
  readonly productTypes: ProductTypesResource;
  /** Usuarios. */
  readonly users: UsersResource;
  /** Tipos de despacho. */
  readonly shippingTypes: ShippingTypesResource;
  /** Pagos aplicados a documentos. */
  readonly payments: PaymentsResource;
  /** Atributos dinámicos. */
  readonly dynamicAttributes: DynamicAttributesResource;
  /** Descuentos (mezcla v1+v2). */
  readonly discounts: DiscountsResource;
  /** Monedas (path: `/coins`). */
  readonly currencies: CurrenciesResource;
  /** Condiciones de venta. */
  readonly saleConditions: SaleConditionsResource;
  /** Tipos de libro tributario SII. */
  readonly bookTypes: BookTypesResource;
  /** Códigos tributarios DTE (catálogo SII). */
  readonly dteCodes: DteCodesResource;
  /** Impuestos. */
  readonly taxes: TaxesResource;
  /** Tipos de consumo de stock. */
  readonly stockConsumptionTypes: StockConsumptionTypesResource;
  /** Carros de e-commerce. */
  readonly carts: CartsResource;
  /** Checkouts de e-commerce. */
  readonly checkouts: CheckoutsResource;
  /** Descripciones web (productos publicados en la tienda). */
  readonly webDescriptions: WebDescriptionsResource;
  /** Colecciones de e-commerce. */
  readonly collections: CollectionsResource;
  /** Medidas de envío de variantes (tienda). */
  readonly variantShipping: VariantShippingResource;
  /** Cupones de descuento. */
  readonly coupons: CouponsResource;

  // ===== Recursos en hosts alternativos =====

  /** Metadata de la instancia (host: `credential.bsale.io`). */
  readonly instances: InstancesResource;
  /** Órdenes de envío con couriers (host: `courier.bsale.io`). */
  readonly courierOrders: CourierOrdersResource;
  /** Pasarela de pagos — lado MPE (host: `bcash.bsale.io`). */
  readonly paymentsGateway: PaymentsGatewayResource;

  constructor(config: BsaleConfig) {
    const apiBase = config.baseUrl ?? `${config.hosts?.api ?? DEFAULT_HOSTS.api}/v1`;
    const bspBase = `${config.hosts?.bsp ?? DEFAULT_HOSTS.bsp}/v1`;
    const credentialBase = `${config.hosts?.credential ?? DEFAULT_HOSTS.credential}/v1`;
    const courierBase = `${config.hosts?.courier ?? DEFAULT_HOSTS.courier}/v1`;
    const bcashBase = `${config.hosts?.bcash ?? DEFAULT_HOSTS.bcash}/v1`;

    this.apiHttp = new HttpClient({ ...config, baseUrl: apiBase });
    this.bspHttp = new HttpClient({ ...config, baseUrl: bspBase });
    this.credentialHttp = new HttpClient({ ...config, baseUrl: credentialBase });
    this.courierHttp = new HttpClient({ ...config, baseUrl: courierBase });
    this.bcashHttp = new HttpClient({ ...config, baseUrl: bcashBase });

    // Recursos del host principal.
    this.products = new ProductsResource(this.apiHttp);
    this.variants = new VariantsResource(this.apiHttp);
    this.documents = new DocumentsResource(this.apiHttp);
    this.clients = new ClientsResource(this.apiHttp);
    this.priceLists = new PriceListsResource(this.apiHttp);
    this.stocks = new StocksResource(this.apiHttp);
    this.documentTypes = new DocumentTypesResource(this.apiHttp);
    this.offices = new OfficesResource(this.apiHttp);
    this.shippings = new ShippingsResource(this.apiHttp);
    this.paymentTypes = new PaymentTypesResource(this.apiHttp);
    this.stockReceptions = new StockReceptionsResource(this.apiHttp);
    this.stockConsumptions = new StockConsumptionsResource(this.apiHttp);
    this.returns = new ReturnsResource(this.apiHttp);
    this.thirdPartyDocuments = new ThirdPartyDocumentsResource(this.apiHttp, this.bspHttp);
    this.productTypes = new ProductTypesResource(this.apiHttp);
    this.users = new UsersResource(this.apiHttp);
    this.shippingTypes = new ShippingTypesResource(this.apiHttp);
    this.payments = new PaymentsResource(this.apiHttp);
    this.dynamicAttributes = new DynamicAttributesResource(this.apiHttp);
    this.discounts = new DiscountsResource(this.apiHttp);
    this.currencies = new CurrenciesResource(this.apiHttp);
    this.saleConditions = new SaleConditionsResource(this.apiHttp);
    this.bookTypes = new BookTypesResource(this.apiHttp);
    this.dteCodes = new DteCodesResource(this.apiHttp);
    this.taxes = new TaxesResource(this.apiHttp);
    this.stockConsumptionTypes = new StockConsumptionTypesResource(this.apiHttp);
    this.carts = new CartsResource(this.apiHttp);
    this.checkouts = new CheckoutsResource(this.apiHttp);
    this.webDescriptions = new WebDescriptionsResource(this.apiHttp);
    this.collections = new CollectionsResource(this.apiHttp);
    this.variantShipping = new VariantShippingResource(this.apiHttp);
    this.coupons = new CouponsResource(this.apiHttp);

    // Recursos en hosts alternativos.
    this.instances = new InstancesResource(this.credentialHttp, config.accessToken);
    this.courierOrders = new CourierOrdersResource(this.courierHttp);
    this.paymentsGateway = new PaymentsGatewayResource(this.bcashHttp);
  }

  /** Registra un middleware que se aplica a las requests de los 5 hosts. */
  use(middleware: BsaleMiddleware): void {
    this.apiHttp.use(middleware);
    this.bspHttp.use(middleware);
    this.credentialHttp.use(middleware);
    this.courierHttp.use(middleware);
    this.bcashHttp.use(middleware);
  }

  /** Limpia el cache de todos los hosts. */
  clearCache(): void {
    this.apiHttp.invalidateCache();
    this.bspHttp.invalidateCache();
    this.credentialHttp.invalidateCache();
    this.courierHttp.invalidateCache();
    this.bcashHttp.invalidateCache();
  }

  /** Limpia el cache de un recurso en todos los hosts. */
  clearResourceCache(resource: string): void {
    this.apiHttp.invalidateCache(resource);
    this.bspHttp.invalidateCache(resource);
    this.credentialHttp.invalidateCache(resource);
    this.courierHttp.invalidateCache(resource);
    this.bcashHttp.invalidateCache(resource);
  }

  /**
   * Procesa un webhook entrante invalidando el cache del recurso afectado.
   * Topic `courierOrder` invalida cache en `courierHttp`; el resto en `apiHttp`.
   */
  handleWebhook(payload: BsaleWebhookPayload): void {
    const resource = WEBHOOK_TOPIC_TO_RESOURCE[payload.topic];
    if (!resource) return;
    if (payload.topic === 'courierOrder') {
      this.courierHttp.invalidateCache(resource);
    } else {
      this.apiHttp.invalidateCache(resource);
    }
  }
}
