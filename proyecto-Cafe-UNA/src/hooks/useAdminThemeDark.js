import { useSyncExternalStore } from "react";

import { ADMIN_THEME_CHANGED_EVENT, isAdminThemeDark } from "../lib/adminTheme";
import { createWindowEventSubscribe } from "../lib/windowEventStore";

const subscribe = createWindowEventSubscribe([ADMIN_THEME_CHANGED_EVENT, "storage"]);

/** true while the admin theme is dark; re-renders on theme changes. */
export function useAdminThemeDark() {
  return useSyncExternalStore(subscribe, isAdminThemeDark, isAdminThemeDark);
}
