import { useCallback, useEffect, useState } from "react";

import {
  ADMIN_THEME_CHANGED_EVENT,
  applyAdminDocumentTheme,
  readAdminTheme,
  toggleAdminTheme as toggleStoredAdminTheme,
} from "../lib/adminTheme";

export function useAdminTheme() {
  const [theme, setTheme] = useState(() => readAdminTheme());

  useEffect(() => {
    applyAdminDocumentTheme(true);
    const sync = () => setTheme(readAdminTheme());
    window.addEventListener(ADMIN_THEME_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ADMIN_THEME_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(toggleStoredAdminTheme());
  }, []);

  return {
    theme,
    isDark: theme === "dark",
    toggleTheme,
  };
}
