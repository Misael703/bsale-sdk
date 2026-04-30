# @misael703/bsale-sdk

SDK en TypeScript para la API REST de [Bsale](https://www.bsale.cl) — versión Chile.

- **35 recursos** cubriendo el 100% de la documentación oficial.
- **Zero dependencies** en runtime — solo `fetch` nativo de Node 20+.
- **5 hosts** y **3 versiones** (v1/v2/v3) manejados internamente.
- Cache en memoria, retry con backoff, manejo de rate-limit.
- Webhooks con tipos discriminados por `topic`.

> Solo Chile (`api.bsale.io`). Perú y México fuera del alcance del SDK.

---

## Instalación

```bash
pnpm add @misael703/bsale-sdk
# o
npm install @misael703/bsale-sdk
```

Requiere Node 20+ (usa `fetch` global).

---

## Quick start

```typescript
import { BsaleClient } from '@misael703/bsale-sdk';

const bsale = new BsaleClient({
  accessToken: process.env.BSALE_TOKEN!,
});

// Listar productos
const products = await bsale.products.list({ limit: 10, state: 0 });

// Obtener un producto por ID
const product = await bsale.products.getById(123);

// Iterar TODOS los productos respetando paginación
const all = await bsale.products.listAll({ state: 0 });
```

---

## Configuración

```typescript
const bsale = new BsaleClient({
  // Requerido — token de la API Bsale.
  accessToken: process.env.BSALE_TOKEN!,

  // Opcional — overrides de hosts (sandbox, proxies, etc.).
  hosts: {
    api: 'https://api.bsale.io',
    bsp: 'https://bsp-api.bsale.io',
    credential: 'https://credential.bsale.io',
    courier: 'https://courier.bsale.io',
    bcash: 'https://bcash.bsale.io',
  },

  // Opcional — request timeout (ms). Default 15000.
  timeout: 15000,

  // Opcional — reintentos para 5xx y errores de red. Default 3.
  maxRetries: 3,

  // Opcional — TTL del cache en memoria (ms). Default 60000.
  cacheTtlMs: 60000,

  // Opcional — logger para request/response.
  logger: (message, data) => console.log(`[bsale] ${message}`, data),
});
```

### Hosts soportados

| Host | Recursos |
|---|---|
| `api.bsale.io` | API principal — todos los recursos comerciales |
| `bsp-api.bsale.io` | Aceptación/reclamo de DTE de terceros |
| `credential.bsale.io` | Metadata de instancia |
| `courier.bsale.io` | Integración con couriers (e-commerce) |
| `bcash.bsale.io` | Pasarela de pagos (lado MPE) |

El SDK pasa automáticamente cada recurso al host correcto. Solo hay que configurar `hosts` si necesitas apuntar a sandbox o proxy.

---

## Recursos disponibles

### Operaciones comerciales

| Recurso | Acceso | Descripción |
|---|---|---|
| `products` | CRUD + `getVariants`, `getTaxes`, `createPack` | Productos y servicios |
| `variants` | CRUD + `getCosts`, `getAttributeValues` | Variantes de productos |
| `documents` | CRUD parcial + 9 sub-recursos | Documentos tributarios |
| `clients` | CRUD + contactos, direcciones, atributos, puntos | Clientes |
| `returns` | CR + `annul` | Devoluciones (NC) y anulaciones (ND) |
| `shippings` | CR + `getDetails` | Guías de despacho DTE |
| `payments` | CR + `getGroupedByPaymentTypes`, deuda por cliente | Pagos a documentos |

### Inventario

| Recurso | Acceso | Descripción |
|---|---|---|
| `stocks` | R + `getByVariantAndOffice` | Stock por variante × sucursal |
| `stockReceptions` | CRUD parcial + `getDetails` | Ingresos de stock |
| `stockConsumptions` | CR + `getDetails` | Egresos de stock |

### Catálogos / configuración

| Recurso | Acceso | Notas |
|---|---|---|
| `productTypes` | CRUD completo + atributos | Tipos de producto/servicio |
| `documentTypes` | R + `update`, `getCaf`, `getNumberAvailables` | Tipos de documento (folios SII) |
| `paymentTypes` | RC + `getDynamicAttributes` | Formas de pago |
| `shippingTypes` | R | Tipos de despacho (catálogo SII) |
| `saleConditions` | R | Condiciones de venta a crédito |
| `currencies` | R + `getExchangeRate`, `getDefault` | Monedas (path: `/coins`) |
| `taxes` | R | Impuestos (IVA, ILA, etc.) |
| `dteCodes` | R | Códigos tributarios SII |
| `bookTypes` | R | Tipos de libro tributario |
| `dynamicAttributes` | R + `getDetails` | Atributos dinámicos |
| `stockConsumptionTypes` | R | Tipos de consumo (mermas, retiro, etc.) |
| `offices` | CRUD | Sucursales |
| `users` | R + ventas y devoluciones por usuario | Vendedores |
| `priceLists` | R + `updateDetail` | Listas de precio |

### E-commerce / tienda en línea

| Recurso | Acceso | Descripción |
|---|---|---|
| `carts` | CRUD parcial | Carros de compra |
| `checkouts` | CRUD + `getByToken` | Pre-ventas confirmadas |
| `webDescriptions` | CRU + `getPictures` | Publicación de productos en tienda |
| `collections` | RC | Colecciones (categorías agrupadoras) |
| `variantShipping` | CRU | Medidas de envío de variantes |
| `coupons` | CRU + `disable` | Cupones de descuento |
| `discounts` | CRUD + `addDetail`, `removeDetail` | Descuentos automáticos |

### Hosts alternativos

| Recurso | Host | Descripción |
|---|---|---|
| `instances` | `credential.bsale.io` | Metadata de la empresa (token en path) |
| `thirdPartyDocuments` | `api` + `bsp-api` | Compras + claims SII |
| `courierOrders` | `courier.bsale.io` | Integración con couriers |
| `paymentsGateway` | `bcash.bsale.io` | Pasarela (lado MPE — uso atípico) |

### Métodos heredados

Cada recurso que extiende `BaseResource<T>` recibe gratis:

- `list(params?)` — listado paginado.
- `listAll(params?, options?)` — itera todas las páginas (max 50/página). Acepta `{ maxItems, pageSize }`.
- `getById(id, params?)` — detalle.
- `count(params?)` — `{ count: number }`.

---

## Ejemplos por recurso

### Productos

```typescript
const list = await bsale.products.list({ state: 0 });
const product = await bsale.products.getById(123);
const variants = await bsale.products.getVariants(123);

// CRUD
await bsale.products.create({ name: 'Nuevo', productTypeId: 1 });
await bsale.products.update(123, { name: 'Actualizado' });
await bsale.products.delete(123); // soft delete (state→1)

// Sub-recursos
const taxes = await bsale.products.getTaxes(123);
const tax = await bsale.products.getTaxById(123, 1);

// Pack (endpoint /v2/)
await bsale.products.createPack({
  productTypeId: 1,
  basePrice: 10000,
  name: 'Pack ejemplo',
  barCode: 'PACK001',
  code: 'PACK001',
  packDetails: [{ variantPromoId: 8901, quantity: 2 }],
});
```

### Variantes

```typescript
const variants = await bsale.variants.list({ productid: 123 });
await bsale.variants.create({
  productId: 123,
  description: 'Talla M',
  code: 'SKU-M',
  attribute_values: [{ description: 'M', attributeId: 5 }],
});
const costs = await bsale.variants.getCosts(456);
const attrs = await bsale.variants.getAttributeValues(456);
```

### Documentos

```typescript
// Listar por rango de fechas
const docs = await bsale.documents.getByDateRange(1700000000, 1702592000);

// Crear documento
const doc = await bsale.documents.create({
  documentTypeId: 8,
  officeId: 1,
  emissionDate: 1705276800,
  expirationDate: 1705276800,
  declareSii: 1,
  client: { code: '12345678-9', company: 'Acme', city: 'Santiago' },
  details: [{ variantId: 123, netUnitValue: 1000, quantity: 2, taxId: '[1]' }],
  payments: [{ paymentTypeId: 1, amount: 2380, recordDate: 1705276800 }],
});

// Sub-recursos
const details = await bsale.documents.getDetails(doc.id);
const refs = await bsale.documents.getReferences(doc.id);
const taxes = await bsale.documents.getTaxes(doc.id);
const sellers = await bsale.documents.getSellers(doc.id);

// Reportes
const summary = await bsale.documents.getSummary({
  emissiondaterange: '[1700000000,1702592000]',
});
const ticketSummary = await bsale.documents.getSummaryTicket();
const costs = await bsale.documents.getCosts({ documentid: doc.id });

// Eliminar (solo no-electrónicos)
await bsale.documents.delete(doc.id, /* officeId */ 1);
```

### Clientes

```typescript
const client = await bsale.clients.create({
  firstName: 'Juan',
  lastName: 'Pérez',
  code: '11111111-1',
  email: 'juan@example.com',
  hasCredit: 1,
  maxCredit: 100000,
});
await bsale.clients.update(client.id, { phone: '+56900000000' });
await bsale.clients.delete(client.id); // soft delete (state→99)

// Contactos
await bsale.clients.createContact(client.id, {
  firstName: 'María', lastName: 'Soto', email: 'maria@example.com',
});
const contacts = await bsale.clients.getContacts(client.id);
await bsale.clients.deleteContact(client.id, contacts.items[0].id);

// Direcciones
await bsale.clients.createAddress(client.id, {
  addressName: 'Sucursal Las Condes',
  address: 'Av. Apoquindo 4500',
  city: 'Santiago',
  municipality: 'Las Condes',
});

// Puntos (endpoint plano: /clients/points.json)
await bsale.clients.adjustPoints({
  type: 0, // 0 = aumenta, 1 = resta
  clientId: client.id,
  points: 50,
  description: 'Compra de noviembre',
});
```

### Devoluciones

```typescript
const ret = await bsale.returns.create({
  documentTypeId: 9,
  officeId: 1,
  referenceDocumentId: 11528,
  emissionDate: 1700000000,
  expirationDate: 1700000000,
  motive: 'Devolución de producto',
  declareSii: 1,
  priceAdjustment: 0,
  editTexts: 0,
  type: 0, // 0=dinero, 1=nueva venta, 2=línea de crédito, 3=otra
  client: { code: '11111111-1' },
  details: [{ documentDetailId: 21493, quantity: 1, unitValue: '0' }],
});

// Anular: requiere returnId como primer argumento
await bsale.returns.annul(ret.id, {
  documentTypeId: 37,
  referenceDocumentId: ret.id,
  emissionDate: 1700000000,
  expirationDate: 1700000000,
  declareSii: 1,
});
```

### Despachos (DTE)

```typescript
await bsale.shippings.create({
  shippingTypeId: 1,
  emissionDate: 1705276800,
  officeId: 1,
  recipient: 'Juan Pérez',
  address: 'Av. Principal 123',
  details: [
    // Modalidad "manual"
    { code: 'SKU-001', quantity: 5, netUnitValue: 1000 },
    // Modalidad "desde documento existente"
    { detailId: 12345, quantity: 2 },
  ],
});

// Anular (revierte stock)
await bsale.shippings.delete(/* shippingId */ 22);

// Items
const details = await bsale.shippings.getDetails(22);
```

> No existe `update()` — los despachos no se editan en la API oficial.

### Pagos

```typescript
// Solo sobre documentos cuya forma de pago original sea crédito
await bsale.payments.create({
  recordDate: 1705276800,
  documentId: 100,
  amount: 50000,
  paymentTypeId: 4,
});

// Reportería
const grouped = await bsale.payments.getGroupedByPaymentTypes({
  recorddate: 1705276800,
});

// Deuda de un cliente
const debt = await bsale.payments.getClientUnpaidDocuments({
  clientId: 1,
  comparisonDate: Math.floor(Date.now() / 1000),
});
console.log(debt.totalDebt, debt.overdue_documents);
```

### Stock

```typescript
const stock = await bsale.stocks.getByVariantAndOffice(456, 1);

// Recepción (ingreso)
await bsale.stockReceptions.create({
  document: 'Guía',
  officeId: 1,
  documentNumber: '123',
  details: [{ code: 'SKU-001', quantity: 100, cost: 500 }],
});

// Consumo (merma, retiro, etc.)
await bsale.stockConsumptions.create({
  officeId: 1,
  consumptionTypeId: 1, // ver bsale.stockConsumptionTypes.list()
  note: 'Merma de inventario',
  details: [{ variantId: 456, quantity: 5 }],
});
```

### Catálogos

```typescript
// Configuración del tenant
const offices = await bsale.offices.list();
await bsale.offices.create({ name: 'Nueva Sucursal', address: '...' });

const productTypes = await bsale.productTypes.list();
await bsale.productTypes.create({
  name: 'Polera',
  attributes: [
    { name: 'Talla', hasOptions: 1, options: 'S|M|L|XL', generateVariantName: 1 },
  ],
});

// Catálogos SII
const docTypes = await bsale.documentTypes.list();
const caf = await bsale.documentTypes.getCaf({ codeSii: '33' });
const folios = await bsale.documentTypes.getNumberAvailables({ documentTypeId: 1 });
const sii = await bsale.dteCodes.list({ codesii: '33' });
const taxes = await bsale.taxes.list();
const books = await bsale.bookTypes.list();

// Monedas
const currencies = await bsale.currencies.list();
const def = await bsale.currencies.getDefault();
const rate = await bsale.currencies.getExchangeRate(2, 1700000000);
```

### Listas de precio

```typescript
const lists = await bsale.priceLists.list();
const details = await bsale.priceLists.getDetails(1);
await bsale.priceLists.updateDetail(1, 100, { variantValue: 5000, id: 100 });
```

### Usuarios (vendedores)

```typescript
const summary = await bsale.users.getSalesSummary({
  startdate: 1700000000,
  enddate: 1702592000,
});
const sales = await bsale.users.getSales(2, {
  startdate: 1700000000,
  enddate: 1702592000,
});
```

### E-commerce

```typescript
// Cupones
await bsale.coupons.create({
  name: 'Inauguración',
  type: '1', // 0=monto, 1=%, 2=despacho gratis
  amount: 20,
  serialNumber: 'INAU2025',
  properties: { fromDate: 1700000000, uses: '100', combinable: false },
});
await bsale.coupons.disable(123);

// Descuentos (mezcla v1+v2 internamente)
// Atención: fechas en formato 'DD/MM/YYYY' (no Unix ts).
await bsale.discounts.create({
  name: 'Black Friday',
  percentage: 20,
  type: 0, // 0=porcentaje, 1=lista de precios
  state: 0,
  byDate: 1,
  startDate: '24/11/2025',
  endDate: '27/11/2025',
});

// Pedidos web
const cart = await bsale.carts.create({
  cartDetails: [{
    quantity: 1, unitValue: 13700, itemName: 'Producto',
    idVarianteProducto: 4622, productWebId: 10,
  }],
});

const checkout = await bsale.checkouts.create({
  clientName: 'Juan',
  clientLastName: 'Pérez',
  clientEmail: 'juan@example.com',
  clientPhone: '+56900000000',
  marketId: 1,
  withdrawStore: 0, // 0=domicilio, 1=retiro en tienda
  ptId: 2,
  payProcess: 'for_validate',
  clientCountry: 'Chile',
  clientState: 'Región Metropolitana',
  clientCityZone: 'Santiago',
  clientStreet: 'Av. Principal 123',
  clientPostcode: '7550000',
  clientBuildingNumber: 'Depto 401',
  cartDetails: cart.data.cartDetails.map((d) => ({
    quantity: d.quantity,
    netUnitValue: d.netUnitValue,
    idVarianteProducto: d.idVarianteProducto,
    productWebId: d.productWebId!,
  })),
  generateDocument: 1,
});

const detail = await bsale.checkouts.getByToken(checkout.data.token);

// Descripciones web (publicación de productos en tienda online)
const products = await bsale.webDescriptions.list({
  storeId: 1,
  priceListId: 6,
});

// Colecciones
const collections = await bsale.collections.list();
await bsale.collections.addProduct(/* collectionId */ 1, { code: 'SKU-001' });

// Medidas de envío de variantes
await bsale.variantShipping.create({
  productVariantId: 53,
  weight: 0.25,
  width: 10,
  depth: 6,
  length: 2,
  match: 1,
});
```

### Hosts alternativos

```typescript
// Metadata de la instancia (host: credential.bsale.io)
const info = await bsale.instances.getBasic();
console.log(info.code, info.name, info.country); // RUT, razón social, "CL"

// Documentos de terceros + claims SII
const compras = await bsale.thirdPartyDocuments.list({ year: 2025, month: 11 });
const claim = await bsale.thirdPartyDocuments.submitClaim({
  document: { issuer: { code: '96798520-1' }, code: '33', number: 1502570 },
  actionCode: 'ERM',
});
const status = await bsale.thirdPartyDocuments.getClaimStatus({
  trackingNumber: claim.data.trackingNumber,
});

// Couriers e-commerce (host: courier.bsale.io)
const order = await bsale.courierOrders.getById(17170);
await bsale.courierOrders.setLabel(17170, {
  trackingNumber: 'TRK123',
  urlTracking: 'https://courier.cl/track?id=',
  label: 'https://courier.cl/labels/TRK123.pdf',
});
await bsale.courierOrders.submitLog({
  id: 17170,
  description: 'Paquete despachado',
  stateId: 2, // 2=despachado, 3=entregado, 4=por despachar/error
});

// Pasarela de pagos (host: bcash.bsale.io) — solo para Medios de Pago Externos.
await bsale.paymentsGateway.reportSuccess('py-token', {
  id: 'tx-123',
  authorizationCode: '4321',
  data: {
    cardNumber: '****1234',
    quota: 1,
    quotaAmount: 50000,
    payType: 'Credit',
    status: 'completed',
    transactionDate: '2025-11-24T12:00:00Z', // ISO 8601 — anomalía vs Unix ts
  },
});
```

---

## Cache

El cliente cachea respuestas GET en memoria. Las operaciones de escritura invalidan el cache del recurso afectado automáticamente.

```typescript
bsale.clearCache();              // todos los hosts
bsale.clearResourceCache('products'); // un recurso en todos los hosts
```

El TTL por default es 60 segundos (`cacheTtlMs`).

---

## Webhooks

`BsaleWebhookPayload` es una **unión discriminada por `topic`**. TypeScript fuerza los campos correctos según el evento (`priceListId` solo en `price`, `officeId` en `stock`, `sellerId`+`userToken` en `courierOrder`, etc.).

```typescript
import { BsaleClient, BsaleWebhookPayload } from '@misael703/bsale-sdk';

const bsale = new BsaleClient({ accessToken: '...' });

app.post('/webhooks/bsale', (req, res) => {
  const payload = req.body as BsaleWebhookPayload;
  bsale.handleWebhook(payload); // invalida cache del recurso afectado
  res.sendStatus(200);
});
```

Topics soportados:

| Topic | Acciones | Campos extra |
|---|---|---|
| `document` | post / put / delete | `officeId?` |
| `product` | post / put | — |
| `variant` | post / put | — |
| `price` | put | `priceListId` |
| `stock` | put | `officeId` |
| `payment` | post / put | `officeId?` |
| `courierOrder` | post / put | `sellerId`, `userToken` |

> **Activación manual**: Bsale no expone API para registrar webhooks. Hay que solicitarlos a `ayuda@bsale.app` indicando URL destino, RUT (cpnId) y topics deseados.

---

## Utilidades de fecha

Bsale usa Unix timestamps en **segundos** (no milisegundos):

```typescript
import {
  toBsaleTimestamp,
  fromBsaleTimestamp,
  formatBsaleDate,
  todayBsaleTimestamp,
} from '@misael703/bsale-sdk';

const ts = toBsaleTimestamp(new Date());        // Date → segundos
const date = fromBsaleTimestamp(1388545200);    // segundos → Date
const str = formatBsaleDate(1388545200);        // → "01-01-2014"
const today = todayBsaleTimestamp();            // hoy 00:00 en segundos
```

> **Excepciones**: `discounts` usa `'DD/MM/YYYY'` (string), `paymentsGateway` usa ISO 8601. Ver matriz de anomalías en [Resources/bsale-api](file:///Users/misa/vault/brain/Resources/bsale-api).

---

## Anomalías documentadas

El SDK respeta literalmente las quirks de la API:

- Campos con typo histórico que **no se renombran** al deserializar:
  - `presashopAttributeId` (productos — sin "t").
  - `prestashopClienId` (clientes — sin "t" final).
  - `repeteable` (cupones — debería ser `repeatable`).
  - `deph` (variant shipping response — debería ser `depth`).
- Endpoints en otras versiones: `products.createPack` (`/v2/`), `discounts.*` (mezcla v1+v2).
- Endpoint anómalo: `documentTypes.update()` usa `PUT /document_types.json` sin ID.
- Endpoint plano: `clients.adjustPoints()` usa `/clients/points.json` (no `/clients/{id}/points`).
- Tipos mixtos en responses: `payment.amount`, `payment.recordDate`, `tax.percentage` (vienen como `string` o `number` según endpoint).
- `coupons.disabled` (no `state`).
- `shippingTypes.codeSii` es `int`, mientras `documentTypes.codeSii` es `string`.

---

## Migración v0.1.0 → v0.2.0

Si vienes de la versión anterior, atención a estos breaking changes:

1. **`shippings.update()` eliminado** — la API oficial no expone PUT en despachos. Si necesitabas modificar un despacho, anúlalo (`delete`) y crea uno nuevo.
2. **`returns.annul()` ahora requiere `returnId`** como primer argumento:
   ```typescript
   // antes:
   await bsale.returns.annul({ documentTypeId, referenceDocumentId, ... });
   // ahora:
   await bsale.returns.annul(returnId, { documentTypeId, referenceDocumentId, ... });
   ```
3. **`BsaleShippingPayload` renombrado a `BsaleCreateShippingPayload`**.
4. **`BsaleConfig.baseUrl` queda deprecated** — preferir `hosts.api`. Sigue funcionando para back-compat.
5. **Tipos enriquecidos**: muchos campos antes opcionales ahora tienen dominios estrictos (`0 | 1`, `0 | 1 | 99`). Puede requerir ajustes si haces narrowing manual.
6. **Soporte multi-país eliminado** — solo Chile. Si pasabas `baseUrl` apuntando a Perú/México, ya no funciona.

---

## Crear un nuevo recurso

1. Tipo en `src/types/{resource}.types.ts` y export desde `src/types/index.ts`.
2. Resource en `src/resources/{resource}.resource.ts` extendiendo `BaseResource<T>`.
3. Export desde `src/resources/index.ts`.
4. Registrar en `BsaleClient` (constructor + propiedad pública).

```typescript
import { BaseResource } from './base.resource';
import type { BsaleFoo } from '../types';

export class FooResource extends BaseResource<BsaleFoo> {
  protected readonly path = 'foo';

  async customMethod(id: number) {
    return this.http.get(`/foo/${id}/bar.json`);
  }
}
```

Para recursos en otros hosts (no `api.bsale.io`) o con auth en path, NO extender `BaseResource` — usar `HttpClient` directamente y pasar el cliente apropiado (`bspHttp`, `credentialHttp`, `courierHttp`, `bcashHttp`).

---

## Desarrollo

```bash
pnpm install      # Instalar dependencias
pnpm dev          # Build en watch mode (tsup)
pnpm build        # Producción: CJS + ESM + .d.ts
pnpm test         # vitest run
pnpm test:watch   # vitest en watch
pnpm format       # Prettier
```

---

## Licencia

MIT
