# @misael703/bsale-sdk

SDK en TypeScript para la API REST de [Bsale](https://www.bsale.cl) — versión Chile.

- **35 recursos** de la documentación oficial (ver [Alcance](#alcance)).
- **Zero dependencies** en runtime — solo `fetch` nativo de Node 20+.
- **5 hosts** y **3 versiones** (v1/v2/v3) manejados internamente.
- **Cache LRU + request coalescing** automáticos; TTL por recurso configurable.
- **`AbortSignal`**, async iterators y middleware Koa-style.
- Retry con backoff exponencial, parser robusto de `Retry-After` (incluye HTTP-date).
- **Limitador de velocidad** (token bucket de 8 req/s) con carriles `high`/`low`, compartible entre clientes.
- Paginación que termina por `count`, no por página corta.
- `expand` tipado: `variants.iterate({ expand: 'product' })` entrega el producto completo.
- `BsaleApiError` enriquecido — parsea `code`, `details` y `message` del body.
- Webhooks con tipos discriminados por `topic`.

Cambios por versión y notas de migración: [CHANGELOG.md](./CHANGELOG.md).

## Alcance

Solo Chile (`api.bsale.io`), y dentro de Bsale, el **núcleo del tenant**: productos, inventario, documentos tributarios, clientes, despachos, pagos y catálogos de configuración.

Los recursos de tienda en línea (`carts`, `checkouts`, `webDescriptions`, `collections`, `variantShipping`, `coupons`, `discounts`), la integración con couriers (`courierOrders`) y la pasarela de pagos (`paymentsGateway`) siguen disponibles, pero **se eliminarán en la 1.0.0**. No construyas código nuevo sobre ellos.

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
import { BsaleClient } from '@misael703/bsale-sdk';

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
  // Aplica también a POST/PUT/DELETE: ver "Emitir sin duplicados".
  maxRetries: 3,

  // Opcional — TTL del cache en memoria (ms). Default 60000.
  cacheTtlMs: 60000,

  // Opcional — máximo de entradas en el cache LRU. Default 1000.
  cacheMaxEntries: 1000,

  // Opcional — TTL por recurso (ms) que sobrescribe `cacheTtlMs`.
  cacheTtlByResource: {
    stocks: 5_000,           // alta volatilidad → TTL corto
    document_types: 3_600_000, // catálogo casi-estático → TTL largo
  },

  // Opcional — middlewares estilo Koa (ver sección Middleware).
  middlewares: [],

  // Opcional — limitador de velocidad (ver sección Límite de velocidad).
  // Default: token bucket de 8 req/s. `false` lo desactiva.
  rateLimit: { requestsPerSecond: 8, burst: 8 },

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
| `courier.bsale.io` | Integración con couriers (e-commerce). Se elimina en la 1.0.0 |
| `bcash.bsale.io` | Pasarela de pagos (lado MPE). Se elimina en la 1.0.0 |

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

> Se eliminan en la 1.0.0 (ver [Alcance](#alcance)).

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
| `courierOrders` | `courier.bsale.io` | Integración con couriers. Se elimina en la 1.0.0 |
| `paymentsGateway` | `bcash.bsale.io` | Pasarela (lado MPE). Se elimina en la 1.0.0 |

### Métodos heredados

Cada recurso que extiende `BaseResource<T>` recibe gratis:

- `list(params?, requestOptions?)` — listado paginado.
- `listAll(params?, options?)` — itera todas las páginas (max 50/página) hasta cubrir el `count` del listado. Acepta `{ maxItems, pageSize, signal, skipCache, priority }`.
- `iterate(params?, options?)` — igual que `listAll`, pero como async iterator.
- `getById(id, params?, requestOptions?)` — detalle. `id` acepta `number` o `string` (varias referencias de la API traen el id como string).
- `count(params?)` — `{ count: number }`.

En los recursos que declaran expansiones (hoy `variants`), `list`, `listAll`, `iterate` y `getById` tipan el resultado según el literal de `expand` (ver [Expand tipado](#expand-tipado)).

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

### Expand tipado

Sin `expand`, las relaciones llegan como referencia `{ id, href }`. Con `expand`, la API embebe el objeto completo, y el SDK lo tipa a partir del literal que pasas:

```typescript
for await (const variant of bsale.variants.iterate({ expand: 'product' })) {
  variant.product.name;          // BsaleProduct completo (string | null)
  variant.product.allowDecimal;  // sin casteos
}

const v = await bsale.variants.getById(456);
v.product?.id;                   // string: sin expand, Bsale entrega el id como string
```

El tipo resultante es `BsaleVariantWithProduct` (`Omit<BsaleVariant, 'product'> & { product: BsaleProduct }`). Un `expand` armado en runtime (`string` no literal) o una relación sin forma declarada devuelve el tipo base. Para declarar expansiones en otro recurso: `BaseResource<T, X>`, donde `X` mapea relación → forma embebida.

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
await bsale.priceLists.updateDetail(1, 100, { variantValue: 5000 });
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

> Se eliminan en la 1.0.0 (ver [Alcance](#alcance)).

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

// Couriers e-commerce (host: courier.bsale.io). Se elimina en la 1.0.0.
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

// Pasarela de pagos (host: bcash.bsale.io), solo para Medios de Pago Externos. Se elimina en la 1.0.0.
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

El cliente cachea respuestas GET en memoria con **LRU** (default 1000 entradas, configurable con `cacheMaxEntries`). Las operaciones de escritura invalidan el cache del recurso afectado y de sus sub-recursos automáticamente.

```typescript
bsale.clearCache();                    // todos los hosts
bsale.clearResourceCache('products');  // un recurso en todos los hosts
```

El TTL por default es 60 segundos (`cacheTtlMs`). Se puede afinar por recurso con `cacheTtlByResource` (ver sección Configuración).

### Request coalescing

Múltiples GETs idénticos disparados en paralelo se colapsan en una sola fetch real. Cada caller recibe su propia copia (clonada) del payload, así mutaciones nunca contaminan a otros.

```typescript
// Estos 3 awaits comparten una sola fetch al server.
const [a, b, c] = await Promise.all([
  bsale.products.list({ state: 0 }),
  bsale.products.list({ state: 0 }),
  bsale.products.list({ state: 0 }),
]);
```

### Bypass del cache

Para forzar lectura fresh (ej. tras una operación externa) sin invalidar la entrada cacheada:

```typescript
const fresh = await bsale.products.list({ state: 0 }, { skipCache: true });
```

`skipCache: true` también desactiva el coalescing — útil si necesitas N requests independientes idénticas.

### Webhooks → invalidación selectiva

```typescript
app.post('/webhooks/bsale', (req, res) => {
  bsale.handleWebhook(req.body); // invalida cache del recurso afectado
  res.sendStatus(200);
});
```

---

## Cancelación con `AbortSignal`

Cualquier request acepta un `signal` para cancelarse. Si se aborta, el SDK no reintenta.

```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 5_000);

try {
  const docs = await bsale.documents.listAll(
    { emissiondaterange: '[1700000000,1702592000]' },
    { signal: controller.signal },
  );
} catch (err) {
  if ((err as Error).name === 'AbortError') {
    console.log('Cancelado por timeout del usuario');
  }
}
```

`listAll()` chequea la signal entre páginas; `iterate()` también respeta cancelación. Una request que espera turno en el limitador de velocidad también se cancela con su `signal`.

> Comportamiento con coalescing: si dos callers comparten una fetch, abortar el caller que la originó cancela la fetch real y los demás reciben el error. Un caller que se sumó a una fetch en curso puede abortar su propio await sin afectar al resto — la fetch sigue para los otros.

---

## Límite de velocidad

Bsale documenta un límite de **8 requests por segundo** por token (changelog 10/2025). El SDK lo respeta con un **token bucket** activo por defecto: hasta 8 requests salen de inmediato y luego una cada 125 ms. Las requests que no tienen token esperan en cola, sin error; los hits de cache no consumen tokens y cada reintento sí.

La cola tiene dos carriles. `high` (default) es para tráfico interactivo y emisión de documentos; `low` es para syncs en segundo plano y siempre cede el paso a `high`:

```typescript
// Sync nocturno: cede el paso a la emisión y a las lecturas de la UI.
for await (const variant of bsale.variants.iterate(
  { expand: 'product' },
  { priority: 'low', skipCache: true, signal },
)) {
  // ...
}

// Cualquier request individual acepta la prioridad en sus requestOptions.
await bsale.products.getVariants(productId, { limit: 50 }, { priority: 'low' });
```

Cada `BsaleClient` tiene su propio bucket, compartido por sus 5 hosts. Si un proceso usa **varios clientes con el mismo token** (por ejemplo uno de emisión con `maxRetries: 0` y otro de lectura), comparte una instancia para que el presupuesto sea uno solo:

```typescript
import { BsaleClient, BsaleRateLimiter } from '@misael703/bsale-sdk';

const limiter = new BsaleRateLimiter({ requestsPerSecond: 8 });
const reader = new BsaleClient({ accessToken, rateLimit: limiter });
const emitter = new BsaleClient({ accessToken, maxRetries: 0, timeout: 45_000, rateLimit: limiter });
```

Lo que se comparte es solo el presupuesto de requests: **cada cliente mantiene su propia caché**. Una escritura del `emitter` no invalida lo que el `reader` tiene cacheado, así que lee con `skipCache: true` lo que acabas de modificar.

`rateLimit: false` desactiva el limitador (queda solo la reacción al 429 con `Retry-After`).

---

## Iterar grandes datasets — `iterate()`

Async iterator memoria-eficiente: emite items uno a uno y pagina bajo demanda. Si el consumer hace `break` o filtra suficientes items, no se pide la próxima página.

```typescript
for await (const doc of bsale.documents.iterate({
  emissiondaterange: '[1700000000,1702592000]',
})) {
  if (doc.totalAmount > 1_000_000) {
    console.log('Documento grande:', doc.id);
    break; // no carga páginas siguientes
  }
}
```

Soporta `maxItems`, `pageSize`, `signal`, `skipCache` y `priority`.

`iterate()` y `listAll()` terminan cuando el offset alcanza el `count` del listado (releído en cada página) o ante una página vacía. Una página con menos items que `limit` **no** corta el recorrido: el offset avanza por los items recibidos, así que en el peor caso se repite un item, pero nunca se salta uno. Si un endpoint no trae `count`, se usa el criterio anterior (`next` ausente o página corta).

---

## Emitir sin duplicados

Con `maxRetries` mayor que 0 (default 3), el SDK también reintenta POST, PUT y DELETE ante un 5xx, un error de red o un timeout. Si el primer intento sí llegó a Bsale, el reintento puede crear un segundo registro.

Para documentos, la protección la da la API: el campo **`salesId`** (tu id externo, hasta 255 caracteres). Si ya existe un documento del mismo tipo con ese `salesId`, Bsale devuelve el existente con HTTP 200 en vez de emitir otro, así que un reintento, del SDK o tuyo, no duplica la boleta:

```typescript
const doc = await bsale.documents.create({
  documentTypeId: 1,
  officeId: 1,
  emissionDate: 1705276800,
  expirationDate: 1705276800,
  salesId: `pedido-${orderId}`, // estable por operación, no aleatorio por intento
  details: [{ variantId: 123, netUnitValue: 1000, quantity: 1, taxId: '[1]' }],
});
```

`shippings.create` no tiene equivalente: la API no deduplica guías de despacho. Emítelas con un cliente `maxRetries: 0` y, ante un timeout o un 5xx, consulta si la guía se creó antes de volver a intentarlo.

---

## Middleware

Middlewares estilo Koa wrappean cada fetch. Útil para tracing, métricas, refresh de tokens, o lógica custom de retry:

```typescript
import { BsaleClient, BsaleMiddleware } from '@misael703/bsale-sdk';

const tracing: BsaleMiddleware = async (ctx, next) => {
  const span = startSpan(`bsale ${ctx.method} ${ctx.url}`);
  try {
    const res = await next();
    span.setStatus(res.status);
    return res;
  } finally {
    span.end();
  }
};

const stamp: BsaleMiddleware = async (ctx, next) => {
  ctx.headers['X-Trace-Id'] = generateTraceId();
  return next();
};

const bsale = new BsaleClient({
  accessToken: process.env.BSALE_TOKEN!,
  middlewares: [tracing, stamp],
});

// O en runtime:
bsale.use(async (ctx, next) => {
  console.log('attempt', ctx.attempt, ctx.method, ctx.url);
  return next();
});
```

`BsaleClient.use()` aplica el middleware a los 5 hosts internos. El `ctx` expone `url`, `method`, `headers` (mutable), `body`, `attempt` (número de intento, 0 = primero), `signal`. Un middleware puede llamar `next()` cero veces (cortocircuito con response sintética) o varias veces (retry custom).

---

## Errores — `BsaleApiError`

Todas las respuestas no-OK lanzan `BsaleApiError` con el body parseado:

```typescript
import { BsaleApiError } from '@misael703/bsale-sdk';

try {
  await bsale.documents.create(payload);
} catch (err) {
  if (err instanceof BsaleApiError) {
    console.log(err.status);       // 400, 404, 429, 500...
    console.log(err.code);          // string parseado de body.code/error_code
    console.log(err.details);       // body.details / body.errors / body.fields
    console.log(err.message);       // mensaje base + body.message si lo hay
    console.log(err.path);          // URL que falló
    console.log(err.responseBody);  // raw body, por si necesitas más
    console.log(err.headers);       // headers de la respuesta, nombres en minúscula
    console.log(err.retryAfterMs);  // Retry-After en ms, sin recortar (o undefined)

    if (err.isRateLimit) { /* 429 */ }
    if (err.isNotFound) { /* 404 */ }
    if (err.isClientError) { /* 4xx ≠ 429 */ }
    if (err.isServerError) { /* 5xx */ }
  }
}
```

Cuando se agotan los reintentos por 429, el SDK lanza `BsaleApiError(429)` con el último body recibido — no un `Error` genérico.

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

> **Excepciones**: `discounts` usa `'DD/MM/YYYY'` (string) y `paymentsGateway` usa ISO 8601.

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
- `shippingTypes.codeSii`: la doc lo declara `string` en la tabla de campos e `int` en el JSON de ejemplo. El SDK lo tipa `string`, igual que `documentTypes.codeSii`.
- **Paginación profunda con `expand` truncada a 25 items** — limitación silenciosa de la API. Ver sección dedicada abajo.

---

## Paginación profunda con `expand` (limitación de la API)

La API de Bsale **no pagina los sub-recursos expandidos junto con el padre**. Cuando usas `?expand=<sub>` en un listado, cada item padre embebe el sub-recurso como un objeto con su propia paginación interna (`{ count, limit, offset, items[] }`), y aplica un **límite implícito de 25 items** sobre ese sub-recurso — independientemente del `limit` que pases en el request padre (que sólo afecta al listado de primer nivel).

Si el sub-recurso supera 25 items, **vienen truncados silenciosamente**. No hay error, no hay warning, y no existe sintaxis para sobreescribir el límite (no soporta `expand=details(limit:50)` ni equivalente).

### Recomendación

- Usa `expand` sólo cuando **garantices** que el sub-recurso cabe en el límite implícito (relaciones 1:1 como `client` o `office` en un documento).
- Para las líneas de documentos, despachos y devoluciones usa `getWithDetails` (ver abajo): detecta el truncado y pagina el resto por ti.
- Para otros sub-recursos potencialmente grandes (`references`, `document_taxes`, `sellers`, `attributes`), haz un fetch explícito al endpoint dedicado (`bsale.documents.getReferences(id)`, etc.) y pagínalo normalmente (máx. 50 por página).

---

## Documento + detalles en un paso — `getWithDetails()`

`documents.getWithDetails(id)` resuelve el patrón "consultar un documento y luego sus líneas" minimizando requests. Internamente:

1. Hace **un solo request** con `expand=details` — trae el documento y los primeros 25 detalles embebidos en la misma respuesta.
2. Si `count <= 25`, retorna directo. **No dispara un segundo request.**
3. Si `count > 25`, pagina el resto contra `/documents/{id}/details.json` con `limit=50`, partiendo en `offset=25`.

```typescript
const { document, details } = await bsale.documents.getWithDetails(824738);
// document.id, document.totalAmount, …
// details: BsaleDocumentDetailItem[] completo, sin truncación
```

### Costo en requests

| Líneas del documento | Sin helper (getById + paginar) | Con `getWithDetails` |
|---|---|---|
| ≤ 25 | 2 | **1** |
| 26–75 | 2 | 2 |
| 76–125 | 3 | 3 |
| N | `1 + ⌈N/50⌉` | `1 + ⌈(N-25)/50⌉` |

El ahorro se concentra en docs ≤ 25 líneas (la mayoría del volumen típico). Para docs grandes empata, pero **te trae `user`, `client`, `office`, etc. gratis en la misma llamada** si los pasas en `options.expand`.

### Expand adicional

`details` siempre se incluye. Para sumar otros, pasa `expand` como array:

```typescript
const { document, details } = await bsale.documents.getWithDetails(824738, {
  expand: ['user', 'client'],
  signal: ac.signal,
  skipCache: true,
});
// document.user, document.client vienen poblados sin requests extra
```

`signal` y `skipCache` se propagan a todas las llamadas internas.

`shippings.getWithDetails(id)` y `returns.getWithDetails(id)` siguen el mismo patrón; devuelven `{ shipping, details }` y `{ returnDoc, details }`.

---

## Desarrollo

```bash
pnpm install      # Instalar dependencias
pnpm dev          # Build en watch mode (tsup)
pnpm build        # Producción: CJS + ESM + .d.ts
pnpm test         # vitest run
pnpm test:watch   # vitest en watch
pnpm lint         # ESLint sobre src/
pnpm format       # Prettier
```

Para contribuir (agregar un recurso, convenciones del repo), ver [AGENTS.md](./AGENTS.md).

---

## Licencia

MIT
