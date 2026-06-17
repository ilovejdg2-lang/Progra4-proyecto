export function isChromelessRoute(pathname = location.pathname) {
  return pathname.startsWith('/admin') || pathname === '/login' || pathname === '/perfil';
}

export function normalizePathname(pathname = location.pathname) {
  const path = String(pathname || '/');
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }
  return path;
}

export function getSiteBootMessage(pathname = normalizePathname()) {
  const path = normalizePathname(pathname);
  if (path === '/') return 'Cargando inicio...';
  if (path === '/productos') return 'Cargando productos...';
  if (path === '/AboutUs') return 'Cargando sobre nosotros...';
  if (path.startsWith('/voluntariado')) return 'Cargando voluntariado...';
  if (path === '/checkout') return 'Cargando checkout...';
  if (path === '/login') return 'Cargando...';
  if (path === '/perfil') return 'Cargando perfil...';
  if (path.startsWith('/admin')) return 'Cargando panel administrativo...';
  return 'Cargando página...';
}

export function isAdminBootRoute(pathname = normalizePathname()) {
  return normalizePathname(pathname).startsWith('/admin');
}

export function isRouteLoadingActive() {
  return document.body.classList.contains('app-route-loading')
    || document.body.classList.contains('admin-route-loading-active')
    || document.documentElement.classList.contains('home-page-loading')
    || document.body.classList.contains('home-page-loading');
}

export function setAdminBootLoading(active) {
  document.documentElement.classList.toggle('admin-boot-loading', active);
  document.body.classList.toggle('admin-boot-loading', active);
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

export function setSiteBootLoading(active) {
  if (isChromelessRoute()) return;
  document.documentElement.classList.toggle('site-boot-loading', active);
  document.body.classList.toggle('site-boot-loading', active);
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

export function initSiteBootLoading() {
  const path = normalizePathname();
  if (isChromelessRoute(path)) return;

  document.documentElement.classList.add('site-boot-loading');
  document.body.classList.add('site-boot-loading');

  if (path === '/') {
    document.documentElement.classList.add('home-page-loading');
    document.body.classList.add('home-page-loading');
  }

  const label = document.getElementById('site-boot-message');
  if (label) label.textContent = getSiteBootMessage(path);
}
