const PREFIX = 'cafe-una:page:';
const TTL_MS = 30 * 60 * 1000;

const memory = new Map();

export function readPageCache(key) {
  const memEntry = memory.get(key);
  if (memEntry && memEntry.expiresAt > Date.now()) {
    return memEntry.data;
  }

  try {
    const raw = sessionStorage.getItem(`${PREFIX}${key}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.expiresAt || parsed.expiresAt <= Date.now()) {
      sessionStorage.removeItem(`${PREFIX}${key}`);
      return null;
    }

    memory.set(key, { data: parsed.data, expiresAt: parsed.expiresAt });
    return parsed.data;
  } catch {
    return null;
  }
}

/** Devuelve datos aunque el TTL haya expirado (útil si la red falla). */
export function readStalePageCache(key) {
  const fresh = readPageCache(key);
  if (fresh) return fresh;

  const memEntry = memory.get(key);
  if (memEntry?.data) return memEntry.data;

  try {
    const raw = sessionStorage.getItem(`${PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.data ?? null;
  } catch {
    return null;
  }
}

export function writePageCache(key, data) {
  const expiresAt = Date.now() + TTL_MS;
  memory.set(key, { data, expiresAt });

  try {
    sessionStorage.setItem(`${PREFIX}${key}`, JSON.stringify({ data, expiresAt }));
  } catch {
    // sessionStorage lleno o no disponible
  }
}

export function invalidatePageCache(key) {
  memory.delete(key);
  try {
    sessionStorage.removeItem(`${PREFIX}${key}`);
  } catch {
    // ignore
  }
}

export function invalidateAllPageCaches() {
  memory.clear();
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const storageKey = sessionStorage.key(i);
      if (storageKey?.startsWith(PREFIX)) {
        sessionStorage.removeItem(storageKey);
      }
    }
  } catch {
    // ignore
  }
}
