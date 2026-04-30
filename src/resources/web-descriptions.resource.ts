import type { HttpClient } from '../client/http-client';
import type {
  BsaleWebDescription,
  BsaleCreateWebDescriptionPayload,
  BsaleUpdateWebDescriptionPayload,
  BsaleProductPicture,
  BsaleQueryParams,
} from '../types';

/**
 * Descripciones web (publicación de productos en la tienda online).
 *
 * Mezcla `/v2/` y `/v3/` según el sub-recurso.
 */
export class WebDescriptionsResource {
  constructor(private readonly http: HttpClient) {}

  /** Lista descripciones web con filtros completos. */
  async list(
    params?: BsaleQueryParams & {
      productWfId?: number;
      collId?: number;
      code?: string;
      productWebType?: 'normal' | 'virtual';
      urlSlug?: string;
      name?: string;
      prodArray?: string;
      storeId?: number;
      offices?: string;
      priceListId?: number;
      allVariantShows?: 1;
      allVariantStates?: 1;
    },
  ): Promise<{
    code: string | number;
    href: string;
    count: number;
    limit: number;
    offset: number;
    data: ReadonlyArray<BsaleWebDescription>;
    next?: string;
  }> {
    return this.http.get('/v2/products/list/market_info.json', params);
  }

  /** Lista filtrado por marketplace. */
  async listByMarket(
    marketId: number,
    params?: BsaleQueryParams & {
      collId?: number;
      productId?: number;
      brand?: number;
      with_stock?: 1;
      minPrice?: number;
      maxPrice?: number;
    },
  ): Promise<{
    code: string | number;
    count: number;
    limit: number;
    offset: number;
    data: ReadonlyArray<BsaleWebDescription>;
  }> {
    return this.http.get(`/v1/markets/${marketId}/products/market_info.json`, params);
  }

  /** Detalle de una descripción web. */
  async getById(id: number): Promise<{ code: number; data: BsaleWebDescription }> {
    return this.http.get(`/v2/products/market_info/${id}.json`);
  }

  /** Crea una descripción web (publica un producto en la tienda). */
  async create(
    data: BsaleCreateWebDescriptionPayload,
  ): Promise<{ code: number; data: BsaleWebDescription }> {
    return this.http.post('/v2/products/market_info.json', data);
  }

  /** Actualiza nombre/descripción/aviso de la publicación (solo esos 3 campos). */
  async update(
    id: number,
    data: BsaleUpdateWebDescriptionPayload,
  ): Promise<{ code: number; data: BsaleWebDescription }> {
    return this.http.put(`/v2/products/market_info/${id}.json`, data);
  }

  /** Imágenes del producto web. */
  async getPictures(
    marketInfoId: number,
    params?: BsaleQueryParams & { productId?: number },
  ): Promise<{
    code: number;
    href: string;
    count: number;
    limit: number;
    offset: number;
    data: ReadonlyArray<BsaleProductPicture>;
  }> {
    return this.http.get(`/v2/products/market_info/${marketInfoId}/pictures.json`, params);
  }
}
