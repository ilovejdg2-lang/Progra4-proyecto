import { useLayoutEffect, useState } from 'react';
import { endRouteLoading } from '../lib/routeLoadingLock';
import { isPageInstantReady, markPageRevealed } from '../lib/pageSessionState';

/**
 * Muestra loader en primera visita o tras refresh (memoria vacía).
 * Con caché de datos pero sin memoria de sesión, mantiene el loader hasta pintar.
 * Si la página ya se visitó en esta pestaña, no muestra loader.
 */
export function usePublicPageLoadingGate(cacheKey, isReady) {
  const instant = isPageInstantReady(cacheKey);
  const [revealed, setRevealed] = useState(instant);

  useLayoutEffect(() => {
    if (instant) {
      endRouteLoading(cacheKey);
      return undefined;
    }

    if (!isReady) {
      setRevealed(false);
      return undefined;
    }

    let cancelled = false;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled) return;
        markPageRevealed(cacheKey);
        endRouteLoading(cacheKey);
        setRevealed(true);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, instant, isReady]);

  if (instant) return false;
  if (!isReady) return true;
  return !revealed;
}
