/** Bsale client (customer) entity */
export interface BsaleClient {
  readonly id: number;
  readonly firstName: string;
  readonly lastName: string;
  readonly email?: string;
  readonly phone?: string;
  readonly company?: string;
  readonly code?: string;
  readonly state: number;
  readonly activity?: string;
  readonly city?: string;
  readonly municipality?: string;
  readonly address?: string;
  readonly companyOrPerson: number;
  readonly href: string;
}

/** Payload for creating or updating a client */
export interface BsaleClientPayload {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly company?: string;
  readonly code?: string;
  readonly state?: number;
  readonly activity?: string;
  readonly city?: string;
  readonly municipality?: string;
  readonly address?: string;
  readonly companyOrPerson?: number;
}
