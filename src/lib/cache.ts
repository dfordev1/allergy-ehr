// ============================================================================
// INTELLIGENT CACHING SYSTEM
// ============================================================================

import { toast } from 'sonner';

export interface CacheOptions {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of items in cache
  persistToStorage: boolean; // Whether to persist to localStorage
  storageKey?: string; // Key for localStorage
}

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export class IntelligentCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private options: CacheOptions;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 100,
      persistToStorage: false,
      ...options
    };

    this.setupCleanup();
    this.loadFromStorage();
  }

  private setupCleanup() {
    // Clean expired items every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  private loadFromStorage() {
    if (!this.options.persistToStorage || !this.options.storageKey) return;

    try {
      const stored = localStorage.getItem(this.options.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([key, item]) => {
          this.cache.set(key, item as CacheItem<T>);
        });
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  private saveToStorage() {
    if (!this.options.persistToStorage || !this.options.storageKey) return;

    try {
      const data = Object.fromEntries(this.cache.entries());
      localStorage.setItem(this.options.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  private cleanup() {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));

    // If cache is too large, remove least recently used items
    if (this.cache.size > this.options.maxSize) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

      const itemsToRemove = sortedEntries.slice(0, this.cache.size - this.options.maxSize);
      itemsToRemove.forEach(([key]) => this.cache.delete(key));
    }

    this.saveToStorage();
  }

  set(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl || this.options.ttl;
    const now = Date.now();

    const item: CacheItem<T> = {
      data,
      timestamp: now,
      ttl,
      accessCount: 0,
      lastAccessed: now
    };

    this.cache.set(key, item);
    this.saveToStorage();
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;

    const now = Date.now();
    
    // Check if item has expired
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccessed = now;

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.saveToStorage();
    return result;
  }

  clear(): void {
    this.cache.clear();
    this.saveToStorage();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    averageAccessCount: number;
  } {
    const items = Array.from(this.cache.values());
    const totalAccess = items.reduce((sum, item) => sum + item.accessCount, 0);
    
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate: items.length > 0 ? totalAccess / items.length : 0,
      averageAccessCount: items.length > 0 ? totalAccess / items.length : 0
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// ============================================================================
// SPECIALIZED CACHES
// ============================================================================

// Patient cache - longer TTL since patient data changes less frequently
export const patientCache = new IntelligentCache({
  ttl: 15 * 60 * 1000, // 15 minutes
  maxSize: 50,
  persistToStorage: true,
  storageKey: 'patient_cache'
});

// Booking cache - shorter TTL since bookings change more frequently
export const bookingCache = new IntelligentCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  persistToStorage: true,
  storageKey: 'booking_cache'
});

// Test results cache - medium TTL
export const testResultsCache = new IntelligentCache({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 30,
  persistToStorage: true,
  storageKey: 'test_results_cache'
});

// Static data cache (allergens, categories) - very long TTL
export const staticDataCache = new IntelligentCache({
  ttl: 60 * 60 * 1000, // 1 hour
  maxSize: 20,
  persistToStorage: true,
  storageKey: 'static_data_cache'
});

// ============================================================================
// CACHE-AWARE API WRAPPER
// ============================================================================

export function withCache<T>(
  cache: IntelligentCache<T>,
  keyPrefix: string = ''
) {
  return {
    async get<K extends T>(
      key: string,
      fetcher: () => Promise<K>,
      options: { ttl?: number; forceRefresh?: boolean } = {}
    ): Promise<K> {
      const cacheKey = keyPrefix ? `${keyPrefix}:${key}` : key;
      
      // Check cache first (unless force refresh is requested)
      if (!options.forceRefresh) {
        const cached = cache.get(cacheKey) as K;
        if (cached !== null) {
          return cached;
        }
      }

      try {
        // Fetch fresh data
        const data = await fetcher();
        
        // Cache the result
        cache.set(cacheKey, data as T, options.ttl);
        
        return data;
      } catch (error) {
        // If fetch fails, try to return stale cache data
        const stale = cache.get(cacheKey) as K;
        if (stale !== null) {
          toast.warning('Using cached data due to connection issues');
          return stale;
        }
        
        throw error;
      }
    },

    invalidate(key: string): void {
      const cacheKey = keyPrefix ? `${keyPrefix}:${key}` : key;
      cache.delete(cacheKey);
    },

    invalidatePattern(pattern: RegExp): void {
      const keys = cache.keys();
      keys.forEach(key => {
        if (pattern.test(key)) {
          cache.delete(key);
        }
      });
    },

    clear(): void {
      cache.clear();
    }
  };
}

// ============================================================================
// CACHE MANAGERS
// ============================================================================

export const cacheManager = {
  patients: withCache(patientCache, 'patients'),
  bookings: withCache(bookingCache, 'bookings'),
  testResults: withCache(testResultsCache, 'tests'),
  staticData: withCache(staticDataCache, 'static'),

  // Global cache operations
  clearAll(): void {
    patientCache.clear();
    bookingCache.clear();
    testResultsCache.clear();
    staticDataCache.clear();
    toast.success('All caches cleared');
  },

  getGlobalStats(): Record<string, any> {
    return {
      patients: patientCache.getStats(),
      bookings: bookingCache.getStats(),
      testResults: testResultsCache.getStats(),
      staticData: staticDataCache.getStats()
    };
  },

  // Invalidate related caches when data changes
  invalidatePatientRelated(patientId: string): void {
    this.patients.invalidatePattern(new RegExp(`patients:.*${patientId}.*`));
    this.bookings.invalidatePattern(new RegExp(`bookings:.*patient.*${patientId}.*`));
    this.testResults.invalidatePattern(new RegExp(`tests:.*${patientId}.*`));
  },

  invalidateBookingRelated(bookingId: string): void {
    this.bookings.invalidatePattern(new RegExp(`bookings:.*${bookingId}.*`));
  }
};

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  patientCache.destroy();
  bookingCache.destroy();
  testResultsCache.destroy();
  staticDataCache.destroy();
});

export default cacheManager;