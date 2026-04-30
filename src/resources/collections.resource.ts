import type { HttpClient } from '../client/http-client';
import type {
  BsaleCollection,
  BsaleAddProductToCollectionPayload,
  BsaleQueryParams,
} from '../types';

/** Colecciones de e-commerce (categorías agrupadoras de productos web). */
export class CollectionsResource {
  constructor(private readonly http: HttpClient) {}

  /** Lista todas las colecciones del tenant. */
  async list(
    params?: BsaleQueryParams & { state?: 0 | 1; integration?: string },
  ): Promise<{
    code: string | number;
    href: string;
    count: number;
    limit: number;
    offset: number;
    data: ReadonlyArray<BsaleCollection>;
  }> {
    return this.http.get('/markets/collections/list.json', params);
  }

  /** Colecciones de un marketplace específico. */
  async listByMarket(
    marketId: number,
    params?: BsaleQueryParams,
  ): Promise<{
    code: string | number;
    href: string;
    count: number;
    limit: number;
    offset: number;
    data: ReadonlyArray<BsaleCollection>;
  }> {
    return this.http.get(`/markets/${marketId}/collections.json`, params);
  }

  /** Colecciones a las que pertenece una descripción web. */
  async getProductCollections(
    marketInfoId: number,
    params?: BsaleQueryParams,
  ): Promise<{ code: number; data: ReadonlyArray<BsaleCollection> }> {
    return this.http.get(`/v2/products/market_info/${marketInfoId}/collections.json`, params);
  }

  /** Asocia un producto/variante a una colección via SKU. */
  async addProduct(
    collectionId: number,
    data: BsaleAddProductToCollectionPayload,
  ): Promise<{
    code: number;
    data: { id: number; pwfId?: number; productId?: number | null; collId: number; href: string };
  }> {
    return this.http.post(`/collections/${collectionId}/products.json`, data);
  }
}
