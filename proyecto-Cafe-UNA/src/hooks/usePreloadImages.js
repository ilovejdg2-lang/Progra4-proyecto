import { useEffect, useState } from 'react';

const MAX_WAIT_MS = 15000;
const preloadedUrls = new Set();
let fontsLoadedOnce = false;

export function areAllImagesPreloaded(urls) {
  const unique = [...new Set(urls.filter(Boolean))];
  if (!unique.length) return true;
  return unique.every((url) => preloadedUrls.has(url));
}

export function markImagesPreloaded(urls) {
  urls.filter(Boolean).forEach((url) => preloadedUrls.add(url));
}

function preloadOne(url) {
  if (preloadedUrls.has(url)) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.referrerPolicy = 'no-referrer';

    const finish = () => {
      preloadedUrls.add(url);
      resolve(true);
    };
    const timeoutId = window.setTimeout(finish, MAX_WAIT_MS);

    const complete = async () => {
      window.clearTimeout(timeoutId);
      try {
        if (typeof image.decode === 'function') {
          await image.decode();
        }
      } catch {
        // decode puede fallar aunque la imagen esté cargada
      }
      finish();
    };

    image.onload = () => {
      complete();
    };
    image.onerror = () => {
      window.clearTimeout(timeoutId);
      finish();
    };
    image.src = url;

    if (image.complete && image.naturalWidth > 0) {
      complete();
    }
  });
}

/** Precarga un listado de imágenes en paralelo antes de mostrar la página. */
export function usePreloadImages(urls) {
  const key = urls.join('\0');
  const [ready, setReady] = useState(() => areAllImagesPreloaded(urls) || !urls.length);

  useEffect(() => {
    const unique = [...new Set(urls.filter(Boolean))];

    if (!unique.length) {
      setReady(true);
      return undefined;
    }

    if (areAllImagesPreloaded(unique)) {
      setReady(true);
      return undefined;
    }

    let cancelled = false;
    setReady(false);

    Promise.all(unique.map((url) => preloadOne(url))).then(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return ready;
}

/** Espera imágenes críticas y fuentes web antes de revelar la página. */
export function useHomeVisualReady(imageUrls, enabled) {
  const imagesReady = usePreloadImages(enabled ? imageUrls : []);
  const [fontsReady, setFontsReady] = useState(() => fontsLoadedOnce);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    if (fontsLoadedOnce) {
      setFontsReady(true);
      return undefined;
    }

    let cancelled = false;

    document.fonts.ready
      .then(() => {
        if (!cancelled) {
          fontsLoadedOnce = true;
          setFontsReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          fontsLoadedOnce = true;
          setFontsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, imageUrls.join('\0')]);

  if (!enabled) return false;
  return imagesReady && fontsReady;
}
