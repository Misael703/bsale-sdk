import { BaseResource } from './base.resource';
import type { BsaleDteCode } from '../types';

/**
 * Códigos tributarios DTE (catálogo SII).
 *
 * `count.json` no documentado — sobrescribimos para evitar llamadas a un
 * endpoint que puede no existir.
 */
export class DteCodesResource extends BaseResource<BsaleDteCode> {
  protected readonly path = 'dte_codes';

  /** No documentado por la API; lanza error si se invoca. */
  override async count(): Promise<{ count: number }> {
    throw new Error('count() not supported on dte_codes — use list() and check `count` in the response');
  }
}
