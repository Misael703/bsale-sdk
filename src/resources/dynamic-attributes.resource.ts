import { BaseResource } from './base.resource';
import type {
  BsaleDynamicAttribute,
  BsaleDynamicAttributeDetail,
  BsaleListResponse,
  BsaleQueryParams,
} from '../types';

/**
 * Atributos dinámicos (campos extensibles para clientes, documentos y formas
 * de pago). Solo lectura — se configuran desde la UI de Bsale.
 */
export class DynamicAttributesResource extends BaseResource<BsaleDynamicAttribute> {
  protected readonly path = 'dynamic_attributes';

  /** Lista las opciones predefinidas de un atributo (cuando es de tipo lista). */
  async getDetails(
    attributeId: number,
    params?: BsaleQueryParams,
  ): Promise<BsaleListResponse<BsaleDynamicAttributeDetail>> {
    return this.http.get<BsaleListResponse<BsaleDynamicAttributeDetail>>(
      `/dynamic_attributes/${attributeId}/details.json`,
      params,
    );
  }

  /** Obtiene una opción específica. */
  async getDetailById(
    attributeId: number,
    detailId: number,
  ): Promise<BsaleDynamicAttributeDetail> {
    return this.http.get<BsaleDynamicAttributeDetail>(
      `/dynamic_attributes/${attributeId}/details/${detailId}.json`,
    );
  }
}
