import {
  Package,
  Shield,
  Users,
  LayoutDashboard,
  Settings2,
  Image,
  CalendarDays,
  ShoppingCart,
  FileText,
  HeartHandshake,
  HandCoins,
  Sprout,
} from "lucide-react";

/** Agrupa permisos por módulo según código o nombre. */
export function moduloDePermiso(p) {
  const codigo = String(p?.codigo || "").toLowerCase();
  const nombre = String(p?.nombre || "").toLowerCase();
  const texto = `${codigo} ${nombre}`;

  if (/inventario|stock|bodega|ubicacion|articulo_inventario/.test(texto)) {
    return { id: "inventario", label: "Inventario", Icon: Package };
  }
  if (/productor/.test(texto)) {
    return { id: "productores", label: "Productores", Icon: Sprout };
  }
  if (/producto|comprar_productos|historial_compras/.test(texto)) {
    return { id: "productos", label: "Productos", Icon: Package };
  }
  if (/factura|hacienda/.test(texto)) {
    return { id: "facturas", label: "Facturas", Icon: FileText };
  }
  if (/venta|reporte/.test(texto)) {
    return { id: "ventas", label: "Ventas", Icon: ShoppingCart };
  }
  if (/donaci[oó]n/.test(texto)) {
    return { id: "donaciones", label: "Donaciones", Icon: HandCoins };
  }
  if (/voluntariado/.test(texto)) {
    return { id: "voluntariado", label: "Voluntariado", Icon: HeartHandshake };
  }
  if (/visita|visitante/.test(texto)) {
    return { id: "visitas", label: "Visitas", Icon: CalendarDays };
  }
  if (/documentaci[oó]n/.test(texto)) {
    return { id: "documentacion", label: "Documentación", Icon: FileText };
  }
  if (/usuario|asignar_roles|administrar_roles|permiso/.test(texto)) {
    return { id: "usuarios", label: "Usuarios y roles", Icon: Users };
  }
  if (/galer[ií]a|imagen|foto/.test(texto)) {
    return { id: "galeria", label: "Galería", Icon: Image };
  }
  if (/informaci[oó]n/.test(texto)) {
    return { id: "cms", label: "Información del sitio", Icon: LayoutDashboard };
  }
  if (/panel_administrativo|ver_panel_admin/.test(texto)) {
    return { id: "panel", label: "Panel admin", Icon: LayoutDashboard };
  }
  if (/perfil|contrase[nñ]a|panel_usuario_propio/.test(texto)) {
    return { id: "cuenta", label: "Cuenta propia", Icon: Settings2 };
  }
  if (/auditor[ií]a|bit[aá]cora/.test(texto)) {
    return null;
  }
  return { id: "otros", label: "Otros", Icon: Shield };
}
