import { useSyncExternalStore } from "react";

import { getActiveSessionUser, peekSessionUser, SESSION_UPDATED_EVENT } from "../services/sessionService";

const UNSET = Symbol("unset");
let cachedKey = UNSET;
let cachedUser = null;

// peekSessionUser() is pure but parses localStorage on every call, so it returns a
// new object each time. Cache by serialized content to give React a stable snapshot.
function getSnapshot() {
  const user = peekSessionUser() ?? null;
  const key = JSON.stringify(user);
  if (key !== cachedKey) {
    cachedKey = key;
    cachedUser = user;
  }
  return cachedUser;
}

// Session maintenance (clear on expiry, throttled touch) can write storage and
// dispatch events, so it runs here in the subscription phase, never in render.
function subscribe(onChange) {
  const handle = () => {
    getActiveSessionUser();
    onChange();
  };
  window.addEventListener(SESSION_UPDATED_EVENT, handle);
  window.addEventListener("storage", handle);
  getActiveSessionUser();
  return () => {
    window.removeEventListener(SESSION_UPDATED_EVENT, handle);
    window.removeEventListener("storage", handle);
  };
}

/** Active session user; re-renders when the session changes. */
export function useSessionUser() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
