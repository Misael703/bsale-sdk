import { BaseResource } from './base.resource';
import type {
  BsaleOffice,
  BsaleCreateOfficePayload,
  BsaleUpdateOfficePayload,
} from '../types';

/** Sucursales — CRUD completo. */
export class OfficesResource extends BaseResource<BsaleOffice> {
  protected readonly path = 'offices';

  /** Crea una sucursal nueva. La API rechaza si excede el cupo del plan. */
  async create(data: BsaleCreateOfficePayload): Promise<BsaleOffice> {
    return this.http.post<BsaleOffice>('/offices.json', data);
  }

  /** Actualiza campos de una sucursal. La API acepta updates parciales. */
  async update(id: number, data: Omit<BsaleUpdateOfficePayload, 'id'>): Promise<BsaleOffice> {
    return this.http.put<BsaleOffice>(`/offices/${id}.json`, { id: String(id), ...data });
  }

  /** Elimina virtualmente una sucursal (cambia state a 99). */
  async delete(id: number): Promise<void> {
    await this.http.delete(`/offices/${id}.json`);
  }
}
