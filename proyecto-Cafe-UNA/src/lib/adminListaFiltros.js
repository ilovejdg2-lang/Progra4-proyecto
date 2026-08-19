export function normalizarBusqueda(texto) {
  return String(texto ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function coincideBusqueda(valores, query) {
  if (!query) return true;
  return valores.some((valor) => normalizarBusqueda(valor).includes(query));
}

export function filtrarPorBusqueda(items, query, obtenerValores) {
  const normalizado = normalizarBusqueda(query);
  if (!normalizado) return items;
  return items.filter((item) => coincideBusqueda(obtenerValores(item), normalizado));
}

export function filtrarPorCampo(items, valorFiltro, obtenerValor, valorTodos = "todos") {
  if (!valorFiltro || valorFiltro === valorTodos) return items;
  return items.filter((item) => obtenerValor(item) === valorFiltro);
}
