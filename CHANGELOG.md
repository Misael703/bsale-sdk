# Changelog

Todos los cambios del SDK viven en este archivo. Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). El proyecto sigue [SemVer](https://semver.org/lang/es/): mientras esté en `0.x`, un bump minor puede traer breaking changes. Las fechas son las de publicación en npm (UTC).

## [0.8.0] — 2026-09-25

Endurece el SDK para syncs de catálogo grandes: paginación que no se corta antes de tiempo, límite de velocidad compartido y tipos que reflejan lo que la API entrega de verdad.

### Added

- `BsaleRateLimiter` y `BsaleConfig.rateLimit` (opciones, instancia compartida entre clientes o `false`).
- Carriles de prioridad `high` (default) y `low` vía `priority` en `HttpRequestOptions` y `BsalePaginateOptions`. `low` siempre cede el paso a `high`.
- `expand` tipado: `BaseResource<T, X>` acepta un mapa de expansiones; `variants.list/listAll/iterate/getById({ expand: 'product' })` devuelven `BsaleVariantWithProduct`. Tipos `BsaleExpanded`, `BsaleExpandKeys`, `BsaleVariantExpansions`.
- `products.getVariants(productId, params, requestOptions)`: acepta `signal`, `skipCache` y `priority`.
- `BsaleApiError.headers` (nombres en minúscula) y `BsaleApiError.retryAfterMs` (Retry-After del servidor, sin recortar).
- `BsaleVariant.isLot` y `BsaleVariantCosts.totalCost` (los devuelve la API; no figuran en la doc).
- Tests de tipos (`tests/*.test-d.ts`) chequeados por `vitest run` vía `tsconfig.test.json`.

### Changed

- **Breaking (tipos).** Los tipos siguen lo que la API devuelve, verificado en vivo en 2026-09 contra la API v1, aunque docs.bsale.dev diga otra cosa. Cada campo lleva un comentario con la evidencia.

  | Tipo | Campo | Antes | Ahora |
  |---|---|---|---|
  | `BsaleVariant` | `product.id` | `number` | `string` |
  | `BsaleProduct` | `product_type.id` | `number` | `string` |
  | `BsaleProduct` | `name` | `string` | `string \| null` (el texto puede quedar en `description`) |
  | `BsaleStock` | `variant.id` | `number` | `string` |
  | `BsaleStock` | `office.id` | `number` | `string` |
  | `BsalePriceList` | `id` | `number` | `string` |
  | `BsaleVariantCosts` | `averageCost` | `string` | `number` |
  | `BsaleQueryParams` | filtros dinámicos | `any` | `BsaleQueryValue` (`string \| number \| boolean \| null \| undefined`) |

- Los métodos que reciben ids que la API entrega como string aceptan `number | string`: `getById`, `products.getVariants`, `priceLists.getDetails`/`getDetailById`/`updateDetail`, `stocks.getByVariantAndOffice`, `productTypes.getProducts`/`getAttributes`/`getAttributeById`.
- `listAll()` e `iterate()` terminan cuando el offset alcanza el `count` del listado (releído en cada página) o ante una página vacía, no por página corta. Antes, una página con menos items que `limit` que no era la última cortaba el recorrido y lo daba por completo. El offset avanza por los items recibidos: en el peor caso se repite un item, nunca se salta uno. Sin `count` en la respuesta se usa el criterio anterior. `paginateSubresource()` (base de `getWithDetails`) usa el mismo motor.
- Limitador de velocidad activo por defecto: token bucket de 8 req/s (límite documentado por Bsale, changelog 10/2025), ráfaga de 8, compartido por los 5 hosts de un `BsaleClient`. Nunca rechaza: solo demora requests que excederían el límite.

### Migración

- Si comparabas o sumabas como números los ids que pasaron a `string`, conviértelos con `Number(id)`. A los métodos de arriba puedes pasarles el id tal como llega.
- Si dependías del corte por página corta de `listAll`/`iterate`, usa `maxItems`.
- Para volver al comportamiento sin limitador: `rateLimit: false`.

## [0.7.0] — 2026-07-09

### Added

- `BsaleReturnDetail.documentDetailId`: la línea del documento de venta que acredita la devolución. La API lo entrega tanto en el embed de `expand=details` como en `/returns/{id}/details.json`, aunque la doc solo lo muestra como input del POST.

## [0.6.0] — 2026-07-09

### Added

- `shippings.getWithDetails(id, options?)` y `returns.getWithDetails(id, options?)`: igual que `documents.getWithDetails`, traen el registro y todas sus líneas, sin el truncado a 25 del embed de `expand=details`. Devuelven `{ shipping, details }` y `{ returnDoc, details }`.

## [0.5.0] — 2026-05-25

### Added

- `shippings.listByDocument(documentId)`: guías de despacho asociadas a un documento de venta (filtro `documentid`).
- `returns.listByReferenceDocument(documentId)`: devoluciones (NC) que referencian a un documento de venta (filtro `referencedocumentid`).

Ambos envuelven `list()` y devuelven solo la primera página. Si ya pasabas esos filtros a `list()`, sigue funcionando igual.

## [0.4.0] — 2026-05-11

### Added

- `documents.getWithDetails(id, options?)`: documento y todas sus líneas. Usa `expand=details` para la primera página y pagina el resto solo si hay más de 25 líneas. Acepta `expand`, `signal` y `skipCache`.
- `BaseResource.paginateSubresource()` (`protected`): pagina un sub-recurso a partir de una primera página ya obtenida (`embedded`).

## [0.3.0] — 2026-05-03

Sin breaking changes: todo lo nuevo es aditivo y opt-in.

### Added

- `cacheMaxEntries`: la caché pasa a ser LRU (default 1000 entradas).
- `cacheTtlByResource`: TTL por recurso; sin configurarlo se usa `cacheTtlMs`.
- Request coalescing: GETs idénticos en paralelo comparten una sola request.
- `signal`, `skipCache` e `idempotencyKey` en `HttpRequestOptions`.
- `BaseResource.iterate()`: async iterator sobre todas las páginas.
- Middleware estilo Koa vía `middlewares` o `client.use()`.
- `BsaleApiError.code`, `details` e `isClientError`.

### Changed

- El `message` de `BsaleApiError` puede incluir el detalle del backend (por ejemplo `"Bsale API error: 400 — Cliente no encontrado"`). Si comparabas el `message` exacto, revísalo.

### Fixed

- Un 429 con los reintentos agotados lanza `BsaleApiError(429)` en vez de un `Error` genérico.
- Un `Retry-After` malformado ya no provoca reintentos inmediatos. Se acepta el formato HTTP-date y la espera tiene un tope de 60 s.
- Un POST a `/v2/products/pack.json` ya no vacía toda la caché.
- Un POST a un sub-recurso (por ejemplo `/products/123/variants.json`) invalida tanto `products` como `variants`.
- La caché devuelve clones (`structuredClone`): mutar un resultado ya no altera las lecturas siguientes.

## [0.2.0] — 2026-04-30

Cobertura completa de la API documentada: 18 recursos nuevos y los hosts `bsp-api`, `credential`, `courier` y `bcash`.

### Added

- 18 recursos: `payments`, `dynamicAttributes`, `discounts`, `currencies`, `saleConditions`, `instances`, `bookTypes`, `dteCodes`, `taxes`, `stockConsumptionTypes`, `carts`, `checkouts`, `webDescriptions`, `collections`, `variantShipping`, `coupons`, `courierOrders` y `paymentsGateway`.
- `BsaleConfig.hosts` para apuntar cada host a otra URL (sandbox, proxy).

### Changed

- **Breaking.** `returns.annul()` recibe el `returnId` como primer argumento.
- **Breaking.** `BsaleShippingPayload` se renombra a `BsaleCreateShippingPayload`.
- **Breaking (tipos).** Muchos campos usan dominios cerrados (`0 | 1`, `0 | 1 | 99`).
- El SDK cubre solo Chile (`api.bsale.io`): deja de documentar las instancias de Perú y México.

### Deprecated

- `BsaleConfig.baseUrl`: usa `hosts.api`. Sigue funcionando.

### Removed

- **Breaking.** `shippings.update()`: la API no expone PUT en despachos.

### Migración

- Para modificar un despacho, anúlalo con `shippings.delete` y crea uno nuevo.
- `returns.annul`:
  ```typescript
  // antes
  await bsale.returns.annul({ documentTypeId, referenceDocumentId /* , ... */ });
  // ahora
  await bsale.returns.annul(returnId, { documentTypeId, referenceDocumentId /* , ... */ });
  ```
- Revisa el narrowing manual sobre los campos que pasaron a dominios cerrados.

## [0.1.0] — 2026-02-18

Primera versión publicada.

### Added

- `BsaleClient` con 17 recursos: `products`, `variants`, `documents`, `clients`, `priceLists`, `stocks`, `documentTypes`, `offices`, `shippings`, `paymentTypes`, `stockReceptions`, `stockConsumptions`, `returns`, `thirdPartyDocuments`, `productTypes`, `users` y `shippingTypes`.
- `BaseResource` con `list`, `listAll`, `getById` y `count`.
- `HttpClient` sobre `fetch` nativo: reintentos con backoff exponencial, espera ante 429, timeout y caché en memoria con TTL invalidada en escrituras.
- `handleWebhook()` y `clearCache()` en `BsaleClient`.
- `BsaleApiError` y utilidades de fecha (`toBsaleTimestamp`, `fromBsaleTimestamp`, `formatBsaleDate`, `todayBsaleTimestamp`).
