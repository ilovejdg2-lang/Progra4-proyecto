import { describe, expect, it } from "vitest";
import {
  esCategoriaAdministrativa,
  opcionesCategoriaDocumento,
} from "./categorias";

const cats = [
  { id: "1", nombre: "Tesis", audiencia: "publica" },
  { id: "2", nombre: "MINUTAS", audiencia: "administrativa" },
  { id: "3", nombre: "Actas 2025", audiencia: "administrativa", padre: "MINUTAS" },
  { id: "4", nombre: "Manuales", audiencia: "publica" },
];
const etiquetas = { vacio: "Seleccione", publica: "Repositorio público", administrativa: "Administrativas" };

describe("categorias de documentos por audiencia", () => {
  it("detects administrative categories", () => {
    expect(esCategoriaAdministrativa(cats[1])).toBe(true);
    expect(esCategoriaAdministrativa(cats[0])).toBe(false);
    expect(esCategoriaAdministrativa(null)).toBe(false);
  });

  it("groups root categories under a public and an administrative heading", () => {
    const opciones = opcionesCategoriaDocumento(cats, etiquetas);
    expect(opciones.map((o) => (o.heading ? `# ${o.label}` : o.value))).toEqual([
      "",
      "# Repositorio público",
      "Tesis",
      "Manuales",
      "# Administrativas",
      "MINUTAS",
    ]);
  });

  it("omits an empty group heading", () => {
    const opciones = opcionesCategoriaDocumento([cats[0]], etiquetas);
    expect(opciones.some((o) => o.heading && o.label === "Administrativas")).toBe(false);
  });
});
