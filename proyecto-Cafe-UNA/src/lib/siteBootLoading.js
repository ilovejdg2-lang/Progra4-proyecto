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
    || document.body.classList.contains('home-page-loading')
    || document.documentElement.classList.contains('site-boot-loading')
    || document.body.classList.contains('site-boot-loading')
    || document.documentElement.classList.contains('admin-boot-loading')
    || document.body.classList.contains('admin-boot-loading');
}

function readCachedLogoUrl() {
  try {
    const raw = localStorage.getItem('cafe-una-brand-logos');
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    return String(parsed?.logoUrl || parsed?.logoClaroUrl || '').trim();
  } catch {
    return '';
  }
}

function paintLoaderLogo(mark, logoUrl) {
  if (!mark || !logoUrl) return;
  mark.innerHTML = '';
  const img = document.createElement('img');
  img.className = 'site-initial-logo';
  img.alt = '';
  img.decoding = 'async';
  img.src = logoUrl;
  img.onerror = () => {
    mark.innerHTML =
      '<p class="site-initial-wordmark" id="site-boot-wordmark">Café UNA</p>';
  };
  mark.appendChild(img);
}

/** Garantiza el overlay HTML con logo — nunca pantalla en blanco. */
export function ensureInitialLoaderVisible(message, { admin = false } = {}) {
  let loader = document.getElementById('site-initial-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'site-initial-loader';
    loader.setAttribute('role', 'status');
    loader.setAttribute('aria-live', 'polite');
    loader.innerHTML = `
      <div class="site-initial-mark" id="site-boot-mark">
        <p class="site-initial-wordmark" id="site-boot-wordmark">Café UNA</p>
      </div>
      <div class="site-initial-spinner" aria-hidden="true"></div>
      <p id="site-boot-message">Cargando página...</p>
    `;
    document.body.prepend(loader);
  }

  loader.classList.toggle('site-initial-loader--admin', admin);
  loader.hidden = false;
  loader.style.display = 'flex';

  const label = document.getElementById('site-boot-message');
  if (label && message) label.textContent = message;

  const mark = document.getElementById('site-boot-mark');
  const logoUrl = readCachedLogoUrl();
  if (logoUrl) paintLoaderLogo(mark, logoUrl);

  if (admin) {
    document.documentElement.classList.add('admin-boot-loading');
    document.body.classList.add('admin-boot-loading');
  } else {
    document.documentElement.classList.add('site-boot-loading');
    document.body.classList.add('site-boot-loading');
  }
}

export function hideInitialLoader({ force = false } = {}) {
  // No ocultar si la ruta aún pide overlay (evita blanco con shell escondido).
  if (
    !force
    && (
      document.body.classList.contains('app-route-loading')
      || document.body.classList.contains('admin-route-loading-active')
    )
  ) {
    return;
  }

  const loader = document.getElementById('site-initial-loader');
  if (loader) {
    loader.hidden = true;
    loader.style.removeProperty('display');
    loader.style.display = 'none';
  }
  document.documentElement.classList.remove(
    'site-boot-loading',
    'admin-boot-loading',
    'home-page-loading',
  );
  document.body.classList.remove(
    'site-boot-loading',
    'admin-boot-loading',
    'home-page-loading',
  );
}

export function removeAdminBootLoading() {
  hideInitialLoader();
}

export function finishAdminBootLoading() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (document.body.classList.contains('admin-route-loading-active')) return;
      if (document.body.classList.contains('app-route-loading')) return;
      hideInitialLoader();
    });
  });
}

export function removeSiteBootLoading() {
  hideInitialLoader();
}

/** Quita el loader HTML solo si no hay otro loader activo y tras pintar el contenido. */
export function finishSiteBootLoading() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (isRouteLoadingActive()) return;
      hideInitialLoader();
    });
  });
}
