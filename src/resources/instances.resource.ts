import type { HttpClient } from '../client/http-client';
import type { BsaleInstance } from '../types';

/**
 * Metadata de la instancia (tenant).
 *
 * **Particularidades**:
 * - Vive en host distinto: `credential.bsale.io`.
 * - El token va en el path (`/instances/basic/{token}.json`), no en header.
 *
 * El `BsaleClient` debe construir esta resource con el `credentialHttp` y el
 * token actual.
 */
export class InstancesResource {
  constructor(
    private readonly http: HttpClient,
    private readonly accessToken: string,
  ) {}

  /**
   * Información básica del tenant. Si `token` se omite, usa el token actual.
   */
  async getBasic(token?: string): Promise<BsaleInstance> {
    const t = token ?? this.accessToken;
    const encoded = encodeURIComponent(t);
    return this.http.get<BsaleInstance>(`/instances/basic/${encoded}.json`, undefined, {
      skipAuth: true,
    });
  }
}
