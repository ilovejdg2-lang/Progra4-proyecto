export function tabDeSearch(search) {
  if (search && typeof search === "object" && !Array.isArray(search)) {
    const valor = search.tab ?? search.Tab;
    if (valor != null && String(valor).trim()) return String(valor);
  }
  if (typeof search === "string" && search) {
    const qs = search.startsWith("?") ? search.slice(1) : search;
    return new URLSearchParams(qs).get("tab");
  }
  return null;
}

function crumb(label, to, search, detail) {
  const item = { label };
  if (to) item.to = to;
  if (search) item.search = search;
  if (detail) item.detail = detail;
  return item;
}

/**
 * Migas de pan según el menú lateral del admin.
 * El último ítem es la página actual (sin enlace).
 */
export function getAdminBreadcrumbItems(pathname, search) {
  const path = String(pathname || "").replace(/\/+$/, "") || "/";
  const tab = tabDeSearch(search);
  const admin = crumb("Admin", "/admin");
  const cms = crumb("Configuración general del sitio");
  const inventario = crumb("Manejo de inventario");
  const sobreNosotros = crumb("Sobre nosotros");
  const donaciones = crumb("Donaciones");
  const ajustes = crumb("Ajustes del sistema");

  if (path === "/admin") return [crumb("Admin")];

  const exactas = {
    "/admin/informacion-pagina-principal": [
      admin,
      cms,
      crumb("Información página principal"),
    ],
    "/admin/sobre-nosotros": [admin, cms, sobreNosotros, crumb("Historia")],
    "/admin/galeria": [admin, cms, sobreNosotros, crumb("Galería")],
    "/admin/producto": [admin, inventario, crumb("Producto")],
    "/admin/puntos-venta": [admin, inventario, crumb("Puntos de venta")],
    "/admin/activos-fijos": [admin, inventario, crumb("Activos fijos")],
    "/admin/distribucion": [admin, inventario, crumb("Distribución")],
    "/admin/historial-movimientos": [admin, inventario, crumb("Historial de movimientos")],
    "/admin/ventas-presenciales": [admin, inventario, crumb("Ventas presenciales")],
    "/admin/ventas-pendientes": [admin, inventario, crumb("Ventas pendientes")],
    "/admin/historial-ventas": [admin, inventario, crumb("Historial de ventas")],
    "/admin/usuarios": [admin, crumb("Administrar usuarios")],
    "/admin/auditoria": [admin, crumb("Auditoría")],
    "/admin/perfil": [admin, crumb("Mi perfil")],
    "/admin/ajustes": [admin, ajustes],
    "/admin/ajustes/horarios": [admin, ajustes, crumb("Horarios")],
    "/admin/ajustes/permisos": [admin, ajustes, crumb("Permisos")],
    "/admin/ajustes/idioma": [admin, ajustes, crumb("Idioma")],
    "/admin/donaciones/necesidades": [admin, donaciones, crumb("Necesidades de donación")],
    "/admin/donaciones/solicitudes": [admin, donaciones, crumb("Solicitudes de donación")],
    "/admin/donaciones/fechas-recepcion": [admin, donaciones, crumb("Fechas de recepción")],
  };

  if (exactas[path]) return exactas[path];

  if (path === "/admin/voluntariado") {
    if (tab === "fechas") {
      return [admin, crumb("Voluntariado", "/admin/voluntariado"), crumb("Fechas disponibles")];
    }
    return [admin, crumb("Voluntariado")];
  }

  if (path === "/admin/visitas") {
    if (tab === "fechas") {
      return [admin, crumb("Visitas grupales", "/admin/visitas"), crumb("Gestión de fechas de visitas")];
    }
    return [admin, crumb("Visitas grupales")];
  }

  const ventasPunto = path.match(/^\/admin\/puntos-venta\/([^/]+)\/ventas$/);
  if (ventasPunto) {
    const codigo = decodeURIComponent(ventasPunto[1] || "").toUpperCase();
    return [
      admin,
      inventario,
      crumb("Puntos de venta", "/admin/puntos-venta"),
      crumb("Historial de ventas", undefined, undefined, codigo || ""),
    ];
  }

  const segmentos = path.split("/").filter(Boolean);
  if (segmentos[0] !== "admin") return [admin];
  return [
    admin,
    ...segmentos.slice(1).map((seg, i, arr) => {
      const etiqueta = decodeURIComponent(seg).replace(/-/g, " ");
      const to =
        i < arr.length - 1 ? `/${["admin", ...arr.slice(0, i + 1)].join("/")}` : undefined;
      return crumb(etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1), to);
    }),
  ];
}
