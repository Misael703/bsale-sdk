# CLAUDE.md — @misael703/bsale-sdk

## Project Overview

SDK en TypeScript para la API REST de Bsale (Chile). Publicado en [npmjs](https://www.npmjs.com/package/@misael703/bsale-sdk) bajo el scope `@misael703`. C&oacute;digo fuente en GitHub: `Misael703/bsale-sdk`.

> **Scope**: solo Chile (`api.bsale.io`). Per&uacute; y M&eacute;xico fueron descartados en 2026-04-29.
> Dentro de Bsale, el alcance es el **n&uacute;cleo del tenant** (decisi&oacute;n 2026-10-08). Los 7 recursos de tienda en l&iacute;nea (`carts`, `checkouts`, `webDescriptions`, `collections`, `variantShipping`, `coupons`, `discounts`), `courierOrders` y `paymentsGateway` (con los hosts `courier` y `bcash`) se eliminan en la release de limpieza 1.0.0: no les agregues funcionalidad.

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.x (strict mode)
- **Build**: tsup (genera CJS + ESM + .d.ts)
- **Package Manager**: pnpm
- **Registry**: npmjs (`registry.npmjs.org`) — se publica al crear un GitHub Release (`.github/workflows/publish.yml`, `npm publish --provenance`), nunca a mano
- **Testing**: vitest
- **Linting**: eslint + prettier

## Project Structure

```
bsale-sdk/
├── src/
│   ├── client/
│   │   ├── http-client.ts          # Fetch wrapper: retry, cache LRU, coalescing, middleware, timeout
│   │   ├── rate-limiter.ts         # BsaleRateLimiter: token bucket 8 req/s con carriles high/low
│   │   └── bsale-client.ts         # Fachada pública (entry point principal)
│   ├── resources/                  # base.resource.ts + un {recurso}.resource.ts por recurso (35)
│   ├── types/                      # un {recurso}.types.ts por recurso + config, common, middleware, webhook
│   ├── utils/
│   │   ├── date.utils.ts           # toBsaleTimestamp, fromBsaleTimestamp, formatBsaleDate, todayBsaleTimestamp
│   │   ├── abort.utils.ts          # toAbortError
│   │   ├── lru-cache.ts            # LRU de la caché de respuestas
│   │   └── retry-after.utils.ts    # parseRetryAfterMs (delta-seconds o HTTP-date)
│   ├── errors/
│   │   └── bsale.error.ts          # BsaleApiError con helpers (isRateLimit, isNotFound, etc.)
│   └── index.ts                    # Re-exports públicos
├── tests/                          # *.test.ts (vitest) y *.test-d.ts (tests de tipos)
├── examples/playground.ts          # `pnpm playground`
├── .github/workflows/publish.yml   # Publica a npm en cada GitHub Release
├── CHANGELOG.md                    # Historial de versiones y notas de migración
├── eslint.config.js
├── tsup.config.ts
├── tsconfig.json                   # tsconfig.test.json lo extiende para los tests de tipos
└── vitest.config.ts
```

## Bsale API Reference

- **Hosts** (5 distintos):
  - `https://api.bsale.io/v1` — API principal (default)
  - `https://bsp-api.bsale.io/v1` — claims de DTE de terceros
  - `https://credential.bsale.io/v1` — metadata de instancia (auth en path)
  - `https://courier.bsale.io/v1` — integraci&oacute;n con couriers
  - `https://bcash.bsale.io/v1` — pasarela de pagos (lado MPE)
- **Versiones**: `v1` (default), `v2` (packs, descuentos, market_info, checkout), `v3` (algunos sub-recursos de market_info)
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

### Recursos

El SDK expone 35 recursos; el inventario con sus m&eacute;todos est&aacute; en la secci&oacute;n "Recursos disponibles" del `README.md` y la fuente de verdad es `src/client/bsale-client.ts`. Los despachos (`/shippings`) solo tienen GET, POST y DELETE (anular): la API no expone PUT.

### Webhooks de Bsale

Bsale envía POST a una URL configurada con este payload:

```json
{
  "cpnId": 2,
  "resource": "/v2/variants/7079.json",
  "resourceId": "7079",
  "topic": "document|product|variant|price|stock|payment|courierOrder",
  "action": "post|put|delete",
  "send": 1503500856,
  "officeId": "1"  // solo en algunos topics
}
```

El SDK tipa 7 topics como uni&oacute;n discriminada (`src/types/webhook.types.ts`): `document`, `product`, `variant`, `price`, `stock`, `payment` y `courierOrder`.

## Architecture Decisions

1. **Clase `HttpClient`**: Maneja fetch, retry con backoff exponencial, cache LRU en memoria con TTL, rate limit (429 → espera Retry-After), timeout con AbortController. NO usa axios ni dependencias externas.

2. **Clase abstracta `BaseResource<T, X>`**: Provee `list()`, `listAll()`/`iterate()` (paginación automática que termina por `count`, nunca por página corta), `getById()`, `count()`. `X` es el mapa opcional de expansiones (relación → forma embebida) que tipa el resultado según el literal de `expand`. Cada resource concreto hereda y agrega métodos específicos.

3. **`BsaleClient`**: Fachada que instancia todos los resources. Expone `clearCache()` y `handleWebhook()` para invalidación de cache.

4. **Zero dependencies**: Solo usa `fetch` nativo de Node 20+. Las únicas dependencias son de desarrollo (tsup, typescript, vitest).

5. **Rate limit**: `BsaleRateLimiter` (token bucket, 8 req/s documentado por Bsale) activo por defecto, uno por `BsaleClient` y compartido por sus 5 hosts. Carriles `high` (default) y `low` (syncs). Cada fetch real, incluido cada retry, consume un token; los hits de cache no.

6. **Cache**: LRU en memoria con TTL configurable, una por host y por `BsaleClient`. Se invalida automáticamente en operaciones de escritura (POST/PUT/DELETE). El método `handleWebhook()` invalida el cache del recurso afectado.

## Key Patterns

### Agregar un nuevo resource

Solo recursos del n&uacute;cleo del tenant (ver Scope).

1. Crear tipo en `src/types/{resource}.types.ts`
2. Exportar desde `src/types/index.ts`
3. Crear `src/resources/{resource}.resource.ts` extendiendo `BaseResource<T>`
4. Exportar desde `src/resources/index.ts`
5. Agregar propiedad en `BsaleClient`
6. Instanciar en constructor de `BsaleClient`

### Patrón de un resource

```typescript
import { BaseResource } from './base.resource';
import type { BsaleFoo, BsaleFooBar, BsaleListResponse } from '../types';

export class FooResource extends BaseResource<BsaleFoo> {
  protected readonly path = 'foo'; // → /foo.json, /foo/{id}.json

  // Métodos custom si son necesarios
  async getBars(id: number): Promise<BsaleListResponse<BsaleFooBar>> {
    return this.http.get<BsaleListResponse<BsaleFooBar>>(`/foo/${id}/bar.json`);
  }
}
```

Para endpoints en otro host (no `api.bsale.io`), el resource recibe el `HttpClient` de ese host desde el constructor de `BsaleClient` (ver `third-party-documents.resource.ts` con `bspHttp`). Si el token va en el path, no extiendas `BaseResource` y usa `skipAuth` (ver `instances.resource.ts`).

## Commands

```bash
pnpm install          # Instalar dependencias
pnpm dev              # Build en watch mode
pnpm build            # Build de producción (CJS + ESM + types)
pnpm test             # Correr tests
pnpm test:watch       # Tests en watch mode
pnpm lint             # ESLint (solo src/)
pnpm format           # Formatear código
pnpm playground       # Correr examples/playground.ts
```

Publicar: subir `version` en `package.json` y `CHANGELOG.md`, mergear a `main` y crear el GitHub Release (`gh release create vX.Y.Z --generate-notes`); el workflow corre tests, build y `npm publish --provenance`.

## Code Style

- Usar `readonly` en propiedades que no cambian
- Preferir `const` sobre `let`
- Métodos async siempre con tipo de retorno explícito
- Nombres de archivos en kebab-case: `http-client.ts`, `base.resource.ts`
- Tipos/interfaces con prefijo `Bsale`: `BsaleProduct`, `BsaleConfig`
- Resources con sufijo `Resource`: `ProductsResource`
- NO usar `any` (los filtros dinámicos de `BsaleQueryParams` usan `BsaleQueryValue`)
- Comentarios JSDoc en métodos públicos
- Respuestas HTTP no-OK siempre como `BsaleApiError`. Hoy los errores de transporte (red, timeout) y de validaci&oacute;n de argumentos salen como `Error`, `TypeError` o `RangeError`; no agregues lanzamientos gen&eacute;ricos nuevos

## Important Notes

- La API de Bsale usa `access_token` como header (NO `Authorization: Bearer`)
- Las fechas son Unix timestamps en SEGUNDOS, no milisegundos
- `state: 0` = activo, `state: 1` = inactivo (contraintuitivo)
- El límite máximo de paginación es 50 items
- No existe POST para listas de precio, solo PUT en detalles
- Bsale a veces retorna 200 con body vacío — hay que manejarlo
- Solo entra al SDK lo que documenta docs.bsale.dev. Donde la API en vivo contradice la doc (ids de relación como string, `product.name` null, `averageCost` number), se tipa lo que llega y se deja la evidencia en un comentario del campo
- Los tests de tipos (`tests/*.test-d.ts`) corren con `pnpm test` usando `tsconfig.test.json` (el `tsconfig.json` excluye `tests/`)
- Los webhooks usan `/v2/` en el campo `resource`, pero la API principal es `/v1/`

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
