/** Nombres de pestaña para reutilizar inicio ↔ panel admin (sin duplicar). */

export const SITE_WINDOW_NAME = "cafe-una-site";
export const ADMIN_WINDOW_NAME = "cafe-una-admin";

export function claimWindowRole(role) {
  if (typeof window === "undefined") return;
  const next = role === "admin" ? ADMIN_WINDOW_NAME : SITE_WINDOW_NAME;
  if (window.name !== next) {
    window.name = next;
  }
}

export function siteHomeHref() {
  if (typeof window === "undefined") return "/";
  return new URL("/", window.location.origin).href;
}

export function adminPanelHref(path = "/admin") {
  if (typeof window === "undefined") return path;
  const target = String(path || "/admin").startsWith("/") ? path : "/admin";
  return new URL(target, window.location.origin).href;
}

/** Abre o enfoca la pestaña del sitio (mismo nombre). Debe llamarse en un gesto del usuario. */
export function openOrFocusSiteHome() {
  if (typeof window === "undefined") return null;
  return window.open(siteHomeHref(), SITE_WINDOW_NAME);
}

/** Abre o enfoca la pestaña del panel admin. Debe llamarse en un gesto del usuario. */
export function openOrFocusAdminPanel(path = "/admin") {
  if (typeof window === "undefined") return null;
  claimWindowRole("site");
  return window.open(adminPanelHref(path), ADMIN_WINDOW_NAME);
}

/**
 * Desde el panel admin: vuelve a la pestaña de inicio (si ya existía) y cierra esta.
 * Si el navegador no deja cerrar la pestaña, navega al inicio en la actual.
 */
export function leaveAdminTabToSiteHome({ navigate, pathname, goHomeInPlace }) {
  if (typeof window === "undefined") {
    goHomeInPlace?.(navigate, pathname);
    return;
  }

  claimWindowRole("admin");
  openOrFocusSiteHome();

  try {
    window.close();
  } catch {
    // ignore
  }

  // Si seguimos abiertos (pestaña no abierta por script / bloqueo del navegador), ir al inicio aquí.
  window.setTimeout(() => {
    if (typeof window === "undefined" || window.closed) return;
    goHomeInPlace?.(navigate, pathname);
  }, 0);
}
