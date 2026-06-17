export function normalizePathname(pathname = typeof window !== 'undefined' ? window.location.pathname : '/') {
  const path = String(pathname || '/');
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }
  return path;
}
