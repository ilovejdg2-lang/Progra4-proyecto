import { apiRequest } from "./apiClient";

export function createDomainRequest(errorPrefix, timeoutMessage) {
  return (url, options = {}) =>
    apiRequest(url, {
      ...options,
      errorPrefix,
      timeoutMessage,
    });
}

export function createListCache(ttlMs) {
  let cache = { expiresAt: 0, data: null };
  let inflight = null;

  return {
    get(force = false) {
      if (!force && cache.expiresAt > Date.now() && Array.isArray(cache.data)) {
        return cache.data;
      }
      return inflight;
    },
    setPromise(promise, normalize = (data) => (Array.isArray(data) ? data : [])) {
      inflight = promise
        .then((data) => {
          const list = normalize(data);
          cache = { expiresAt: Date.now() + ttlMs, data: list };
          inflight = null;
          return list;
        })
        .catch((error) => {
          inflight = null;
          throw error;
        });
      return inflight;
    },
    clear() {
      cache = { expiresAt: 0, data: null };
      inflight = null;
    },
  };
}

export function createKeyedCache(ttlMs) {
  const cache = new Map();
  const inflight = new Map();

  return {
    async get(key, factory) {
      const entry = cache.get(key);
      if (entry && entry.expiresAt > Date.now()) {
        return entry.data;
      }

      if (inflight.has(key)) {
        return inflight.get(key);
      }

      const promise = Promise.resolve()
        .then(factory)
        .then((data) => {
          cache.set(key, { expiresAt: Date.now() + ttlMs, data });
          inflight.delete(key);
          return data;
        })
        .catch((error) => {
          inflight.delete(key);
          throw error;
        });

      inflight.set(key, promise);
      return promise;
    },
    clear() {
      cache.clear();
      inflight.clear();
    },
  };
}
