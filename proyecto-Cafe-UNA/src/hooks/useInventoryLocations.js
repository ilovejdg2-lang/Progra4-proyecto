import { useCallback, useEffect, useState } from "react";

import { obtenerUbicaciones } from "../services/productosService";

const INITIAL_STATE = { data: [], status: "idle", error: null };

function onlyPointOfSaleLocations(locations) {
  return (Array.isArray(locations) ? locations : [])
    .filter((location) => location?.code && location.code !== "BODEGA_CENTRAL")
    .sort((a, b) => String(a.name || a.code).localeCompare(String(b.name || b.code), "es"));
}

export function useInventoryLocations({ enabled = true } = {}) {
  const [state, setState] = useState(INITIAL_STATE);

  const load = useCallback(async () => {
    if (!enabled) return;

    setState((current) => ({ ...current, status: "loading", error: null }));
    try {
      const locations = await obtenerUbicaciones();
      setState({
        data: onlyPointOfSaleLocations(locations),
        status: "success",
        error: null,
      });
    } catch (error) {
      setState({
        data: [],
        status: "error",
        error: error instanceof Error ? error : new Error("No se pudieron cargar los puntos de venta."),
      });
    }
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    ...state,
    loading: state.status === "loading",
    retry: load,
  };
}
