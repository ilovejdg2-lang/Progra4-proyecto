import { describe, expect, it } from "vitest";
import { describirCupo, formatearFechaLarga } from "./formatoFormulario";

describe("describirCupo", () => {
  it("reports plenty of capacity as a plain count", () => {
    expect(describirCupo({ cupoRestante: 12, capacidadMaxima: 30 })).toEqual({
      estado: "disponible",
      texto: "12 cupos disponibles de 30",
    });
  });

  it("flags low capacity (5 or fewer) with the remaining count", () => {
    expect(describirCupo({ cupoRestante: 3, capacidadMaxima: 30 })).toEqual({
      estado: "bajo",
      texto: "Quedan 3 cupos de 30",
    });
    expect(describirCupo({ cupoRestante: 1, capacidadMaxima: 30 }).texto).toBe("Queda 1 cupo de 30");
  });

  it("reports a sold-out slot", () => {
    expect(describirCupo({ cupoRestante: 0, capacidadMaxima: 30 })).toEqual({
      estado: "agotado",
      texto: "Cupo agotado",
    });
    expect(describirCupo({ cupoRestante: 8, capacidadMaxima: 30, agotada: true }).estado).toBe("agotado");
  });

  it("falls back to the maximum when the remaining capacity is unknown", () => {
    expect(describirCupo({ capacidadMaxima: 20 }).texto).toBe("20 cupos disponibles de 20");
  });
});

describe("formatearFechaLarga", () => {
  const sabado = new Date(2026, 10, 14);

  it("writes Spanish dates in sentence case without a year", () => {
    expect(formatearFechaLarga(sabado, "es")).toBe("Sábado 14 de noviembre");
  });

  it("writes English dates in sentence case", () => {
    expect(formatearFechaLarga(sabado, "en")).toBe("Saturday, November 14");
  });

  it("returns an empty string for a missing date", () => {
    expect(formatearFechaLarga(null, "es")).toBe("");
  });
});
