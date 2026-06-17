/** Normaliza BACKEND_URL para que siempre termine en /api */
export function normalizeBackendUrl(raw) {
  let url = (raw || '').trim().replace(/^["']|["']$/g, '').replace(/\/$/, '');
  if (!url) return '';
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
}
