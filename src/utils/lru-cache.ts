/**
 * Pequeño LRU cache basado en Map. Cuando supera `maxSize`, descarta la
 * entrada accedida menos recientemente (la primera del orden de inserción).
 * Las lecturas exitosas vuelven a insertar la entrada para moverla al final.
 */
export class LRUCache<V> {
  private readonly map = new Map<string, V>();

  constructor(private readonly maxSize: number) {
    if (maxSize <= 0 || !Number.isFinite(maxSize)) {
      throw new Error(`LRUCache: maxSize must be a positive finite number, got ${maxSize}`);
    }
  }

  get(key: string): V | undefined {
    const value = this.map.get(key);
    if (value === undefined) return undefined;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key: string, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    }
    this.map.set(key, value);
    if (this.map.size > this.maxSize) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) {
        this.map.delete(oldest);
      }
    }
  }

  delete(key: string): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  keys(): IterableIterator<string> {
    return this.map.keys();
  }

  get size(): number {
    return this.map.size;
  }
}
