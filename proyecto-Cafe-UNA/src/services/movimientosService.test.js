import { describe, expect, it } from "vitest";
import { normalizarMovimiento } from "./movimientosService";

describe("normalizarMovimiento", () => {
  it("preserves the recipient from API payloads using camelCase or PascalCase", () => {
    expect(normalizarMovimiento({ id: 1, destinatario: "Punto 1" }).destinatario).toBe(
      "Punto 1",
    );
    expect(normalizarMovimiento({ Id: 2, Destinatario: "Brayan Pérez" }).destinatario).toBe(
      "Brayan Pérez",
    );
  });
});
