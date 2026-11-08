import { describe, expect, it } from "vitest";

import { traducirSync } from "./traducir";

describe("traducirSync count suffixes", () => {
  it("translates link and question counts", () => {
    expect(traducirSync("3 enlaces")).toBe("3 links");
    expect(traducirSync("1 enlace")).toBe("1 link");
    expect(traducirSync("2 preguntas")).toBe("2 questions");
    expect(traducirSync("1 pregunta")).toBe("1 question");
  });

  it("has English entries for the homepage admin copy", () => {
    expect(traducirSync("Banner principal de la página de inicio.")).not.toBe("Banner principal de la página de inicio.");
    expect(traducirSync("Ruta interna del sitio o URL externa.")).not.toBe("Ruta interna del sitio o URL externa.");
    expect(traducirSync("Subir archivo para")).toBe("Upload file for");
  });
});
