import { normalizePathname } from './paths';

const CACHE_KEY_MESSAGES = {
  home: 'Cargando inicio...',
  products: 'Cargando productos...',
  'product-detail': 'Cargando producto...',
  about: 'Cargando sobre nosotros...',
  voluntariado: 'Cargando voluntariado...',
  checkout: 'Cargando checkout...',
  login: 'Cargando...',
  perfil: 'Cargando perfil...',
};

export function getLoadingMessageForCacheKey(cacheKey) {
  if (!cacheKey) return 'Cargando página...';
  if (cacheKey.startsWith('admin:')) {
    return getLoadingMessageForPathname(cacheKey.slice('admin:'.length) || '/admin');
  }
  return CACHE_KEY_MESSAGES[cacheKey] ?? 'Cargando página...';
}

export function getLoadingMessageForPathname(pathname = normalizePathname()) {
  const path = normalizePathname(pathname);

  if (path === '/') return CACHE_KEY_MESSAGES.home;
  if (path === '/productos') return CACHE_KEY_MESSAGES.products;
  if (path.startsWith('/productos/')) return CACHE_KEY_MESSAGES['product-detail'];
  if (path === '/AboutUs') return CACHE_KEY_MESSAGES.about;
  if (path.startsWith('/voluntariado')) return CACHE_KEY_MESSAGES.voluntariado;
  if (path === '/checkout') return CACHE_KEY_MESSAGES.checkout;
  if (path === '/login') return CACHE_KEY_MESSAGES.login;
  if (path === '/perfil') return CACHE_KEY_MESSAGES.perfil;
  if (path.startsWith('/admin')) return 'Cargando panel administrativo...';

  return 'Cargando página...';
}
