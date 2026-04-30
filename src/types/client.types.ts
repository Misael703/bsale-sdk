/** Cliente. */
export interface BsaleClient {
  readonly id: number;
  readonly firstName: string;
  readonly lastName: string;
  readonly email?: string;
  readonly phone?: string;
  readonly company?: string;
  readonly code?: string;
  /** 0=activo, 1=inactivo, 99=eliminado */
  readonly state: number;
  readonly activity?: string;
  readonly city?: string;
  readonly municipality?: string;
  readonly address?: string;
  readonly note?: string | null;
  readonly facebook?: string | null;
  readonly twitter?: string;
  readonly companyOrPerson: 0 | 1;
  readonly hasCredit?: 0 | 1;
  readonly maxCredit?: number | string;
  readonly accumulatePoints?: 0 | 1;
  readonly points?: number;
  readonly pointsUpdated?: number;
  readonly sendDte?: 0 | 1;
  /** **Sic**: typo histórico (`Clien` sin "t" final). */
  readonly prestashopClienId?: string | number;
  readonly contacts?: { readonly href: string };
  readonly attributes?: { readonly href: string };
  readonly addresses?: { readonly href: string };
  readonly payment_type?: { readonly id: string; readonly href: string };
  readonly sale_condition?: { readonly id: string; readonly href: string };
  readonly href: string;
}

/** Atributo dinámico al crear/actualizar un cliente. */
export interface BsaleClientDynamicAttributeInput {
  readonly dynamicAttributeId: number;
  readonly description: string;
}

/** Payload `POST /clients.json`. */
export interface BsaleClientPayload {
  readonly firstName: string;
  readonly lastName: string;
  readonly code: string;
  readonly company?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly address?: string;
  readonly city?: string;
  readonly municipality?: string;
  readonly activity?: string;
  readonly note?: string;
  readonly facebook?: string;
  readonly twitter?: string;
  readonly hasCredit?: 0 | 1;
  readonly maxCredit?: number;
  readonly accumulatePoints?: 0 | 1;
  readonly companyOrPerson?: 0 | 1;
  readonly isForeigner?: 0 | 1;
  readonly dynamicAttributes?: ReadonlyArray<BsaleClientDynamicAttributeInput>;
}

/** Payload `PUT /clients/{id}.json`. */
export interface BsaleClientUpdatePayload extends Partial<BsaleClientPayload> {
  readonly id: string | number;
  readonly priceListId?: number;
}

/** Contacto de un cliente. */
export interface BsaleClientContact {
  readonly id: number;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone?: string;
  readonly email?: string;
  readonly href: string;
}

/** Payload `POST /clients/{id}/contacts.json`. */
export interface BsaleClientContactPayload {
  readonly firstName: string;
  readonly lastName: string;
  readonly phone?: string;
  readonly email?: string;
}

/** Dirección de un cliente. */
export interface BsaleClientAddress {
  readonly id: number;
  readonly addressName: string;
  readonly address: string;
  readonly city?: string;
  readonly municipality?: string;
  readonly state: 0 | 1;
  readonly href: string;
}

/** Payload `POST/PUT` de dirección. */
export interface BsaleClientAddressPayload {
  readonly addressName: string;
  readonly address: string;
  readonly city?: string;
  readonly municipality?: string;
}

/** Atributo dinámico de un cliente (response). */
export interface BsaleClientAttributeItem {
  readonly id: number;
  readonly name: string;
  readonly value: string;
  readonly href: string;
}

/** Payload `PUT /clients/points.json`. */
export interface BsaleClientPointsPayload {
  /** 0 = aumenta, 1 = resta */
  readonly type: 0 | 1;
  readonly clientId: number;
  readonly points: number;
  readonly description: string;
  readonly orderId?: string;
}
