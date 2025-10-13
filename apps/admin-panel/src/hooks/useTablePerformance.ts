import { useCallback, useRef, useMemo } from 'react';
import { debounce } from 'lodash-es';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export function useTablePerformance<T>(cacheTimeout: number = 5 * 60 * 1000) {
  const cache = useRef<Map<string, CacheEntry<T>>>(new Map());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  // Cache management
  const getCached = useCallback(
    (key: string): T | null => {
      const entry = cache.current.get(key);
      if (!entry) return null;

      const now = Date.now();
      if (now - entry.timestamp > cacheTimeout) {
        cache.current.delete(key);
        return null;
      }

      return entry.data;
    },
    [cacheTimeout],
  );

  const setCache = useCallback((key: string, data: T) => {
    cache.current.set(key, {
      data,
      timestamp: Date.now(),
    });
  }, []);

  const clearCache = useCallback(() => {
    cache.current.clear();
  }, []);

  const invalidateCache = useCallback(
    (keyPattern?: string) => {
      if (!keyPattern) {
        clearCache();
        return;
      }

      const keysToDelete: string[] = [];
      cache.current.forEach((_, key) => {
        if (key.includes(keyPattern)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach((key) => cache.current.delete(key));
    },
    [clearCache],
  );

  // Request cancellation
  const getAbortController = useCallback((key: string): AbortController => {
    // Cancel previous request with same key
    const existingController = abortControllers.current.get(key);
    if (existingController) {
      existingController.abort();
    }

    const controller = new AbortController();
    abortControllers.current.set(key, controller);
    return controller;
  }, []);

  const cancelRequest = useCallback((key: string) => {
    const controller = abortControllers.current.get(key);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(key);
    }
  }, []);

  const cancelAllRequests = useCallback(() => {
    abortControllers.current.forEach((controller) => controller.abort());
    abortControllers.current.clear();
  }, []);

  // Debounced search
  const createDebouncedSearch = useCallback((fn: (...args: any[]) => any, delay: number = 300) => {
    return debounce(fn, delay, { leading: false, trailing: true });
  }, []);

  return {
    // Cache
    getCached,
    setCache,
    clearCache,
    invalidateCache,
    // Request cancellation
    getAbortController,
    cancelRequest,
    cancelAllRequests,
    // Debouncing
    createDebouncedSearch,
  };
}
