// Main client
export { BsaleClient } from './client/bsale-client';
export { HttpClient } from './client/http-client';

// Error
export { BsaleApiError } from './errors/bsale.error';

// Resources
export {
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
} from './resources';

// Types
export type {
  BsaleConfig,
  BsaleListResponse,
  BsaleQueryParams,
  BsalePaginateOptions,
  BsaleProduct,
  BsaleProductPayload,
  BsaleVariant,
  BsaleVariantPayload,
  BsaleDocument,
  BsaleDocumentDetail,
  BsaleDocumentPayment,
  BsaleDocumentReference,
  BsaleDocumentDispatch,
  BsaleDocumentCreatePayload,
  BsaleClient as BsaleClientType,
  BsaleClientPayload,
  BsalePriceList,
  BsalePriceListDetail,
  BsalePriceListDetailPayload,
  BsaleStock,
  BsaleDocumentType,
  BsaleOffice,
  BsaleShipping,
  BsaleShippingPayload,
  BsalePaymentType,
  BsaleStockReception,
  BsaleStockReceptionDetail,
  BsaleStockReceptionPayload,
  BsaleStockConsumption,
  BsaleStockConsumptionDetail,
  BsaleStockConsumptionPayload,
  BsaleReturn,
  BsaleReturnDetail,
  BsaleReturnDetailPayload,
  BsaleReturnPayment,
  BsaleReturnCreatePayload,
  BsaleReturnAnnulmentPayload,
  BsaleReturnAnnulment,
  BsaleThirdPartyDocument,
  BsaleProductType,
  BsaleProductTypeAttribute,
  BsaleProductTypeAttributePayload,
  BsaleProductTypePayload,
  BsaleUser,
  BsaleUserSalesSummary,
  BsaleShippingType,
  BsaleWebhookPayload,
} from './types';

// Utilities
export {
  toBsaleTimestamp,
  fromBsaleTimestamp,
  formatBsaleDate,
  todayBsaleTimestamp,
} from './utils/date.utils';
