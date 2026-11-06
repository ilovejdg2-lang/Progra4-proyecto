import { useSyncExternalStore } from "react";

import { createWindowEventSubscribe } from "../lib/windowEventStore";
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
const subscribeToEvents = createWindowEventSubscribe([SESSION_UPDATED_EVENT, "storage"], {
  beforeNotify: getActiveSessionUser,
});

function subscribe(onChange) {
  const unsubscribe = subscribeToEvents(onChange);
  getActiveSessionUser();
  return unsubscribe;
}

/** Active session user; re-renders when the session changes. */
export function useSessionUser() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
