/** Bsale office (branch/sucursal) entity */
export interface BsaleOffice {
  readonly id: number;
  readonly name: string;
  readonly description?: string;
  readonly address?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly city?: string;
  readonly municipality?: string;
  readonly zipCode?: string;
  readonly isVirtual: number;
  readonly state: number;
  readonly country?: string;
  readonly href: string;
}
