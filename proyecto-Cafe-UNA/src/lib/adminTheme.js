export const ADMIN_THEME_STORAGE_KEY = "admin-color-theme";
export const ADMIN_THEME_CHANGED_EVENT = "admin-theme-changed";

export function readAdminTheme() {
  if (typeof window === "undefined") return "light";
  return window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
}

export function isAdminThemeDark() {
  return readAdminTheme() === "dark";
}

export function applyAdminDocumentTheme(isAdminRoute) {
  if (typeof document === "undefined") return "light";
  const theme = isAdminRoute && isAdminThemeDark() ? "dark" : "light";
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.classList.toggle("admin-theme-dark", theme === "dark");
  return theme;
}

const THEME_REVEAL_MS = 680;
let themeFallbackTimer = 0;

function prefersReducedMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function animateThemeFallback(apply) {
  const root = document.documentElement;
  const alreadyAnimating = root.classList.contains("admin-theme-animating");
  root.classList.add("admin-theme-animating");
  if (!alreadyAnimating) void root.offsetWidth;
  apply();
  window.clearTimeout(themeFallbackTimer);
  themeFallbackTimer = window.setTimeout(() => {
    root.classList.remove("admin-theme-animating");
  }, THEME_REVEAL_MS + 40);
}

function placeThemeRevealOrigin(origin) {
  const root = document.documentElement;
  const x = Number.isFinite(origin?.x) ? origin.x : window.innerWidth / 2;
  const y = Number.isFinite(origin?.y) ? origin.y : 28;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );
  root.style.setProperty("--admin-theme-x", `${x}px`);
  root.style.setProperty("--admin-theme-y", `${y}px`);
  root.style.setProperty("--admin-theme-r", `${Math.ceil(radius + 12)}px`);
}

export function setAdminTheme(theme) {
  const next = theme === "dark" ? "dark" : "light";
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent(ADMIN_THEME_CHANGED_EVENT, { detail: next }));
  }
  applyAdminDocumentTheme(true);
  return next;
}

export function toggleAdminTheme() {
  return setAdminTheme(isAdminThemeDark() ? "light" : "dark");
}

export function transitionAdminTheme(apply, origin) {
  if (typeof document === "undefined" || prefersReducedMotion()) {
    apply();
    return;
  }

  const startViewTransition = document.startViewTransition?.bind(document);
  if (typeof startViewTransition !== "function") {
    animateThemeFallback(apply);
    return;
  }

  const root = document.documentElement;
  placeThemeRevealOrigin(origin);
  root.classList.add("admin-theme-vt");

  let transition;
  try {
    transition = startViewTransition(() => {
      apply();
    });
  } catch {
    root.classList.remove("admin-theme-vt");
    apply();
    return;
  }

  transition.finished?.finally?.(() => {
    root.classList.remove("admin-theme-vt");
  });
}
