import { useLayoutEffect, useRef, useState } from 'react';
import { isPageInstantReady } from '../lib/pageSessionState';
import { usePublicPageLoadingGate } from './usePublicPageLoadingGate';
import { getLoadingMessageForCacheKey } from '../lib/pageLoadingMessages';

function usePagePaintReady(cacheKey) {
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

export function usePaintPublicPage(cacheKey) {
  const { ref, paintReady, showPrepaint } = usePagePaintReady(cacheKey);
  const showLoading = usePublicPageLoadingGate(cacheKey, paintReady);

  return {
    ref,
    showLoading,
    showPrepaint,
    inert: showLoading || showPrepaint || undefined,
    loadingMessage: getLoadingMessageForCacheKey(cacheKey),
  };
}
