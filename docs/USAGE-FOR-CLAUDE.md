# @misael703/bsale-sdk — Guía de uso para Claude

> Copia este contenido al CLAUDE.md de cualquier proyecto que consuma el SDK, o inclúyelo como contexto.

## Qué es

`@misael703/bsale-sdk` es un SDK de TypeScript para la API REST de Bsale (sistema de facturación electrónica). Compatible con Chile, Perú y México. Disponible en npmjs y GitHub Packages bajo el scope `@misael703`. Zero dependencies — usa fetch nativo de Node 20+.

## Instalación

```bash
npm add @misael703/bsale-sdk
```

Si se usa desde GitHub Packages (en vez de npmjs), agregar `.npmrc` en la raíz del proyecto consumidor:

```
@misael703:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

## Inicialización

```typescript
import { BsaleClient } from '@misael703/bsale-sdk';

const bsale = new BsaleClient({
  accessToken: process.env.BSALE_ACCESS_TOKEN!, // requerido
  // baseUrl: 'https://api.bsale.io/v1',        // Chile (default). Perú: api.bsale.com.pe, México: api.bsale.com.mx
  // timeout: 15000,                              // ms, default
  // maxRetries: 3,                               // default
  // cacheTtlMs: 60000,                           // ms, default
  // logger: (msg, data) => console.log(msg, data),
});
```

**Importante:** Instanciar UNA vez y reutilizar. El cliente mantiene un cache en memoria que se pierde si se re-instancia.

## Resources disponibles

El cliente expone 17 resources como propiedades readonly:

| Propiedad                | Tipo                     | Bsale path            | Métodos    |
| ------------------------ | ------------------------ | --------------------- | ---------- |
| `bsale.products`         | ProductsResource         | /products             | GET/POST/PUT |
| `bsale.variants`         | VariantsResource         | /variants             | GET/POST/PUT |
| `bsale.documents`        | DocumentsResource        | /documents            | GET/POST   |
| `bsale.clients`          | ClientsResource          | /clients              | GET/POST/PUT |
| `bsale.priceLists`       | PriceListsResource       | /price_lists          | GET/PUT    |
| `bsale.stocks`           | StocksResource           | /stocks               | GET        |
| `bsale.documentTypes`    | DocumentTypesResource    | /document_types       | GET        |
| `bsale.offices`          | OfficesResource          | /offices              | GET        |
| `bsale.shippings`        | ShippingsResource        | /shippings            | GET/POST/PUT |
| `bsale.paymentTypes`     | PaymentTypesResource     | /payment_types        | GET        |
| `bsale.stockReceptions`  | StockReceptionsResource  | /stocks/receptions    | GET/POST   |
| `bsale.stockConsumptions`| StockConsumptionsResource| /stocks/consumptions  | GET/POST   |
| `bsale.returns`          | ReturnsResource          | /returns              | GET/POST   |
| `bsale.thirdPartyDocuments`| ThirdPartyDocumentsResource| /third_party_documents| GET      |
| `bsale.productTypes`    | ProductTypesResource     | /product_types        | GET/POST/PUT/DELETE |
| `bsale.users`           | UsersResource            | /users                | GET        |
| `bsale.shippingTypes`   | ShippingTypesResource    | /shipping_types       | GET        |

## Métodos comunes (heredados de BaseResource)

Todos los resources tienen estos 4 métodos base:

```typescript
// Listar con paginación (max 50 por página)
const response = await bsale.products.list({ limit: 50, offset: 0, state: 0 });
// → BsaleListResponse<T> { count, limit, offset, items: T[], next? }

// Obtener TODOS los items (pagina automáticamente)
const all = await bsale.products.listAll(
  { state: 0 },               // query params opcionales
  { maxItems: 200, pageSize: 50 } // opciones de paginación
);
// → T[]

// Obtener por ID
const product = await bsale.products.getById(123, { expand: 'variants' });
// → T

// Contar
const { count } = await bsale.products.count({ state: 0 });
// → { count: number }
```

### Query params comunes

```typescript
{
  limit: 50,          // max 50 (límite de Bsale)
  offset: 0,
  expand: 'details,payments',  // incluir relaciones
  fields: 'id,name',           // limitar campos
  state: 0,           // 0 = activo, 1 = inactivo (contraintuitivo!)
  // cualquier otro filtro de la API de Bsale se pasa directo
}
```

## API por resource

### Products

```typescript
await bsale.products.list(params?)                    // GET /products.json
await bsale.products.listAll(params?, options?)        // todas las páginas
await bsale.products.getById(id, params?)              // GET /products/{id}.json
await bsale.products.count(params?)                    // GET /products/count.json
await bsale.products.getVariants(productId, params?)   // GET /products/{id}/variants.json
await bsale.products.create(data)                      // POST /products.json
await bsale.products.update(id, data)                  // PUT /products/{id}.json
```

### Variants

```typescript
await bsale.variants.list(params?)
await bsale.variants.getById(id, params?)
await bsale.variants.create(data)                      // POST /variants.json
await bsale.variants.update(id, data)                  // PUT /variants/{id}.json
await bsale.variants.getCosts(variantId)               // GET /variants/{id}/costs.json
```

### Documents

```typescript
await bsale.documents.list(params?)
await bsale.documents.getById(id, params?)
await bsale.documents.create(payload)                  // POST /documents.json
await bsale.documents.getByDateRange(from, to, params?) // filtra por emissiondaterange
await bsale.documents.getDetails(documentId, params?)  // GET /documents/{id}/details.json
await bsale.documents.getSummary(params?)              // GET /documents/summary.json
```

Ejemplo de creación de documento:

```typescript
import { BsaleDocumentCreatePayload } from '@misael703/bsale-sdk';

const payload: BsaleDocumentCreatePayload = {
  documentTypeId: 1,      // tipo de documento (ej: 1 = boleta)
  officeId: 1,             // sucursal
  emissionDate: toBsaleTimestamp(new Date()), // Unix seconds
  details: [
    { variantId: 456, quantity: 2, netUnitValue: 1000 },
  ],
  payments: [
    { paymentTypeId: 1, amount: 2380 },
  ],
  client: {
    code: '11111111-1',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@example.com',
  },
};

const doc = await bsale.documents.create(payload);
```

### Clients

```typescript
await bsale.clients.list(params?)
await bsale.clients.getById(id, params?)
await bsale.clients.create(data)                       // POST /clients.json
await bsale.clients.update(id, data)                   // PUT /clients/{id}.json
```

### Price Lists

```typescript
await bsale.priceLists.list(params?)
await bsale.priceLists.getById(id, params?)
await bsale.priceLists.getDetails(priceListId, params?) // GET /price_lists/{id}/details.json
await bsale.priceLists.updateDetail(priceListId, detailId, data) // PUT
```

**Nota:** No existe POST para listas de precio. Solo se pueden actualizar detalles existentes via PUT.

### Stocks

```typescript
await bsale.stocks.list(params?)
await bsale.stocks.getById(id, params?)
await bsale.stocks.getByVariantAndOffice(variantId, officeId)
```

**Nota:** Stock es read-only en la API de Bsale. Para modificar stock, usar recepciones/consumos (ver abajo).

### Document Types (read-only)

```typescript
await bsale.documentTypes.list(params?)               // GET /document_types.json
await bsale.documentTypes.getById(id, params?)         // GET /document_types/{id}.json
```

Útil para obtener el `documentTypeId` necesario al crear documentos.

### Offices (read-only)

```typescript
await bsale.offices.list(params?)                      // GET /offices.json
await bsale.offices.getById(id, params?)               // GET /offices/{id}.json
```

Sucursales/locales. Necesario para `officeId` en documentos, stock, recepciones, etc.

### Shippings (despachos)

```typescript
await bsale.shippings.list(params?)
await bsale.shippings.getById(id, params?)
await bsale.shippings.create(data)                     // POST /shippings.json
await bsale.shippings.update(id, data)                 // PUT /shippings/{id}.json
```

### Payment Types (read-only)

```typescript
await bsale.paymentTypes.list(params?)                 // GET /payment_types.json
await bsale.paymentTypes.getById(id, params?)          // GET /payment_types/{id}.json
```

Formas de pago. Necesario para `paymentTypeId` en los payments de un documento.

### Stock Receptions (recepciones de stock)

```typescript
await bsale.stockReceptions.list(params?)              // GET /stocks/receptions.json
await bsale.stockReceptions.getById(id, params?)       // GET /stocks/receptions/{id}.json
await bsale.stockReceptions.create(data)               // POST /stocks/receptions.json
```

Ejemplo de recepción de stock:

```typescript
import { BsaleStockReceptionPayload } from '@misael703/bsale-sdk';

const reception: BsaleStockReceptionPayload = {
  officeId: 1,
  admissionDate: toBsaleTimestamp(new Date()),
  note: 'Recepción de mercadería',
  details: [
    { variantId: 456, quantity: 100, cost: 500 },
    { variantId: 789, quantity: 50 },
  ],
};

await bsale.stockReceptions.create(reception);
```

### Stock Consumptions (consumos de stock)

```typescript
await bsale.stockConsumptions.list(params?)            // GET /stocks/consumptions.json
await bsale.stockConsumptions.getById(id, params?)     // GET /stocks/consumptions/{id}.json
await bsale.stockConsumptions.create(data)             // POST /stocks/consumptions.json
```

Ejemplo de consumo de stock:

```typescript
import { BsaleStockConsumptionPayload } from '@misael703/bsale-sdk';

const consumption: BsaleStockConsumptionPayload = {
  officeId: 1,
  admissionDate: toBsaleTimestamp(new Date()),
  note: 'Merma de inventario',
  details: [
    { variantId: 456, quantity: 5 },
  ],
};

await bsale.stockConsumptions.create(consumption);
```

### Returns (devoluciones)

```typescript
await bsale.returns.list(params?)
await bsale.returns.getById(id, params?)
await bsale.returns.count(params?)
await bsale.returns.getDetails(returnId, params?)   // GET /returns/{id}/details.json
await bsale.returns.create(data)                     // POST /returns.json
await bsale.returns.annul(data)                      // POST /returns/annulments.json
```

La creación requiere: `documentTypeId`, `officeId`, `referenceDocumentId`, y `details` con `documentDetailId` + `quantity`.

### Third Party Documents (documentos de terceros, read-only)

```typescript
await bsale.thirdPartyDocuments.list(params?)        // GET /third_party_documents.json
await bsale.thirdPartyDocuments.getById(id, params?) // GET /third_party_documents/{id}.json
await bsale.thirdPartyDocuments.count(params?)       // GET /third_party_documents/count.json
```

### Product Types (tipos de producto/servicio)

```typescript
await bsale.productTypes.list(params?)
await bsale.productTypes.getById(id, params?)
await bsale.productTypes.count(params?)
await bsale.productTypes.getProducts(productTypeId, params?)    // GET /product_types/{id}/products.json
await bsale.productTypes.getAttributes(productTypeId, params?)  // GET /product_types/{id}/attributes.json
await bsale.productTypes.create(data)                           // POST /product_types.json
await bsale.productTypes.update(id, data)                       // PUT /product_types/{id}.json
await bsale.productTypes.delete(id)                             // DELETE /product_types/{id}.json
```

### Users (read-only)

```typescript
await bsale.users.list(params?)
await bsale.users.getById(id, params?)
await bsale.users.count(params?)
await bsale.users.getSalesSummary(params?)            // GET /users/sales_summary.json?userid=X&startdate=Y&enddate=Z
await bsale.users.getSales(userId, params?)          // GET /users/{id}/sales.json
await bsale.users.getReturns(userId, params?)        // GET /users/{id}/returns.json
```

### Shipping Types (tipos de despacho, read-only)

```typescript
await bsale.shippingTypes.list(params?)              // GET /shipping_types.json
await bsale.shippingTypes.getById(id, params?)       // GET /shipping_types/{id}.json
```

## Utilidades de fecha

Bsale usa Unix timestamps en **SEGUNDOS** (no milisegundos). El SDK incluye helpers:

```typescript
import {
  toBsaleTimestamp,    // Date → Unix seconds
  fromBsaleTimestamp,  // Unix seconds → Date
  formatBsaleDate,     // Unix seconds → string legible (default: es-CL)
  todayBsaleTimestamp, // Hoy 00:00 como Unix seconds
} from '@misael703/bsale-sdk';

// Ejemplos
toBsaleTimestamp(new Date('2024-01-15'))  // → 1705276800
fromBsaleTimestamp(1705276800)            // → Date
formatBsaleDate(1705276800)              // → "15-01-2024"
formatBsaleDate(1705276800, 'en-US')     // → "01/15/2024"
todayBsaleTimestamp()                    // → Unix seconds de hoy a las 00:00
```

## Manejo de errores

```typescript
import { BsaleApiError } from '@misael703/bsale-sdk';

try {
  await bsale.products.getById(999999);
} catch (error) {
  if (error instanceof BsaleApiError) {
    error.status;        // HTTP status code
    error.path;          // URL que falló
    error.responseBody;  // body crudo de la respuesta
    error.isNotFound;    // true si 404
    error.isRateLimit;   // true si 429
    error.isServerError; // true si >= 500
  }
}
```

El SDK maneja automáticamente:
- **Rate limit (429):** Espera `Retry-After` header y reintenta.
- **Errores 5xx:** Retry con backoff exponencial (hasta `maxRetries`).
- **Timeout:** AbortController con el tiempo configurado.
- **Body vacío:** Bsale a veces retorna 200 con body vacío → se retorna `{}`.

**NO** hace retry en errores 4xx (excepto 429).

## Cache

- GET requests se cachean en memoria con TTL configurable (default: 60s).
- POST, PUT, DELETE invalidan automáticamente el cache del resource afectado.
- Para limpiar manualmente:

```typescript
bsale.clearCache();                    // todo el cache
bsale.clearResourceCache('products');  // solo products
```

## Webhooks

Si recibes webhooks de Bsale, pasa el payload al cliente para invalidar el cache:

```typescript
import { BsaleWebhookPayload } from '@misael703/bsale-sdk';

// El payload de Bsale tiene esta estructura:
// { cpnId, resource, resourceId, topic, action, send, officeId? }
// topic: 'product' | 'variant' | 'document' | 'price' | 'stock'
// action: 'post' | 'put' | 'delete'

function handleBsaleWebhook(payload: BsaleWebhookPayload) {
  bsale.handleWebhook(payload); // invalida cache del resource afectado
}
```

## Tipos exportados

Todos los tipos se importan desde el paquete raíz:

```typescript
import type {
  // Configuración
  BsaleConfig,

  // Respuesta paginada genérica
  BsaleListResponse,    // { count, limit, offset, items: T[], next? }
  BsaleQueryParams,     // { limit?, offset?, expand?, fields?, [key]: any }
  BsalePaginateOptions, // { maxItems?, pageSize? }

  // Entidades (lo que devuelve la API)
  BsaleProduct,
  BsaleVariant,
  BsaleDocument,
  BsaleClientType,      // ← renombrado para evitar colisión con la clase BsaleClient
  BsalePriceList,
  BsalePriceListDetail,
  BsaleStock,
  BsaleDocumentType,
  BsaleOffice,
  BsaleShipping,
  BsalePaymentType,
  BsaleStockReception,
  BsaleStockConsumption,

  // Payloads (lo que envías a la API)
  BsaleProductPayload,
  BsaleVariantPayload,
  BsaleDocumentCreatePayload,
  BsaleDocumentDetail,
  BsaleDocumentPayment,
  BsaleClientPayload,
  BsalePriceListDetailPayload,
  BsaleShippingPayload,
  BsaleStockReceptionPayload,
  BsaleStockReceptionDetail,
  BsaleStockConsumptionPayload,
  BsaleStockConsumptionDetail,

  // Returns
  BsaleReturn,
  BsaleReturnDetail,
  BsaleReturnCreatePayload,
  BsaleReturnAnnulmentPayload,
  BsaleReturnAnnulment,

  // Third-party documents
  BsaleThirdPartyDocument,

  // Product types
  BsaleProductType,
  BsaleProductTypeAttribute,
  BsaleProductTypePayload,

  // Users
  BsaleUser,
  BsaleUserSalesSummary,

  // Shipping types
  BsaleShippingType,

  // Webhook
  BsaleWebhookPayload,
} from '@misael703/bsale-sdk';
```

## Gotchas importantes

1. **`state: 0` = activo, `state: 1` = inactivo.** Es contraintuitivo. Siempre filtrar con `state: 0` para items activos.
2. **Fechas en SEGUNDOS, no milisegundos.** Usar los helpers `toBsaleTimestamp()` / `fromBsaleTimestamp()`.
3. **Paginación max 50.** Aunque pases `limit: 100`, Bsale solo devuelve 50. Usar `listAll()` para obtener todo.
4. **El tipo del cliente se exporta como `BsaleClientType`** (no `BsaleClient`) para evitar colisión con la clase principal `BsaleClient`.
5. **El token va como header `access_token`**, NO como `Authorization: Bearer`. El SDK ya lo maneja, no hay que preocuparse.
6. **Los webhooks usan `/v2/`** en el campo `resource`, pero la API principal es `/v1/`. El SDK lo maneja transparentemente.

## Patrón recomendado para proyectos consumidores

```typescript
// lib/bsale.ts — singleton del cliente
import { BsaleClient } from '@misael703/bsale-sdk';

export const bsale = new BsaleClient({
  accessToken: process.env.BSALE_ACCESS_TOKEN!,
  logger: process.env.NODE_ENV === 'development'
    ? (msg, data) => console.log(`[bsale] ${msg}`, data)
    : undefined,
});
```

```typescript
// En cualquier otro archivo
import { bsale } from '../lib/bsale';

const products = await bsale.products.listAll({ state: 0 });
```
