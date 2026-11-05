import { useSyncExternalStore } from "react";

import { getActiveSessionUser, SESSION_UPDATED_EVENT } from "../services/sessionService";

const UNSET = Symbol("unset");
let cachedKey = UNSET;
let cachedUser = null;

// getActiveSessionUser() parses localStorage on every call, so it returns a new
// object each time. Cache by serialized content to give React a stable snapshot.
function getSnapshot() {
  const user = getActiveSessionUser() ?? null;
  const key = JSON.stringify(user);
  if (key !== cachedKey) {
    cachedKey = key;
    cachedUser = user;
  }
  return cachedUser;
}

function subscribe(onChange) {
  window.addEventListener(SESSION_UPDATED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SESSION_UPDATED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Active session user; re-renders when the session changes. */
export function useSessionUser() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
