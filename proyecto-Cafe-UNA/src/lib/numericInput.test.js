import { describe, expect, it } from "vitest";
import {
  esTeclaNumericaPermitida,
  filtrarDecimales,
  filtrarEnteros,
} from "./numericInput";

describe("numericInput", () => {
  it("filtra enteros", () => {
    expect(filtrarEnteros("12a3b")).toBe("123");
    expect(filtrarEnteros("e+5")).toBe("5");
  });

  it("filtra decimales con un solo punto", () => {
    expect(filtrarDecimales("12,5a")).toBe("12.5");
    expect(filtrarDecimales("1.2.3")).toBe("1.23");
  });

  it("bloquea teclas no numéricas", () => {
    expect(esTeclaNumericaPermitida("a")).toBe(false);
    expect(esTeclaNumericaPermitida("5")).toBe(true);
    expect(esTeclaNumericaPermitida("Backspace")).toBe(true);
    expect(esTeclaNumericaPermitida(".", { decimal: true, valorActual: "1" })).toBe(true);
    expect(esTeclaNumericaPermitida(".", { decimal: true, valorActual: "1.2" })).toBe(false);
  });
});
