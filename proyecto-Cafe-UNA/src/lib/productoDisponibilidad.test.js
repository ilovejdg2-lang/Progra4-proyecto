import { describe, expect, it } from "vitest";

import {
  obtenerStockCentral,
  productoPuedeDestacarse,
  productoSinStock,
  stockCentralConocido,
} from "./productoDisponibilidad";

describe("productoDisponibilidad central stock", () => {
  it("uses only known central stock for availability", () => {
    expect(stockCentralConocido({ centralStock: { stock: 4, confidence: "known" } })).toBe(true);
    expect(obtenerStockCentral({ centralStock: { stock: 4, confidence: "known" }, stock: 0 })).toBe(4);
    expect(productoPuedeDestacarse({
      estado: "Habilitado",
      stock: 12,
      centralStock: { stock: null, confidence: "unknown" },
    })).toBe(false);
  });

  it("fails closed for zero and unknown central stock", () => {
    expect(productoSinStock({ centralStock: { stock: 0, confidence: "known" } })).toBe(true);
    expect(productoSinStock({ centralStock: { stock: null, confidence: "unknown" } })).toBe(true);
    expect(productoPuedeDestacarse({
      estado: "Habilitado",
      centralStock: { stock: 0, confidence: "known" },
    })).toBe(false);
  });
});
