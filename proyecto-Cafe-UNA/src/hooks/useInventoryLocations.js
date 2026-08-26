import { useCallback, useEffect, useState } from "react";

import { obtenerUbicaciones } from "../services/productosService";

export const POS_LOCATION_CODES = Object.freeze([
  "POS_FUNA_UNA",
  "POS_EDITORIAL",
  "POS_STAND_FERIAS",
]);

const INITIAL_STATE = { data: [], status: "idle", error: null };

function onlyPointOfSaleLocations(locations) {
  const byCode = new Map(
    (Array.isArray(locations) ? locations : [])
      .filter((location) => POS_LOCATION_CODES.includes(location?.code))
      .map((location) => [location.code, location]),
  );

  return POS_LOCATION_CODES
    .map((code) => byCode.get(code))
    .filter(Boolean);
}

export function useInventoryLocations({ enabled = true } = {}) {
  const [state, setState] = useState(INITIAL_STATE);

  const load = useCallback(async () => {
    if (!enabled) return;

    setState((current) => ({ ...current, status: "loading", error: null }));
    try {
      const locations = await obtenerUbicaciones();
      setState({ data: onlyPointOfSaleLocations(locations), status: "success", error: null });
    } catch (error) {
      setState((current) => ({
        ...current,
        status: "error",
        error: error instanceof Error ? error : new Error("No se pudieron cargar los puntos de venta."),
      }));
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
