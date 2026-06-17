import { useLayoutEffect, useRef, useState } from 'react';
import { isPageInstantReady } from '../lib/pageSessionState';

/**
 * Espera a que el nodo referenciado tenga layout antes de marcar la página como pintada.
 * Útil en páginas sin fetch propio que deben ocultar el loader hasta que el DOM esté listo.
 */
export function usePagePaintReady(cacheKey) {
  const ref = useRef(null);
  const instant = isPageInstantReady(cacheKey);
  const [paintReady, setPaintReady] = useState(instant);

  useLayoutEffect(() => {
    if (instant) return undefined;

    let cancelled = false;
    let attempts = 0;

    const markReady = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!cancelled) setPaintReady(true);
        });
      });
    };

    const check = () => {
      if (cancelled) return;
      attempts += 1;

      const node = ref.current;
      if (node && node.getBoundingClientRect().height > 0) {
        markReady();
        return;
      }

      if (attempts < 40) {
        requestAnimationFrame(check);
      } else {
        markReady();
      }
    };

    requestAnimationFrame(check);

    return () => {
      cancelled = true;
    };
  }, [cacheKey, instant]);

  return {
    ref,
    paintReady,
    showPrepaint: !instant && !paintReady,
  };
}
