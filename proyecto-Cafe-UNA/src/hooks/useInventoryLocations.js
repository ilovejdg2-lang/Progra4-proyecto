import { useCallback, useEffect, useState } from "react";

import { obtenerUbicaciones } from "../services/productosService";

const INITIAL_STATE = { data: [], status: "idle", error: null, refreshing: false };

function onlyPointOfSaleLocations(locations) {
  return (Array.isArray(locations) ? locations : [])
    .filter((location) => location?.code && location.code !== "BODEGA_CENTRAL")
    .sort((a, b) => String(a.name || a.code).localeCompare(String(b.name || b.code), "es"));
}

export function useInventoryLocations({ enabled = true } = {}) {
  const [state, setState] = useState(INITIAL_STATE);

  const load = useCallback(async () => {
    if (!enabled) return;

    // A refetch keeps the current data on screen: only the first load (or a retry after an error) is "loading".
    setState((current) => (current.status === "success"
      ? { ...current, error: null, refreshing: true }
      : { ...current, status: "loading", error: null, refreshing: false }));
    try {
      const locations = await obtenerUbicaciones();
      setState({
        data: onlyPointOfSaleLocations(locations),
        status: "success",
        error: null,
        refreshing: false,
      });
    } catch (error) {
      setState({
        data: [],
        status: "error",
        error: error instanceof Error ? error : new Error("No se pudieron cargar los puntos de venta."),
        refreshing: false,
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
