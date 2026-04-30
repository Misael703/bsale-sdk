/** Estado de una orden de envío. */
export type BsaleCourierState = 2 | 3 | 4;

/** Dirección de origen/destino. */
export interface BsaleCourierAddress {
  readonly country: string;
  readonly state: string;
  readonly city: string;
  readonly district: string;
  readonly address: string;
  readonly buildingNumber?: string;
  readonly zipcode?: string;
  readonly latitude?: string;
  readonly longitude?: string;
}

/** Contacto del envío. */
export interface BsaleCourierContact {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly code: string;
  readonly phone: string;
}

/** Tipo de servicio del courier. */
export interface BsaleDeliveryType {
  readonly id: number;
  readonly name: string;
  readonly code: string;
  readonly courierId: number;
}

/** Línea de envío. */
export interface BsaleCourierOrderDetail {
  readonly id: number;
  readonly description: string;
  readonly quantity: number;
  /** kg */
  readonly weight: number;
  /** cm */
  readonly length: number;
  /** cm */
  readonly width: number;
  /** cm */
  readonly height: number;
}

/** Orden de envío (response). */
export interface BsaleCourierOrder {
  readonly id: number;
  readonly origin: BsaleCourierAddress;
  readonly destination: BsaleCourierAddress;
  readonly packagingType: 0 | 1;
  readonly contact: BsaleCourierContact;
  readonly comment?: string;
  readonly deliveryType?: BsaleDeliveryType;
  readonly courierId: number;
  readonly sellerId: number;
  readonly stateId: BsaleCourierState;
  readonly label?: string;
  readonly trackingNumber?: string;
  readonly details?: ReadonlyArray<BsaleCourierOrderDetail>;
}

/** Payload `POST /v1/logs.json` (host courier). */
export interface BsaleCourierLogPayload {
  /** `resourceId` recibido en el webhook. */
  readonly id: number;
  readonly description: string;
  readonly stateId: BsaleCourierState;
}

/** Payload `PUT /v1/couriers/orders/{id}/label.json`. */
export interface BsaleCourierLabelPayload {
  readonly orderId: number;
  readonly trackingNumber: string;
  readonly urlTracking: string;
  readonly label: string;
}
