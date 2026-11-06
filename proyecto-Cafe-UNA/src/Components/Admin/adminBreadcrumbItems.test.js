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
