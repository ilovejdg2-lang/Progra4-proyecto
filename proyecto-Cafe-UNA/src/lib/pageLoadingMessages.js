import { textoIdioma } from './idioma';
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

function msg(es) {
  return textoIdioma(es);
}

export function getLoadingMessageForCacheKey(cacheKey) {
  if (!cacheKey) return msg('Cargando página...');
  if (cacheKey.startsWith('admin:')) {
    return getLoadingMessageForPathname(cacheKey.slice('admin:'.length) || '/admin');
  }
  return msg(CACHE_KEY_MESSAGES[cacheKey] ?? 'Cargando página...');
}

export function getLoadingMessageForPathname(pathname = normalizePathname()) {
  const path = normalizePathname(pathname);

  if (path === '/') return msg(CACHE_KEY_MESSAGES.home);
  if (path === '/productos') return msg(CACHE_KEY_MESSAGES.products);
  if (path.startsWith('/productos/')) return msg(CACHE_KEY_MESSAGES['product-detail']);
  if (path === '/AboutUs' || path.startsWith('/AboutUs/')) {
    return path.toLowerCase().includes('/galeria')
      ? msg('Cargando galería...')
      : msg(CACHE_KEY_MESSAGES.about);
  }
  if (path.startsWith('/voluntariado')) return msg(CACHE_KEY_MESSAGES.voluntariado);
  if (path === '/checkout') return msg(CACHE_KEY_MESSAGES.checkout);
  if (path === '/login') return msg(CACHE_KEY_MESSAGES.login);
  if (path === '/perfil') return msg(CACHE_KEY_MESSAGES.perfil);
  if (path.startsWith('/admin')) return msg('Cargando panel administrativo...');

  return msg('Cargando página...');
}
