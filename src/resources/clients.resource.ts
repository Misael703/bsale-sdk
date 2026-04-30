import { BaseResource } from './base.resource';
import type {
  BsaleClient,
  BsaleClientPayload,
  BsaleClientUpdatePayload,
  BsaleClientContact,
  BsaleClientContactPayload,
  BsaleClientAddress,
  BsaleClientAddressPayload,
  BsaleClientAttributeItem,
  BsaleClientPointsPayload,
  BsaleListResponse,
  BsaleQueryParams,
} from '../types';

/** Clientes. CRUD principal + contactos, direcciones, atributos y puntos. */
export class ClientsResource extends BaseResource<BsaleClient> {
  protected readonly path = 'clients';

  /** Crea un cliente. Si `isForeigner=1` sin `code`, la API asigna `"55555555-5"`. */
  async create(data: BsaleClientPayload): Promise<BsaleClient> {
    return this.http.post<BsaleClient>('/clients.json', data);
  }

  /** Actualiza un cliente. El `id` se inyecta automáticamente en el body. */
  async update(
    id: number,
    data: Omit<BsaleClientUpdatePayload, 'id'>,
  ): Promise<BsaleClient> {
    return this.http.put<BsaleClient>(`/clients/${id}.json`, { id: String(id), ...data });
  }

  /** Soft delete: cambia `state` a 99. Documentos asociados persisten. */
  async delete(id: number): Promise<void> {
    await this.http.delete(`/clients/${id}.json`);
  }

  // ===== Contactos =====

  async getContacts(
    clientId: number,
    params?: BsaleQueryParams,
  ): Promise<BsaleListResponse<BsaleClientContact>> {
    return this.http.get<BsaleListResponse<BsaleClientContact>>(
      `/clients/${clientId}/contacts.json`,
      params,
    );
  }

  async getContactById(clientId: number, contactId: number): Promise<BsaleClientContact> {
    return this.http.get<BsaleClientContact>(
      `/clients/${clientId}/contacts/${contactId}.json`,
    );
  }

  async createContact(
    clientId: number,
    data: BsaleClientContactPayload,
  ): Promise<BsaleClientContact> {
    return this.http.post<BsaleClientContact>(
      `/clients/${clientId}/contacts.json`,
      data,
    );
  }

  async deleteContact(clientId: number, contactId: number): Promise<void> {
    await this.http.delete(`/clients/${clientId}/contacts/${contactId}.json`);
  }

  // ===== Direcciones =====

  async getAddresses(
    clientId: number,
    params?: BsaleQueryParams,
  ): Promise<BsaleListResponse<BsaleClientAddress>> {
    return this.http.get<BsaleListResponse<BsaleClientAddress>>(
      `/clients/${clientId}/addresses.json`,
      params,
    );
  }

  async getAddressById(clientId: number, addressId: number): Promise<BsaleClientAddress> {
    return this.http.get<BsaleClientAddress>(
      `/clients/${clientId}/addresses/${addressId}.json`,
    );
  }

  async createAddress(
    clientId: number,
    data: BsaleClientAddressPayload,
  ): Promise<BsaleClientAddress> {
    return this.http.post<BsaleClientAddress>(
      `/clients/${clientId}/addresses.json`,
      data,
    );
  }

  async updateAddress(
    clientId: number,
    addressId: number,
    data: BsaleClientAddressPayload,
  ): Promise<BsaleClientAddress> {
    return this.http.put<BsaleClientAddress>(
      `/clients/${clientId}/addresses/${addressId}.json`,
      data,
    );
  }

  async deleteAddress(clientId: number, addressId: number): Promise<void> {
    await this.http.delete(`/clients/${clientId}/addresses/${addressId}.json`);
  }

  // ===== Atributos =====

  /** Lista los atributos dinámicos del cliente (read-only). */
  async getAttributes(
    clientId: number,
    params?: BsaleQueryParams,
  ): Promise<BsaleListResponse<BsaleClientAttributeItem>> {
    return this.http.get<BsaleListResponse<BsaleClientAttributeItem>>(
      `/clients/${clientId}/attributes.json`,
      params,
    );
  }

  // ===== Puntos =====

  /**
   * Ajusta los puntos de un cliente. **Endpoint plano**:
   * `PUT /clients/points.json` (no `/clients/{id}/points`).
   */
  async adjustPoints(payload: BsaleClientPointsPayload): Promise<unknown> {
    return this.http.put('/clients/points.json', payload);
  }
}
