import { BaseResource } from './base.resource';
import type {
  BsalePaymentType,
  BsaleCreatePaymentTypePayload,
  BsaleDynamicAttribute,
  BsaleListResponse,
  BsaleQueryParams,
} from '../types';

/** Formas de pago. */
export class PaymentTypesResource extends BaseResource<BsalePaymentType> {
  protected readonly path = 'payment_types';

  /** Crea una forma de pago. Si `isCheck=1`, requiere `maxCheck`. */
  async create(data: BsaleCreatePaymentTypePayload): Promise<BsalePaymentType> {
    return this.http.post<BsalePaymentType>('/payment_types.json', data);
  }

  /** Lista los atributos dinámicos asociados a una forma de pago. */
  async getDynamicAttributes(
    paymentTypeId: number,
    params?: BsaleQueryParams,
  ): Promise<BsaleListResponse<BsaleDynamicAttribute>> {
    return this.http.get<BsaleListResponse<BsaleDynamicAttribute>>(
      `/payment_types/${paymentTypeId}/dynamic_attributes.json`,
      params,
    );
  }
}
