/**
 * Builds a `subscribe` for useSyncExternalStore backed by window events, with ONE
 * shared window listener per event no matter how many components subscribe.
 *
 * Why shared: when the browser dispatches a native event (e.g. `storage` from
 * another tab) microtasks run between listeners. With one listener per consumer,
 * each consumer's store update would flush its own synchronous render and commit,
 * and dozens of consecutive commits trip React's "Maximum update depth exceeded".
 * A single listener notifies every subscriber inside one callback, so React batches
 * them into one render.
 *
 * `beforeNotify` runs once per event, before subscribers are notified.
 */
export function createWindowEventSubscribe(eventNames, { beforeNotify } = {}) {
  const subscribers = new Set();

  const handle = () => {
    beforeNotify?.();
    for (const notify of [...subscribers]) notify();
  };

  return function subscribe(onChange) {
    if (subscribers.size === 0) {
      for (const name of eventNames) window.addEventListener(name, handle);
    }
    subscribers.add(onChange);

    return () => {
      subscribers.delete(onChange);
      if (subscribers.size === 0) {
        for (const name of eventNames) window.removeEventListener(name, handle);
      }
    };
  };
}
