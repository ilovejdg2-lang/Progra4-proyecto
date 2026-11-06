import { useCallback, useEffect, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

import {
  ADMIN_THEME_CHANGED_EVENT,
  applyAdminDocumentTheme,
  readAdminTheme,
  toggleAdminTheme as toggleStoredAdminTheme,
  transitionAdminTheme,
} from "../lib/adminTheme";
import { createWindowEventSubscribe } from "../lib/windowEventStore";

const subscribe = createWindowEventSubscribe([ADMIN_THEME_CHANGED_EVENT, "storage"]);

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
