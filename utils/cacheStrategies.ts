// Estrategias de caching para diferentes tipos de recursos

export interface CacheConfig {
  name: string;
  version: string;
  maxAge: number; // en milisegundos
  maxEntries: number;
}

export const CACHE_CONFIGS = {
  STATIC: {
    name: 'static-assets',
    version: '1.0.0',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
    maxEntries: 100
  },
  IMAGES: {
    name: 'images',
    version: '1.0.0',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    maxEntries: 50
  },
  OCR_MODELS: {
    name: 'ocr-models',
    version: '1.0.0',
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 días
    maxEntries: 10
  },
  API_DATA: {
    name: 'api-data',
    version: '1.0.0',
    maxAge: 60 * 60 * 1000, // 1 hora
    maxEntries: 100
  }
} as const;

export class CacheManager {
  private static instance: CacheManager;
  
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private constructor() {}

  async getCacheName(config: CacheConfig): Promise<string> {
    return `${config.name}-v${config.version}`;
  }

  // Cache First Strategy - Para recursos estáticos
  async cacheFirst(request: Request, config: CacheConfig): Promise<Response> {
    const cacheName = await this.getCacheName(config);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log(`[Cache] Serving from cache: ${request.url}`);
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await this.addToCache(cache, request, networkResponse.clone(), config);
      }
      return networkResponse;
    } catch (error) {
      console.error(`[Cache] Network failed for: ${request.url}`, error);
      throw error;
    }
  }

  // Network First Strategy - Para datos dinámicos
  async networkFirst(request: Request, config: CacheConfig): Promise<Response> {
    const cacheName = await this.getCacheName(config);
    const cache = await caches.open(cacheName);

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await this.addToCache(cache, request, networkResponse.clone(), config);
      }
      return networkResponse;
    } catch (error) {
      console.warn(`[Cache] Network failed, trying cache: ${request.url}`);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  }

  // Stale While Revalidate - Para recursos que pueden estar desactualizados
  async staleWhileRevalidate(request: Request, config: CacheConfig): Promise<Response> {
    const cacheName = await this.getCacheName(config);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    // Fetch en background para actualizar cache
    const fetchPromise = fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        await this.addToCache(cache, request, networkResponse.clone(), config);
      }
      return networkResponse;
    }).catch((error) => {
      console.warn(`[Cache] Background fetch failed: ${request.url}`, error);
    });

    // Retornar cache inmediatamente si existe
    if (cachedResponse) {
      console.log(`[Cache] Serving stale content: ${request.url}`);
      return cachedResponse;
    }

    // Si no hay cache, esperar por la red
    return fetchPromise as Promise<Response>;
  }

  private async addToCache(
    cache: Cache, 
    request: Request, 
    response: Response, 
    config: CacheConfig
  ): Promise<void> {
    try {
      // Verificar límites de cache
      await this.enforceMaxEntries(cache, config);
      
      // Agregar metadata de expiración
      const responseWithMetadata = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'sw-cache-timestamp': Date.now().toString(),
          'sw-cache-max-age': config.maxAge.toString()
        }
      });

      await cache.put(request, responseWithMetadata);
      console.log(`[Cache] Added to cache: ${request.url}`);
    } catch (error) {
      console.error(`[Cache] Failed to add to cache: ${request.url}`, error);
    }
  }

  private async enforceMaxEntries(cache: Cache, config: CacheConfig): Promise<void> {
    const keys = await cache.keys();
    
    if (keys.length >= config.maxEntries) {
      // Eliminar las entradas más antiguas
      const entriesToDelete = keys.length - config.maxEntries + 1;
      const keysToDelete = keys.slice(0, entriesToDelete);
      
      await Promise.all(
        keysToDelete.map(key => cache.delete(key))
      );
      
      console.log(`[Cache] Deleted ${entriesToDelete} old entries`);
    }
  }

  async cleanExpiredEntries(config: CacheConfig): Promise<void> {
    const cacheName = await this.getCacheName(config);
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    const now = Date.now();

    const expiredKeys = await Promise.all(
      keys.map(async (key) => {
        const response = await cache.match(key);
        if (!response) return null;

        const timestamp = response.headers.get('sw-cache-timestamp');
        const maxAge = response.headers.get('sw-cache-max-age');
        
        if (!timestamp || !maxAge) return null;

        const age = now - parseInt(timestamp);
        const isExpired = age > parseInt(maxAge);
        
        return isExpired ? key : null;
      })
    );

    const keysToDelete = expiredKeys.filter(Boolean) as Request[];
    
    if (keysToDelete.length > 0) {
      await Promise.all(
        keysToDelete.map(key => cache.delete(key))
      );
      console.log(`[Cache] Cleaned ${keysToDelete.length} expired entries`);
    }
  }

  async getCacheSize(config: CacheConfig): Promise<number> {
    const cacheName = await this.getCacheName(config);
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    let totalSize = 0;
    for (const key of keys) {
      const response = await cache.match(key);
      if (response && response.body) {
        const reader = response.body.getReader();
        let size = 0;
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.length;
          }
        } finally {
          reader.releaseLock();
        }
        
        totalSize += size;
      }
    }
    
    return totalSize;
  }

  async clearCache(config: CacheConfig): Promise<void> {
    const cacheName = await this.getCacheName(config);
    await caches.delete(cacheName);
    console.log(`[Cache] Cleared cache: ${cacheName}`);
  }

  async clearAllCaches(): Promise<void> {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(name => caches.delete(name))
    );
    console.log('[Cache] Cleared all caches');
  }
}

// Utilidades para uso en componentes React
export function useCacheStatus() {
  const [cacheSize, setCacheSize] = React.useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const updateCacheStatus = async () => {
      const cacheManager = CacheManager.getInstance();
      const sizes: Record<string, number> = {};

      for (const [key, config] of Object.entries(CACHE_CONFIGS)) {
        try {
          sizes[key] = await cacheManager.getCacheSize(config);
        } catch (error) {
          console.error(`Failed to get cache size for ${key}:`, error);
          sizes[key] = 0;
        }
      }

      setCacheSize(sizes);
      setIsLoading(false);
    };

    updateCacheStatus();
  }, []);

  const clearCache = async (configKey: keyof typeof CACHE_CONFIGS) => {
    const cacheManager = CacheManager.getInstance();
    await cacheManager.clearCache(CACHE_CONFIGS[configKey]);
    
    // Actualizar estado
    setCacheSize(prev => ({ ...prev, [configKey]: 0 }));
  };

  const clearAllCaches = async () => {
    const cacheManager = CacheManager.getInstance();
    await cacheManager.clearAllCaches();
    
    // Resetear estado
    const emptySizes = Object.keys(CACHE_CONFIGS).reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {} as Record<string, number>);
    
    setCacheSize(emptySizes);
  };

  return {
    cacheSize,
    isLoading,
    clearCache,
    clearAllCaches,
    totalSize: Object.values(cacheSize).reduce((sum, size) => sum + size, 0)
  };
}

// Importar React para el hook
import React from 'react';