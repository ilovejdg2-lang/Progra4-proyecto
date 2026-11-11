import { describe, expect, it } from "vitest";

import {
  calcularVuelto,
  deduplicarMetodos,
  esEfectivo,
  opcionesMetodoPago,
  redondearColones,
} from "./pagoPresencial";

const METODOS = ["Efectivo", "SINPE Móvil", "Transferencia"];

describe("pago presencial", () => {
  it("redondea al colón", () => {
    expect(redondearColones(1000.4)).toBe(1000);
    expect(redondearColones(1000.5)).toBe(1001);
  });

  it("acepta efectivo exacto y un monto superior", () => {
    expect(calcularVuelto(3000, "3000")).toMatchObject({ vuelto: 0, suficiente: true });
    expect(calcularVuelto(3000.4, "5000.5")).toEqual({
      total: 3000,
      montoRecibido: 5001,
      vuelto: 2001,
      suficiente: true,
    });
  });

  it("marca insuficiente un monto menor o vacío", () => {
    expect(calcularVuelto(3000, "2999").suficiente).toBe(false);
    expect(calcularVuelto(3000, "").suficiente).toBe(false);
  });

  it("arma una opción por cada método habilitado, sin duplicados ni nombres de más", () => {
    expect(deduplicarMetodos(["Efectivo", "efectivo", "SINPE Móvil", "Comprobante"])).toEqual([
      "Efectivo",
      "SINPE Móvil",
      "Comprobante",
    ]);
    expect(opcionesMetodoPago(
      ["Efectivo", "efectivo", "SINPE Móvil", "Transferencia"],
      { Transferencia: "Transferencia bancaria" },
    )).toEqual([
      { value: "Efectivo", label: "Efectivo" },
      { value: "SINPE Móvil", label: "SINPE Móvil" },
      { value: "Transferencia", label: "Transferencia bancaria" },
    ]);
    expect(METODOS.filter(esEfectivo)).toEqual(["Efectivo"]);
  });
});
