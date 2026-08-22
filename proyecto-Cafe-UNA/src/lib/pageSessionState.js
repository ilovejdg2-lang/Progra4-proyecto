import { normalizePathname } from './paths';

const revealed = new Set();

export function getRouteCacheKey(pathname = normalizePathname()) {
  const path = normalizePathname(pathname);
  if (path === '/') return 'home';
  if (path === '/productos') return 'products';
  if (path.startsWith('/productos/')) return 'product-detail';
  if (path === '/AboutUs') return 'about';
  if (path.startsWith('/voluntariado')) return 'voluntariado';
  if (path === '/checkout') return 'checkout';
  if (path === '/login') return 'login';
  if (path === '/perfil') return 'perfil';
  if (path === '/admin') return 'admin:panel';
  if (path.startsWith('/admin/')) return `admin:${path}`;
  return null;
}

function resolveKey(pathnameOrKey) {
  if (!pathnameOrKey) return null;
  if (pathnameOrKey.startsWith('/')) {
    return getRouteCacheKey(pathnameOrKey);
  }
  return pathnameOrKey;
}

export function isPageInstantReady(pathnameOrKey) {
  const key = resolveKey(pathnameOrKey);
  return key ? revealed.has(key) : false;
}

export function markPageRevealed(pathnameOrKey) {
  const key = resolveKey(pathnameOrKey);
  if (key) revealed.add(key);
}
