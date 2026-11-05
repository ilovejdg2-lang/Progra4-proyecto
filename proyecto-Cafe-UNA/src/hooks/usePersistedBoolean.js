import { useEffect, useRef, useState } from "react";

function readBoolean(storageKey, defaultValue) {
  if (typeof window === "undefined") return defaultValue;
  try {
    const saved = localStorage.getItem(storageKey);
    return saved === null ? defaultValue : saved === "true";
  } catch {
    return defaultValue;
  }
}

/**
 * A boolean mirrored to localStorage. The setter is React's own (stable, accepts
 * functional updates). The key is written only after the value actually changes,
 * never on mount, and storage failures are swallowed.
 */
export function usePersistedBoolean(storageKey, defaultValue = false) {
  const [value, setValue] = useState(() => readBoolean(storageKey, defaultValue));
  const lastPersisted = useRef(value);

  useEffect(() => {
    if (value === lastPersisted.current) return;
    lastPersisted.current = value;
    try {
      localStorage.setItem(storageKey, String(value));
    } catch (err) {
      console.warn(`Could not persist "${storageKey}":`, err);
    }
  }, [storageKey, value]);

  return [value, setValue];
}
