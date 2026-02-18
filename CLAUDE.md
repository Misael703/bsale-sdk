# CLAUDE.md — @misapuntescl/bsale-sdk

## Project Overview

SDK en TypeScript para la API REST de Bsale (https://api.bsale.io/v1). Paquete npm publicado en GitHub Packages bajo el scope `@misapuntescl`.

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.x (strict mode)
- **Build**: tsup (genera CJS + ESM + .d.ts)
- **Package Manager**: pnpm
- **Registry**: GitHub Packages (`npm.pkg.github.com`)
- **Testing**: vitest
- **Linting**: eslint + prettier

## Project Structure

```
bsale-sdk/
├── src/
│   ├── client/
│   │   ├── http-client.ts          # Fetch wrapper: retry, cache, rate limit, timeout
│   │   └── bsale-client.ts         # Fachada pública (entry point principal)
│   ├── resources/
│   │   ├── base.resource.ts              # Clase abstracta: list, listAll, getById, count
│   │   ├── products.resource.ts
│   │   ├── variants.resource.ts
│   │   ├── documents.resource.ts
│   │   ├── clients.resource.ts
│   │   ├── price-lists.resource.ts
│   │   ├── stocks.resource.ts
│   │   ├── document-types.resource.ts
│   │   ├── offices.resource.ts
│   │   ├── shippings.resource.ts
│   │   ├── payment-types.resource.ts
│   │   ├── stock-receptions.resource.ts
│   │   ├── stock-consumptions.resource.ts
│   │   ├── returns.resource.ts
│   │   ├── third-party-documents.resource.ts
│   │   ├── product-types.resource.ts
│   │   ├── users.resource.ts
│   │   ├── shipping-types.resource.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── config.types.ts               # BsaleConfig
│   │   ├── common.types.ts               # BsaleListResponse, BsaleQueryParams
│   │   ├── product.types.ts
│   │   ├── variant.types.ts
│   │   ├── document.types.ts
│   │   ├── client.types.ts
│   │   ├── price-list.types.ts
│   │   ├── stock.types.ts
│   │   ├── document-type.types.ts
│   │   ├── office.types.ts
│   │   ├── shipping.types.ts
│   │   ├── payment-type.types.ts
│   │   ├── stock-reception.types.ts
│   │   ├── stock-consumption.types.ts
│   │   ├── return.types.ts
│   │   ├── third-party-document.types.ts
│   │   ├── product-type.types.ts
│   │   ├── user.types.ts
│   │   ├── shipping-type.types.ts
│   │   ├── webhook.types.ts
│   │   └── index.ts
│   ├── utils/
│   │   └── date.utils.ts           # toBsaleTimestamp, fromBsaleTimestamp, formatBsaleDate
│   ├── errors/
│   │   └── bsale.error.ts          # BsaleApiError con helpers (isRateLimit, isNotFound, etc.)
│   └── index.ts                     # Re-exports públicos
├── tests/
│   ├── http-client.test.ts
│   ├── base-resource.test.ts
│   └── date-utils.test.ts
├── tsup.config.ts
├── tsconfig.json
├── vitest.config.ts
├── package.json
├── .npmrc
├── .gitignore
├── .prettierrc
├── .eslintrc.json
└── README.md
```

## Bsale API Reference

- **Base URL**: `https://api.bsale.io/v1`
- **Auth**: Header `access_token: <token>` (NO Bearer, NO Authorization)
- **Formato**: JSON. Endpoints terminan en `.json`
- **Paginación**: `limit` (max 50), `offset`. Response incluye `count`, `items[]`, `next`
- **Fechas**: Unix timestamps en segundos (no milisegundos)
- **Docs**: https://docs.bsale.dev/CL/first-steps/

### Convenciones de la API

- Recursos en plural: `/products.json`, `/variants.json`, `/documents.json`
- Detalle: `/products/{id}.json`
- Sub-recursos: `/products/{id}/variants.json`
- Expand: `?expand=details,payments` para incluir relaciones
- Fields: `?fields=id,name` para limitar campos
- Filtros: query params directos (`?state=0`, `?emissiondaterange=[from,to]`)
- Count: `/products/count.json`
- Rate limit: responde 429 con header `Retry-After`

### Recursos principales

| Recurso | Path | Métodos |
|---------|------|---------|
| Productos | `/products` | GET, POST, PUT |
| Variantes | `/variants` | GET, POST, PUT |
| Documentos | `/documents` | GET, POST |
| Clientes | `/clients` | GET, POST, PUT |
| Listas de precio | `/price_lists` | GET, PUT (solo detalles) |
| Stock | `/stocks` | GET |
| Tipos de documento | `/document_types` | GET |
| Sucursales | `/offices` | GET |
| Despachos | `/shippings` | GET, POST, PUT |
| Formas de pago | `/payment_types` | GET |
| Recepciones de stock | `/stocks/receptions` | GET, POST |
| Consumos de stock | `/stocks/consumptions` | GET, POST |
| Devoluciones | `/returns` | GET, POST |
| Documentos de terceros | `/third_party_documents` | GET |
| Tipos de producto | `/product_types` | GET, POST, PUT, DELETE |
| Usuarios | `/users` | GET |
| Tipos de despacho | `/shipping_types` | GET |

### Webhooks de Bsale

Bsale envía POST a una URL configurada con este payload:

```json
{
  "cpnId": 2,
  "resource": "/v2/variants/7079.json",
  "resourceId": "7079",
  "topic": "product|variant|document|price|stock",
  "action": "post|put|delete",
  "send": 1503500856,
  "officeId": "1"  // solo en algunos topics
}
```

Topics: document, product, variant, price, stock.

## Architecture Decisions

1. **Clase `HttpClient`**: Maneja fetch, retry con backoff exponencial, cache en memoria (Map con TTL), rate limit (429 → espera Retry-After), timeout con AbortController. NO usa axios ni dependencias externas.

2. **Clase abstracta `BaseResource<T>`**: Provee `list()`, `listAll()` (paginación automática), `getById()`, `count()`. Cada resource concreto hereda y agrega métodos específicos.

3. **`BsaleClient`**: Fachada que instancia todos los resources. Expone `clearCache()` y `handleWebhook()` para invalidación de cache.

4. **Zero dependencies**: Solo usa `fetch` nativo de Node 20+. Las únicas dependencias son de desarrollo (tsup, typescript, vitest).

5. **Cache**: In-memory Map con TTL configurable. Se invalida automáticamente en operaciones de escritura (POST/PUT/DELETE). El método `handleWebhook()` invalida el cache del recurso afectado.

## Key Patterns

### Agregar un nuevo resource

1. Crear tipo en `src/types/{resource}.types.ts`
2. Exportar desde `src/types/index.ts`
3. Crear `src/resources/{resource}.resource.ts` extendiendo `BaseResource<T>`
4. Exportar desde `src/resources/index.ts`
5. Agregar propiedad en `BsaleClient`
6. Instanciar en constructor de `BsaleClient`

### Patrón de un resource

```typescript
import { BaseResource } from './base.resource';
import { BsaleFoo } from '../types';

export class FooResource extends BaseResource<BsaleFoo> {
  protected readonly path = 'foo'; // → /foo.json, /foo/{id}.json

  // Métodos custom si son necesarios
  async customMethod(id: number) {
    return this.http.get(`/foo/${id}/bar.json`);
  }
}
```

## Commands

```bash
pnpm install          # Instalar dependencias
pnpm dev              # Build en watch mode
pnpm build            # Build de producción (CJS + ESM + types)
pnpm test             # Correr tests
pnpm test:watch       # Tests en watch mode
pnpm lint             # Linting
pnpm format           # Formatear código
pnpm publish          # Publicar a GitHub Packages
```

## Code Style

- Usar `readonly` en propiedades que no cambian
- Preferir `const` sobre `let`
- Métodos async siempre con tipo de retorno explícito
- Nombres de archivos en kebab-case: `http-client.ts`, `base.resource.ts`
- Tipos/interfaces con prefijo `Bsale`: `BsaleProduct`, `BsaleConfig`
- Resources con sufijo `Resource`: `ProductsResource`
- NO usar `any` excepto en `BsaleQueryParams` para filtros dinámicos
- Comentarios JSDoc en métodos públicos
- Errores siempre como `BsaleApiError` (no strings ni Error genéricos)

## Important Notes

- La API de Bsale usa `access_token` como header (NO `Authorization: Bearer`)
- Las fechas son Unix timestamps en SEGUNDOS, no milisegundos
- `state: 0` = activo, `state: 1` = inactivo (contraintuitivo)
- El límite máximo de paginación es 50 items
- No existe POST para listas de precio, solo PUT en detalles
- Bsale a veces retorna 200 con body vacío — hay que manejarlo
- Los webhooks usan `/v2/` en el campo `resource`, pero la API principal es `/v1/`