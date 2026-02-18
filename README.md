# @misael703/bsale-sdk

SDK en TypeScript para la API REST de [Bsale](https://www.bsale.com). Compatible con Chile, Per&uacute; y M&eacute;xico. Zero dependencies — solo usa `fetch` nativo de Node 20+.

## Instalaci&oacute;n

```bash
pnpm add @misael703/bsale-sdk
```

## Quick Start

```typescript
import { BsaleClient } from '@misael703/bsale-sdk';

const bsale = new BsaleClient({
  accessToken: 'tu-access-token',
});

// Listar productos
const products = await bsale.products.list({ limit: 10 });
console.log(products.items);

// Obtener un producto por ID
const product = await bsale.products.getById(123);

// Obtener TODOS los productos (paginaci&oacute;n autom&aacute;tica)
const allProducts = await bsale.products.listAll();
```

## Recursos

### Productos

```typescript
// Listar
const products = await bsale.products.list({ state: 0 });

// Obtener variantes de un producto
const variants = await bsale.products.getVariants(123);

// Crear
const newProduct = await bsale.products.create({ name: 'Nuevo Producto' });

// Actualizar
const updated = await bsale.products.update(123, { name: 'Nombre Actualizado' });

// Contar
const { count } = await bsale.products.count();
```

### Variantes

```typescript
const variants = await bsale.variants.list({ state: 0 });
const variant = await bsale.variants.getById(456);
const costs = await bsale.variants.getCosts(456);
```

### Documentos

```typescript
// Listar por rango de fechas (Unix timestamps en segundos)
const docs = await bsale.documents.getByDateRange(1388545200, 1391223600);

// Crear documento
const doc = await bsale.documents.create({
  documentTypeId: 1,
  officeId: 1,
  details: [
    { variantId: 123, quantity: 2, netUnitValue: 1000 },
  ],
  payments: [
    { paymentTypeId: 1, amount: 2380 },
  ],
});

// Obtener detalles de un documento
const details = await bsale.documents.getDetails(789);
```

### Clientes

```typescript
const clients = await bsale.clients.list();
const client = await bsale.clients.create({
  firstName: 'Juan',
  lastName: 'P&eacute;rez',
  email: 'juan@example.com',
});
```

### Listas de Precio

```typescript
const priceLists = await bsale.priceLists.list();
const details = await bsale.priceLists.getDetails(1);

// Actualizar precio de una variante en una lista
await bsale.priceLists.updateDetail(1, 100, {
  variantValue: 5000,
  variantValueWithTaxes: 5950,
});
```

### Stock

```typescript
const stocks = await bsale.stocks.list();
const variantStock = await bsale.stocks.getByVariantAndOffice(456, 1);
```

### Tipos de Documento

```typescript
const types = await bsale.documentTypes.list();
const type = await bsale.documentTypes.getById(1);
```

### Sucursales (Offices)

```typescript
const offices = await bsale.offices.list();
const office = await bsale.offices.getById(1);
```

### Despachos (Shippings)

```typescript
const shippings = await bsale.shippings.list();
await bsale.shippings.create({ shippingDate: 1705276800, address: 'Av. Principal 123', officeId: 1 });
await bsale.shippings.update(1, { address: 'Av. Nueva 456' });
```

### Formas de Pago

```typescript
const paymentTypes = await bsale.paymentTypes.list();
```

### Recepciones de Stock

```typescript
const receptions = await bsale.stockReceptions.list();
await bsale.stockReceptions.create({
  officeId: 1,
  note: 'Ingreso de mercader&iacute;a',
  details: [
    { variantId: 456, quantity: 100, cost: 500 },
  ],
});
```

### Consumos de Stock

```typescript
const consumptions = await bsale.stockConsumptions.list();
await bsale.stockConsumptions.create({
  officeId: 1,
  note: 'Merma de inventario',
  details: [
    { variantId: 456, quantity: 5 },
  ],
});
```

### Devoluciones (Returns)

```typescript
const returns = await bsale.returns.list();
const ret = await bsale.returns.getById(1);
const details = await bsale.returns.getDetails(1);

// Crear devoluci&oacute;n (nota de cr&eacute;dito)
await bsale.returns.create({
  documentTypeId: 6,
  officeId: 1,
  referenceDocumentId: 100,
  details: [{ documentDetailId: 200, quantity: 1 }],
});

// Anular devoluci&oacute;n (nota de d&eacute;bito)
await bsale.returns.annul({
  documentTypeId: 7,
  referenceDocumentId: 300,
});
```

### Documentos de Terceros

```typescript
const thirdPartyDocs = await bsale.thirdPartyDocuments.list();
const doc = await bsale.thirdPartyDocuments.getById(1);
const { count } = await bsale.thirdPartyDocuments.count();
```

### Tipos de Producto

```typescript
const productTypes = await bsale.productTypes.list();
const pt = await bsale.productTypes.getById(1);
const products = await bsale.productTypes.getProducts(1);
const attrs = await bsale.productTypes.getAttributes(1);

// Crear
await bsale.productTypes.create({ name: 'Electr&oacute;nica', attributes: [{ name: 'Marca' }] });

// Actualizar
await bsale.productTypes.update(1, { name: 'Electr&oacute;nica Actualizada' });

// Eliminar
await bsale.productTypes.delete(1);
```

### Usuarios

```typescript
const users = await bsale.users.list();
const user = await bsale.users.getById(1);
const summary = await bsale.users.getSalesSummary({ userid: 1 });
const sales = await bsale.users.getSales(1);
const returns = await bsale.users.getReturns(1);
```

### Tipos de Despacho

```typescript
const shippingTypes = await bsale.shippingTypes.list();
const st = await bsale.shippingTypes.getById(1);
```

## Configuraci&oacute;n

```typescript
import { BsaleClient } from '@misael703/bsale-sdk';

const bsale = new BsaleClient({
  // Requerido: token de acceso a la API de Bsale
  accessToken: 'tu-access-token',

  // Opcional: URL base (default: https://api.bsale.io/v1)
  baseUrl: 'https://api.bsale.io/v1',

  // Opcional: timeout en ms (default: 15000)
  timeout: 15000,

  // Opcional: reintentos m&aacute;ximos para errores 5xx y de red (default: 3)
  maxRetries: 3,

  // Opcional: TTL del cache en ms (default: 60000)
  cacheTtlMs: 60000,

  // Opcional: callback para logging
  logger: (message, data) => console.log(`[bsale] ${message}`, data),
});
```

### Multi-pa&iacute;s

El SDK es compatible con todas las instancias regionales de Bsale. Cambia la `baseUrl` seg&uacute;n el pa&iacute;s:

| Pa&iacute;s | Base URL |
|-------|----------|
| Chile (default) | `https://api.bsale.io/v1` |
| Per&uacute; | `https://api.bsale.com.pe/v1` |
| M&eacute;xico | `https://api.bsale.com.mx/v1` |

```typescript
// Ejemplo: Per&uacute;
const bsalePeru = new BsaleClient({
  accessToken: 'tu-token-peru',
  baseUrl: 'https://api.bsale.com.pe/v1',
});

// Ejemplo: M&eacute;xico
const bsaleMexico = new BsaleClient({
  accessToken: 'tu-token-mexico',
  baseUrl: 'https://api.bsale.com.mx/v1',
});
```

## Cache

El SDK incluye un cache en memoria para requests GET:

- El cache tiene un TTL configurable (default: 60 segundos)
- Las operaciones de escritura (POST/PUT/DELETE) invalidan autom&aacute;ticamente el cache del recurso afectado
- Se puede limpiar manualmente:

```typescript
// Limpiar todo el cache
bsale.clearCache();

// Limpiar cache de un recurso espec&iacute;fico
bsale.clearResourceCache('products');
```

## Webhooks

El m&eacute;todo `handleWebhook` invalida autom&aacute;ticamente el cache cuando Bsale notifica cambios:

```typescript
import { BsaleClient, BsaleWebhookPayload } from '@misael703/bsale-sdk';

const bsale = new BsaleClient({ accessToken: '...' });

// En tu endpoint de webhook
app.post('/webhooks/bsale', (req, res) => {
  const payload: BsaleWebhookPayload = req.body;
  bsale.handleWebhook(payload);
  res.sendStatus(200);
});
```

Topics soportados: `product`, `variant`, `document`, `price`, `stock`.

## Agregar un nuevo Resource

1. Crear tipo en `src/types/{resource}.types.ts`
2. Exportar desde `src/types/index.ts`
3. Crear `src/resources/{resource}.resource.ts` extendiendo `BaseResource<T>`
4. Exportar desde `src/resources/index.ts`
5. Agregar propiedad en `BsaleClient`
6. Instanciar en el constructor de `BsaleClient`

Patr&oacute;n:

```typescript
import { BaseResource } from './base.resource';
import { BsaleFoo } from '../types';

export class FooResource extends BaseResource<BsaleFoo> {
  protected readonly path = 'foo';

  async customMethod(id: number) {
    return this.http.get(`/foo/${id}/bar.json`);
  }
}
```

## Utilidades de Fecha

Bsale usa Unix timestamps en **segundos** (no milisegundos):

```typescript
import { toBsaleTimestamp, fromBsaleTimestamp, formatBsaleDate, todayBsaleTimestamp } from '@misael703/bsale-sdk';

// Date &rarr; Unix seconds
const ts = toBsaleTimestamp(new Date());

// Unix seconds &rarr; Date
const date = fromBsaleTimestamp(1388545200);

// Unix seconds &rarr; string formateado
const str = formatBsaleDate(1388545200); // "01-01-2014"

// Hoy a las 00:00 como Unix seconds
const today = todayBsaleTimestamp();
```

## Desarrollo

```bash
pnpm install        # Instalar dependencias
pnpm dev            # Build en watch mode
pnpm build          # Build de producci&oacute;n (CJS + ESM + types)
pnpm test           # Correr tests
pnpm test:watch     # Tests en watch mode
pnpm lint           # Linting
pnpm format         # Formatear c&oacute;digo
```

## Licencia

MIT
