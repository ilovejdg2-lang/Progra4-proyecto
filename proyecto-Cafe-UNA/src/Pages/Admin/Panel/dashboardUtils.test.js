import { describe, expect, it } from "vitest";
import {
  agruparIngresosPorDia,
  coincidePunto,
  deltaPorcentaje,
  esVentaIngreso,
} from "./dashboardUtils";

describe("dashboardUtils", () => {
  it("solo cuenta ventas aceptadas o entregadas", () => {
    expect(esVentaIngreso({ estado: "Entregado" })).toBe(true);
    expect(esVentaIngreso({ estado: "Aceptado" })).toBe(true);
    expect(esVentaIngreso({ estado: "Pendiente" })).toBe(false);
    expect(esVentaIngreso({ estado: "Rechazado" })).toBe(false);
  });

  it("filtra por punto de venta usando código o nombre", () => {
    expect(coincidePunto({ ubicacionCodigo: "POS_EDITORIAL" }, "POS_EDITORIAL")).toBe(true);
    expect(coincidePunto({ ubicacionNombre: "FUNDA-UNA" }, "POS_FUNA_UNA")).toBe(true);
    expect(coincidePunto({ ubicacionCodigo: "POS_EDITORIAL" }, "BODEGA_CENTRAL")).toBe(false);
  });

  it("agrupa ingresos por día y detecta el pico", () => {
    const { porDia, pico } = agruparIngresosPorDia(
      [
        { estado: "Entregado", fecha: "2026-05-14T15:00:00", total: 100, ubicacionCodigo: "POS_EDITORIAL" },
        { estado: "Aceptado", fecha: "2026-05-14T18:00:00", total: 50, ubicacionCodigo: "POS_FUNA_UNA" },
        { estado: "Entregado", fecha: "2026-05-02T10:00:00", total: 40, ubicacionCodigo: "BODEGA_CENTRAL" },
        { estado: "Pendiente", fecha: "2026-05-14T11:00:00", total: 999, ubicacionCodigo: "POS_EDITORIAL" },
      ],
      2026,
      4,
      null,
    );
    expect(porDia[13].total).toBe(150);
    expect(pico.dia).toBe(14);
    expect(pico.total).toBe(150);
  });

  it("no inventa porcentajes si el período anterior es 0", () => {
    expect(deltaPorcentaje(100, 0)).toBeNull();
    expect(deltaPorcentaje(150, 100)).toBe(50);
  });
});
