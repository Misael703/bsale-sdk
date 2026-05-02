import { describe, it, expect } from 'vitest';
import { LRUCache } from '../src/utils/lru-cache';

describe('LRUCache', () => {
  it('stores and retrieves values', () => {
    const cache = new LRUCache<number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBe(2);
    expect(cache.get('missing')).toBeUndefined();
  });

  it('evicts the least-recently-used entry when over capacity', () => {
    const cache = new LRUCache<number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
  });

  it('bumps an entry to most-recent on get', () => {
    const cache = new LRUCache<number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a');
    cache.set('c', 3);
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBe(3);
  });

  it('updates value and bumps entry on re-set', () => {
    const cache = new LRUCache<number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('a', 10);
    cache.set('c', 3);
    expect(cache.get('a')).toBe(10);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBe(3);
  });

  it('throws on invalid maxSize', () => {
    expect(() => new LRUCache<number>(0)).toThrow();
    expect(() => new LRUCache<number>(-1)).toThrow();
    expect(() => new LRUCache<number>(Infinity)).toThrow();
    expect(() => new LRUCache<number>(NaN)).toThrow();
  });

  it('clear() removes all entries', () => {
    const cache = new LRUCache<number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get('a')).toBeUndefined();
  });

  it('delete() removes a specific entry', () => {
    const cache = new LRUCache<number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.delete('a')).toBe(true);
    expect(cache.delete('a')).toBe(false);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
  });

  it('keys() exposes insertion-ordered keys', () => {
    const cache = new LRUCache<number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    expect([...cache.keys()]).toEqual(['a', 'b', 'c']);
    cache.get('a');
    expect([...cache.keys()]).toEqual(['b', 'c', 'a']);
  });
});
