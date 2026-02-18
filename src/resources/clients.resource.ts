import { BaseResource } from './base.resource';
import type { BsaleClient, BsaleClientPayload } from '../types';

/** Resource for managing Bsale clients (customers) */
export class ClientsResource extends BaseResource<BsaleClient> {
  protected readonly path = 'clients';

  /**
   * Creates a new client.
   * @param data - Client data
   * @returns The created client
   */
  async create(data: BsaleClientPayload): Promise<BsaleClient> {
    return this.http.post<BsaleClient>('/clients.json', data);
  }

  /**
   * Updates an existing client.
   * @param id - Client ID
   * @param data - Client data to update
   * @returns The updated client
   */
  async update(id: number, data: BsaleClientPayload): Promise<BsaleClient> {
    return this.http.put<BsaleClient>(`/clients/${id}.json`, data);
  }
}
