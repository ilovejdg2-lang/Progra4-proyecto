import { useMemo, useState } from "react";
import { filtrarPorBusqueda, filtrarPorCampo } from "../lib/adminListaFiltros";

export function useAdminListaFiltros(items, { buscarEn, filtrosConfig = [] }) {
  const [busqueda, setBusqueda] = useState("");
  const [valoresFiltro, setValoresFiltro] = useState(() =>
    Object.fromEntries(filtrosConfig.map((filtro) => [filtro.id, filtro.valorInicial ?? "todos"])),
  );

  const setValorFiltro = (id, valor) => {
    setValoresFiltro((actual) => ({ ...actual, [id]: valor }));
  };

  const limpiar = () => {
    setBusqueda("");
    setValoresFiltro(
      Object.fromEntries(filtrosConfig.map((filtro) => [filtro.id, filtro.valorInicial ?? "todos"])),
    );
  };

  const filtrados = useMemo(() => {
    let resultado = Array.isArray(items) ? items : [];

    if (buscarEn) {
      resultado = filtrarPorBusqueda(resultado, busqueda, buscarEn);
    }

    for (const filtro of filtrosConfig) {
      const valor = valoresFiltro[filtro.id];
      if (filtro.aplicar) {
        resultado = filtro.aplicar(resultado, valor);
      } else if (filtro.obtenerValor) {
        resultado = filtrarPorCampo(resultado, valor, filtro.obtenerValor, filtro.valorTodos ?? "todos");
      }
    }

    return resultado;
  }, [items, busqueda, valoresFiltro, buscarEn, filtrosConfig]);

  const hayFiltrosActivos =
    Boolean(busqueda.trim()) ||
    filtrosConfig.some((filtro) => {
      const valor = valoresFiltro[filtro.id];
      return valor && valor !== (filtro.valorInicial ?? "todos");
    });

  return {
    busqueda,
    setBusqueda,
    valoresFiltro,
    setValorFiltro,
    filtrados,
    limpiar,
    hayFiltrosActivos,
    total: Array.isArray(items) ? items.length : 0,
    visibles: filtrados.length,
  };
}
