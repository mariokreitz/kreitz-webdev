export interface CacheHit<T> {
  readonly found: true;
  readonly value: T;
}

export interface CacheMiss {
  readonly found: false;
}

export type CacheEntry<T> = CacheHit<T> | CacheMiss;
