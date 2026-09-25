import type { BsaleConfig, BsaleRateLimiterOptions, BsaleRequestPriority } from '../types';
import { toAbortError } from '../utils/abort.utils';

/** Límite documentado por Bsale: "Ajuste rate-limit 8 requests por segundo" (changelog 10/2025). */
export const BSALE_DEFAULT_REQUESTS_PER_SECOND = 8;

const MS_PER_SECOND = 1000;
const TOKENS_PER_REQUEST = 1;

/** Orden de atención: el primer carril con alguien esperando se lleva el token. */
const PRIORITY_ORDER: ReadonlyArray<BsaleRequestPriority> = ['high', 'low'];

interface Waiter {
  readonly resolve: () => void;
  readonly reject: (error: Error) => void;
  readonly signal?: AbortSignal;
  readonly onAbort?: () => void;
}

/**
 * Token bucket compartido con carriles de prioridad.
 *
 * El bucket se llena a `requestsPerSecond` tokens por segundo hasta `burst`.
 * Cada request HTTP real (incluido cada retry) consume un token; los hits de
 * cache y las requests coalescidas no consumen. Cuando no hay tokens, las
 * requests esperan en su carril: `high` (interactivo, emisión) siempre se
 * atiende antes que `low` (sync en segundo plano), y dentro de un carril el
 * orden es FIFO. Un `low` puede quedar esperando mientras haya tráfico `high`
 * sostenido; eso es intencional.
 *
 * Una instancia por `BsaleClient` por defecto. Para que dos clientes con el
 * mismo token (ej. uno de emisión con `maxRetries: 0` y otro de lectura)
 * compartan el presupuesto, crear una instancia y pasarla a ambos en
 * `BsaleConfig.rateLimit`.
 */
export class BsaleRateLimiter {
  private readonly refillPerMs: number;
  private readonly capacity: number;
  private tokens: number;
  private lastRefillAt: number;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private readonly lanes: Record<BsaleRequestPriority, Waiter[]> = { high: [], low: [] };

  constructor(options?: BsaleRateLimiterOptions) {
    const requestsPerSecond = options?.requestsPerSecond ?? BSALE_DEFAULT_REQUESTS_PER_SECOND;
    const burst = options?.burst ?? requestsPerSecond;
    assertPositive('requestsPerSecond', requestsPerSecond);
    assertPositive('burst', burst);
    if (burst < TOKENS_PER_REQUEST) {
      throw new RangeError(`BsaleRateLimiter: burst must be >= 1, got ${burst}`);
    }

    this.refillPerMs = requestsPerSecond / MS_PER_SECOND;
    this.capacity = burst;
    this.tokens = burst;
    this.lastRefillAt = Date.now();
  }

  /** Requests esperando un token, sumando ambos carriles. */
  get pending(): number {
    return this.lanes.high.length + this.lanes.low.length;
  }

  /**
   * Toma un token sin esperar si hay uno libre y nadie en cola. Permite que
   * la request salga en el mismo tick, como sin limitador.
   * @returns `true` si tomó el token; `false` si hay que llamar a `acquire`.
   */
  tryAcquire(): boolean {
    if (this.pending > 0) return false;
    this.refill();
    if (this.tokens < TOKENS_PER_REQUEST) return false;
    this.tokens -= TOKENS_PER_REQUEST;
    return true;
  }

  /**
   * Espera un token. Resuelve de inmediato si hay uno disponible y nadie
   * espera antes. Si `signal` aborta mientras espera, sale de la cola y
   * rechaza con la razón del abort.
   */
  acquire(priority: BsaleRequestPriority = 'high', signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) return Promise.reject(toAbortError(signal));

    return new Promise<void>((resolve, reject) => {
      const lane = this.lanes[priority];
      const onAbort = signal
        ? (): void => {
            const idx = lane.indexOf(waiter);
            if (idx !== -1) lane.splice(idx, 1);
            reject(toAbortError(signal));
            this.drain();
          }
        : undefined;
      const waiter: Waiter = { resolve, reject, signal, onAbort };
      if (signal && onAbort) signal.addEventListener('abort', onAbort, { once: true });
      lane.push(waiter);
      this.drain();
    });
  }

  private drain(): void {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    this.refill();

    while (this.tokens >= TOKENS_PER_REQUEST) {
      const waiter = this.nextWaiter();
      if (!waiter) break;
      this.tokens -= TOKENS_PER_REQUEST;
      if (waiter.signal && waiter.onAbort) {
        waiter.signal.removeEventListener('abort', waiter.onAbort);
      }
      waiter.resolve();
    }

    if (this.pending > 0) {
      const missing = TOKENS_PER_REQUEST - this.tokens;
      const waitMs = Math.max(1, Math.ceil(missing / this.refillPerMs));
      this.timer = setTimeout(() => this.drain(), waitMs);
    }
  }

  private nextWaiter(): Waiter | undefined {
    for (const priority of PRIORITY_ORDER) {
      const waiter = this.lanes[priority].shift();
      if (waiter) return waiter;
    }
    return undefined;
  }

  private refill(): void {
    const now = Date.now();
    // Un reloj que retrocede no debe restar tokens.
    const elapsed = Math.max(0, now - this.lastRefillAt);
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerMs);
    this.lastRefillAt = now;
  }
}

/**
 * Resuelve `BsaleConfig.rateLimit` a una instancia: reusa la recibida, crea
 * una nueva a partir de opciones (o de los defaults), o `undefined` si es `false`.
 */
export function resolveRateLimiter(
  rateLimit: BsaleConfig['rateLimit'],
): BsaleRateLimiter | undefined {
  if (rateLimit === false) return undefined;
  if (rateLimit instanceof BsaleRateLimiter) return rateLimit;
  return new BsaleRateLimiter(rateLimit);
}

function assertPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`BsaleRateLimiter: ${name} must be a positive number, got ${value}`);
  }
}
