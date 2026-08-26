import { useCallback, useEffect, useRef, useState } from "react";

import { obtenerStockPorUbicacion } from "../services/productosService";

const INITIAL_STATE = { data: [], status: "idle", error: null };

export function useLocationStock(locationCode, { enabled = true } = {}) {
  const [state, setState] = useState(INITIAL_STATE);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;

    if (!enabled || !locationCode) {
      setState(INITIAL_STATE);
      return;
    }

    setState({ data: [], status: "loading", error: null });
    try {
      const data = await obtenerStockPorUbicacion(locationCode);
      if (requestId.current !== currentRequestId) return;
      setState({ data, status: "success", error: null });
    } catch (error) {
      if (requestId.current !== currentRequestId) return;
      setState((current) => ({
        ...current,
        status: "error",
        error: error instanceof Error ? error : new Error("No se pudo cargar el stock del punto de venta."),
      }));
    }
  }, [enabled, locationCode]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    ...state,
    loading: state.status === "loading",
    retry: load,
  };
}
