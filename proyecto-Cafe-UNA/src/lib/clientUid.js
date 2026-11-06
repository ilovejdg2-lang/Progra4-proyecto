// Client-only identity for rows in editable lists (React keys). Never send it to the API.
export function nuevoUid() {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `uid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
