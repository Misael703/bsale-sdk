/** Sucursal (office). */
export interface BsaleOffice {
  readonly id: number;
  readonly name: string;
  readonly description?: string;
  readonly address?: string;
  readonly latitude?: string | number;
  readonly longitude?: string | number;
  readonly city?: string;
  readonly municipality?: string;
  readonly zipCode?: string | null;
  readonly isVirtual: 0 | 1;
  /** 0 = activo, 1 = inactivo, 99 = eliminado */
  readonly state: number;
  readonly country?: string | null;
  readonly costCenter?: string;
  readonly imagestionCellarId?: number;
  readonly href: string;
}

/** Payload para `POST /offices.json`. */
export interface BsaleCreateOfficePayload {
  readonly name: string;
  readonly description?: string;
  readonly address?: string;
  readonly city?: string;
  readonly municipality?: string;
  readonly country?: string;
  readonly zipCode?: string;
  readonly latitude?: string;
  readonly longitude?: string;
  readonly isVirtual?: 0 | 1;
  readonly costCenter?: string;
}

/** Payload para `PUT /offices/{id}.json` (parcial). */
export type BsaleUpdateOfficePayload = Partial<BsaleCreateOfficePayload> & {
  readonly id: string | number;
};
