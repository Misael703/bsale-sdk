/**
 * Tipo de consumo de stock (catálogo predefinido por Bsale).
 *
 * **Naming inconsistente**: la API usa el prefijo `cnt*` en lugar del estándar
 * `id`/`name`/`state`. Respetar al deserializar.
 */
export interface BsaleStockConsumptionType {
  readonly cntId: number;
  readonly cntI18nName: string;
  readonly cntActive: 0 | 1;
  readonly cntCode: string;
}
