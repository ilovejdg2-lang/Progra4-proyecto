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
