import {
  getRouteCacheKey,
  isPageInstantReady,
} from './pageSessionState';
import {
  ensureInitialLoaderVisible,
  getSiteBootMessage,
  hideInitialLoader,
} from './siteBootLoading';
import { normalizePathname } from './paths';

let activeKey = null;
let activeMode = null;

function resolveLockKey(key) {
  if (key == null || key === '') return null;
  if (typeof key !== 'string') return String(key);
  if (key.startsWith('/')) {
    return getRouteCacheKey(key) || normalizePathname(key);
  }
  if (key === 'home' || key.startsWith('admin:') || !key.includes('/')) {
    return key;
  }
  return getRouteCacheKey(key) || key;
}

function applyModeClasses(mode) {
  document.body.classList.remove('app-route-loading');
  document.body.classList.remove('admin-route-loading-active');
  document.documentElement.classList.remove('home-page-loading');
  document.body.classList.remove('home-page-loading');

  if (mode === 'admin') {
    document.body.classList.add('admin-route-loading-active');
    return;
  }

  document.body.classList.add('app-route-loading');
  if (mode === 'home') {
    document.documentElement.classList.add('home-page-loading');
    document.body.classList.add('home-page-loading');
  }
}

/** Activa el overlay de ruta antes del paint (nunca pantalla en blanco). */
export function beginRouteLoading(key, mode = 'site') {
  const resolved = resolveLockKey(key);
  if (!resolved) return;
  if (isPageInstantReady(resolved)) {
    endRouteLoading(resolved);
    return;
  }
  activeKey = resolved;
  activeMode = mode;

  const pathname =
    typeof key === 'string' && key.startsWith('/')
      ? key
      : normalizePathname();
  ensureInitialLoaderVisible(getSiteBootMessage(pathname), {
    admin: mode === 'admin',
  });
  applyModeClasses(mode);
}

export function endRouteLoading(key) {
  const resolved = key == null ? null : resolveLockKey(key);
  // Si hay lock activo y la clave no coincide, no liberar (evita carreras entre rutas).
  // Excepción: si ambas resuelven al mismo cache key lógico, sí liberar.
  if (activeKey != null && resolved != null && activeKey !== resolved) {
    const activeResolved = resolveLockKey(activeKey);
    if (activeResolved !== resolved) return;
  }

  activeKey = null;
  activeMode = null;

  document.body.classList.remove('app-route-loading');
  document.body.classList.remove('admin-route-loading-active');
  document.documentElement.classList.remove('home-page-loading');
  document.body.classList.remove('home-page-loading');

  hideInitialLoader({ force: true });
}

export function isRouteLoadingLocked(key) {
  if (!activeKey) return false;
  if (key == null) return true;
  return activeKey === resolveLockKey(key);
}

export function getActiveRouteLoadingKey() {
  return activeKey;
}

export function getActiveRouteLoadingMode() {
  return activeMode;
}
