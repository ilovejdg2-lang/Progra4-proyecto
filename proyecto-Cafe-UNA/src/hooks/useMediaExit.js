import { useEffect, useEffectEvent } from "react";

/**
 * While `active`, calls `onExit` as soon as the media query stops matching (or right away
 * if it does not match). Used to dismiss UI that CSS hides above a breakpoint, so a hidden
 * modal cannot keep the page inert.
 */
export function useMediaExit(query, active, onExit) {
  const exit = useEffectEvent(onExit);

  useEffect(() => {
    if (!active || typeof window === "undefined" || !window.matchMedia) return undefined;
    const mql = window.matchMedia(query);
    if (!mql.matches) {
      exit();
      return undefined;
    }
    const onChange = (event) => {
      if (!event.matches) exit();
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query, active]);
}
