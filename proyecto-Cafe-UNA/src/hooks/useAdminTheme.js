import { useCallback, useEffect, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

import {
  ADMIN_THEME_CHANGED_EVENT,
  applyAdminDocumentTheme,
  readAdminTheme,
  toggleAdminTheme as toggleStoredAdminTheme,
  transitionAdminTheme,
} from "../lib/adminTheme";

function subscribe(onChange) {
  window.addEventListener(ADMIN_THEME_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(ADMIN_THEME_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useAdminTheme() {
  const theme = useSyncExternalStore(subscribe, readAdminTheme, readAdminTheme);

  useEffect(() => {
    applyAdminDocumentTheme(true);
  }, []);

  const toggleTheme = useCallback((origin) => {
    transitionAdminTheme(() => {
      flushSync(() => {
        toggleStoredAdminTheme();
      });
    }, origin);
  }, []);

  return {
    theme,
    isDark: theme === "dark",
    toggleTheme,
  };
}
