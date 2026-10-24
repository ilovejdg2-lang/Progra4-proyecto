export function filtrosInicialesHistorial(esPendientes) {
  return {
    busqueda: "",
    estado: esPendientes ? "Pendiente" : "todos",
    desde: "",
    hasta: "",
    punto: "",
    categoria: "",
    vendedorId: "",
  };
}

export function parametrosListadoVentas({ page, pageSize, filtros, esPendientes, locationCode }) {
  return {
    page,
    pageSize,
    q: filtros.busqueda,
    estado: esPendientes ? "Pendiente" : filtros.estado,
    desde: filtros.desde,
    hasta: filtros.hasta,
    ubicacionCodigo: locationCode || filtros.punto || undefined,
    categoria: filtros.categoria || undefined,
    vendedorId: filtros.vendedorId || undefined,
  };
}

export function hayFiltrosHistorial(filtros, { esPendientes = false, locationCode = "" } = {}) {
  return Boolean(
    filtros.busqueda ||
      filtros.desde ||
      filtros.hasta ||
      filtros.categoria ||
      filtros.vendedorId ||
      (!locationCode && filtros.punto) ||
      (!esPendientes && filtros.estado && filtros.estado !== "todos"),
  );
}

export function filtrarVentasLocales(ventas, { esPendientes = false, locationCode = "", filtros }) {
  const punto = String(locationCode || filtros.punto || "").trim().toUpperCase();
  const categoria = String(filtros.categoria || "").trim().toLowerCase();
  const vendedorId = String(filtros.vendedorId || "").trim();
  const busqueda = String(filtros.busqueda || "").trim().toLowerCase();
  return (ventas || []).filter((venta) => {
    if (esPendientes && venta.estado !== "Pendiente") return false;
    if (!esPendientes && filtros.estado && filtros.estado !== "todos" && venta.estado !== filtros.estado) {
      return false;
    }
    if (punto && String(venta.ubicacionCodigo || "").trim().toUpperCase() !== punto) return false;
    const dia = String(venta.fecha || "").slice(0, 10);
    if (filtros.desde && dia && dia < filtros.desde) return false;
    if (filtros.hasta && dia && dia > filtros.hasta) return false;
    if (categoria) {
      const coincide = (venta.items || []).some(
        (item) => String(item.categoria || "").trim().toLowerCase() === categoria,
      );
      if (!coincide) return false;
    }
    if (vendedorId && String(venta.vendedorId || "") !== vendedorId) return false;
    if (busqueda) {
      const texto = `${venta.numero || ""} ${venta.clienteNombre || ""} ${venta.clienteCorreo || ""}`.toLowerCase();
      if (!texto.includes(busqueda)) return false;
    }
    return true;
  });
}
