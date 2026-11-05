import { useSyncExternalStore } from "react";

import { ADMIN_THEME_CHANGED_EVENT, isAdminThemeDark } from "../lib/adminTheme";

function subscribe(onChange) {
  window.addEventListener(ADMIN_THEME_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(ADMIN_THEME_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** true while the admin theme is dark; re-renders on theme changes. */
export function useAdminThemeDark() {
  return useSyncExternalStore(subscribe, isAdminThemeDark, isAdminThemeDark);
}
