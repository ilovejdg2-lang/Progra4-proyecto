import { useCallback, useEffect, useState } from "react";

function readIds(storageKey) {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(storageKey);
    const parsed = stored ? JSON.parse(stored) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

/**
 * A set of ids mirrored to localStorage. Ids are normalized to strings (when read
 * and when added or toggled). Corrupt or non-array stored data starts as an empty
 * set, and the effect rewrites a clean value on mount. State updaters stay pure;
 * persistence runs in an effect after each committed change.
 */
export function usePersistedIdSet(storageKey) {
  const [ids, setIds] = useState(() => readIds(storageKey));

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...ids]));
    } catch (err) {
      console.warn(`Could not persist "${storageKey}":`, err);
    }
  }, [storageKey, ids]);

  const toggle = useCallback((id) => {
    const key = String(id);
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const add = useCallback((id) => {
    setIds((prev) => new Set(prev).add(String(id)));
  }, []);

  return { ids, toggle, add };
}
