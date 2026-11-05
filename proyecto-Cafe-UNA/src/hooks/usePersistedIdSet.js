import { useCallback, useEffect, useState } from "react";

function readIds(storageKey) {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * A set of string ids mirrored to localStorage. State updaters stay pure;
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
