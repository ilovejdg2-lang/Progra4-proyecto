import { describe, expect, it } from "vitest";
import fuente from "./adminBreadcrumbItems.js?raw";
import { getAdminBreadcrumbItems } from "./adminBreadcrumbItems";

// AdminBreadcrumb keys each crumb by `to ?? label`; that must be unique within every trail.
const rutas = [
  ...[...fuente.matchAll(/"(\/admin[^"]*)":/g)].map((m) => m[1]),
  "/admin",
  "/admin/voluntariado",
  "/admin/visitas",
  "/admin/propuestas/5",
  "/admin/mis-propuestas/5",
  "/admin/puntos-venta/abc/ventas",
  "/admin/desconocida/desconocida/otra",
];

describe("getAdminBreadcrumbItems", () => {
  it.each(rutas)("gives every crumb of %s a distinct key", (ruta) => {
    for (const search of [null, "?tab=fechas"]) {
      const claves = getAdminBreadcrumbItems(ruta, search).map((item) => item.to ?? item.label);
      expect(new Set(claves).size).toBe(claves.length);
    }
  });
});

describe("inventory breadcrumbs", () => {
  const inventario = [
    ["/admin/producto", "Producto"],
    ["/admin/puntos-venta", "Puntos de venta"],
    ["/admin/puntos-venta/dias-sin-retiro", "Días sin retiro"],
    ["/admin/activos-fijos", "Activos fijos"],
    ["/admin/distribucion", "Distribución"],
    ["/admin/salidas-inventario", "Salidas de bodega"],
    ["/admin/historial-movimientos", "Historial de movimientos"],
    ["/admin/ventas-presenciales", "Ventas presenciales"],
    ["/admin/ventas-pendientes", "Ventas pendientes"],
    ["/admin/historial-ventas", "Historial de ventas"],
  ];

  it.each(inventario)("%s sits under Manejo de inventario", (ruta, etiqueta) => {
    const labels = getAdminBreadcrumbItems(ruta, null).map((item) => item.label);
    expect(labels[0]).toBe("Admin");
    expect(labels[1]).toBe("Manejo de inventario");
    expect(labels[labels.length - 1]).toBe(etiqueta);
  });
});
