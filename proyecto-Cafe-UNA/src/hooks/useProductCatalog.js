import { useCallback, useEffect, useState } from "react";

import { obtenerCatalogoProductos } from "../services/productosService";

const INITIAL_STATE = {
  data: [],
  status: "idle",
  error: null,
};

export function useProductCatalog({ enabled = true } = {}) {
  const [state, setState] = useState(INITIAL_STATE);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!enabled) return;

    setState((current) => ({
      ...current,
      status: silent && current.status === "success" ? "success" : "loading",
      error: null,
    }));
    try {
      const data = await obtenerCatalogoProductos();
      setState({ data, status: "success", error: null });
    } catch (error) {
      setState((current) => ({
        ...current,
        status: "error",
        error: error instanceof Error ? error : new Error("No se pudo cargar el catálogo."),
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
