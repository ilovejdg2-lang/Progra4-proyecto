import { useCallback, useEffect, useRef, useState } from "react";
import { readPageCache, readStalePageCache, writePageCache } from "../lib/pageDataCache";
import { IDIOMA_CHANGED_EVENT } from "../lib/idioma";

/**
 * Carga datos de página con caché de sesión.
 * Al cambiar idioma, vuelve a pedir datos frescos (incluye campos *En).
 */
export function useCachedPageData(cacheKey, fetcher) {
  const cachedInitial = useRef(readPageCache(cacheKey) ?? readStalePageCache(cacheKey));
  const hadFreshCache = useRef(Boolean(readPageCache(cacheKey)));
  const [data, setData] = useState(cachedInitial.current);
  const [status, setStatus] = useState(cachedInitial.current ? "ready" : "loading");
  const [error, setError] = useState("");

  const applyFresh = useCallback(
    (fresh) => {
      writePageCache(cacheKey, fresh);
      cachedInitial.current = fresh;
      hadFreshCache.current = true;
      setData(fresh);
      setError("");
      setStatus("ready");
    },
    [cacheKey],
  );

  const reload = useCallback(async () => {
    setStatus(cachedInitial.current ? "ready" : "loading");
    setError("");

    try {
      const fresh = await fetcher();
      applyFresh(fresh);
    } catch (err) {
      const stale = readStalePageCache(cacheKey);
      if (stale) {
        cachedInitial.current = stale;
        setData(stale);
        setError("");
        setStatus("ready");
        return;
      }
      setError(err?.message || "No se pudo cargar la página.");
      setStatus("error");
    }
  }, [applyFresh, cacheKey, fetcher]);

  useEffect(() => {
    let activo = true;

    async function load() {
      if (hadFreshCache.current && cachedInitial.current) {
        fetcher()
          .then((fresh) => {
            if (!activo) return;
            applyFresh(fresh);
          })
          .catch(() => {});
        return;
      }

      setStatus("loading");
      try {
        const fresh = await fetcher();
        if (!activo) return;
        applyFresh(fresh);
      } catch (err) {
        if (!activo) return;
        const stale = readStalePageCache(cacheKey);
        if (stale) {
          cachedInitial.current = stale;
          setData(stale);
          setStatus("ready");
          return;
        }
        setError(err?.message || "No se pudo cargar la página.");
        setStatus("error");
      }
    }

    load();

    return () => {
      activo = false;
    };
  }, [cacheKey, fetcher, applyFresh]);

  useEffect(() => {
    const onIdioma = () => {
      hadFreshCache.current = false;
      void reload();
    };
    window.addEventListener(IDIOMA_CHANGED_EVENT, onIdioma);
    return () => window.removeEventListener(IDIOMA_CHANGED_EVENT, onIdioma);
  }, [reload]);

  return { data, status, error, reload };
}
