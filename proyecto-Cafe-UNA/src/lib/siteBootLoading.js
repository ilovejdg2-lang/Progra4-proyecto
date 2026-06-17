import { getLoadingMessageForPathname } from './pageLoadingMessages';
import { normalizePathname } from './paths';

export { normalizePathname } from './paths';
export { getLoadingMessageForPathname, getLoadingMessageForCacheKey } from './pageLoadingMessages';

export function getSiteBootMessage(pathname = normalizePathname()) {
  return getLoadingMessageForPathname(pathname);
}

export function isRouteLoadingActive() {
  return document.body.classList.contains('app-route-loading')
    || document.body.classList.contains('admin-route-loading-active')
    || document.documentElement.classList.contains('home-page-loading')
    || document.body.classList.contains('home-page-loading');
}

export function removeAdminBootLoading() {
  document.documentElement.classList.remove('admin-boot-loading');
  document.body.classList.remove('admin-boot-loading');
  document.getElementById('site-initial-loader')?.remove();
}

export function finishAdminBootLoading() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (document.body.classList.contains('admin-route-loading-active')) return;
      removeAdminBootLoading();
    });
  });
}

export function removeSiteBootLoading() {
  document.documentElement.classList.remove('site-boot-loading');
  document.body.classList.remove('site-boot-loading');
  document.getElementById('site-initial-loader')?.remove();
}

/** Quita el loader HTML solo si no hay otro loader activo y tras pintar el contenido. */
export function finishSiteBootLoading() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (isRouteLoadingActive()) return;
      removeSiteBootLoading();
    });
  });
}
