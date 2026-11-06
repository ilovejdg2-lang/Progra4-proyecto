import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SECCIONES_MANUAL } from "../../lib/manualAdmin";
import { SECCIONES_MANUAL_CLIENTE } from "../../lib/manualCliente";
import { SeccionManual } from "./SeccionManual";

vi.mock("@tanstack/react-router", () => ({ Link: ({ children, to }) => <a href={to}>{children}</a> }));

const textoPaso = (paso) => (typeof paso === "string" ? paso : paso?.texto || "");

// SeccionManual keys steps and tips by their own text, so it must be unique within a section.
describe.each([
  ["admin", SECCIONES_MANUAL],
  ["cliente", SECCIONES_MANUAL_CLIENTE],
])("manual %s content", (_nombre, secciones) => {
  it.each(secciones.map((s) => [s.id, s]))("section %s has distinct step and tip texts", (_id, seccion) => {
    const pasos = (seccion.pasos ?? []).map(textoPaso);
    const consejos = seccion.consejos ?? [];
    expect(new Set(pasos).size).toBe(pasos.length);
    expect(new Set(consejos).size).toBe(consejos.length);
  });
});

describe("SeccionManual", () => {
  it("renders every step and tip once, in order", () => {
    const seccion = {
      id: "demo",
      titulo: "Demo",
      grupo: "Grupo",
      resumen: "Resumen",
      pasos: ["Primero", { texto: "Segundo", imagen: "" }],
      consejos: ["Consejo A", "Consejo B"],
    };
    render(<SeccionManual seccion={seccion} />);
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(
      expect.arrayContaining(["1Primero", "2Segundo", "Consejo A", "Consejo B"]),
    );
  });
});
