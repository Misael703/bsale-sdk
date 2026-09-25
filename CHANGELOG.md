# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). El proyecto sigue [SemVer](https://semver.org/lang/es/): mientras esté en `0.x`, un bump minor puede traer breaking changes. Las versiones anteriores a 0.8.0 están descritas en las secciones "Migración" del README.

## [0.8.0] — sin publicar

Endurece el SDK para syncs de catálogo grandes: paginación que no se corta antes de tiempo, límite de velocidad compartido y tipos que reflejan lo que la API entrega de verdad.

### Breaking (tipos)

Los tipos ahora siguen lo que la API devuelve, verificado en vivo en 2026-09 contra la API v1, aunque docs.bsale.dev diga otra cosa. Cada campo lleva un comentario con la evidencia.

- `BsaleVariant.product.id`: `number` → `string`.
- `BsaleProduct.product_type.id`: `number` → `string`.
- `BsaleProduct.name`: `string` → `string | null` (el texto puede quedar en `description`).
- `BsaleStock.variant.id`: `number` → `string`.
- `BsaleStock.office.id`: `number` → `string`.
- `BsalePriceList.id`: `number` → `string`.
- `BsaleVariantCosts.averageCost`: `string` → `number`.
- `BsaleQueryParams`: los filtros dinámicos pasan de `any` a `BsaleQueryValue` (`string | number | boolean | null | undefined`).

### Changed

- `listAll()` e `iterate()` terminan cuando el offset alcanza el `count` del listado (releído en cada página) o ante una página vacía, no por página corta. Antes, una página con menos items que `limit` que no era la última cortaba el recorrido y lo daba por completo. El offset avanza por los items recibidos: en el peor caso se repite un item, nunca se salta uno. Sin `count` en la respuesta se usa el criterio anterior. `paginateSubresource()` (base de `getWithDetails`) usa el mismo motor.
- Limitador de velocidad activo por defecto: token bucket de 8 req/s (límite documentado por Bsale, changelog 10/2025), ráfaga de 8, compartido por los 5 hosts de un `BsaleClient`. Nunca rechaza: solo demora requests que excederían el límite. `rateLimit: false` lo desactiva.
- Los métodos que reciben ids que la API entrega como string aceptan `number | string`: `getById`, `products.getVariants`, `priceLists.getDetails`/`getDetailById`/`updateDetail`, `stocks.getByVariantAndOffice`, `productTypes.getProducts`/`getAttributes`/`getAttributeById`.

### Added

- `BsaleRateLimiter` y `BsaleConfig.rateLimit` (opciones, instancia compartida entre clientes o `false`).
- Carriles de prioridad `high` (default) y `low` vía `priority` en `HttpRequestOptions` y `BsalePaginateOptions`. `low` siempre cede el paso a `high`.
- `expand` tipado: `BaseResource<T, X>` acepta un mapa de expansiones; `variants.list/listAll/iterate/getById({ expand: 'product' })` devuelven `BsaleVariantWithProduct`. Tipos `BsaleExpanded`, `BsaleExpandKeys`, `BsaleVariantExpansions`.
- `products.getVariants(productId, params, requestOptions)`: acepta `signal`, `skipCache` y `priority`.
- `BsaleApiError.headers` (nombres en minúscula) y `BsaleApiError.retryAfterMs` (Retry-After del servidor, sin recortar).
- `BsaleVariant.isLot` y `BsaleVariantCosts.totalCost` (los devuelve la API; no figuran en la doc).
- Tests de tipos (`tests/*.test-d.ts`) chequeados por `vitest run` vía `tsconfig.test.json`.
