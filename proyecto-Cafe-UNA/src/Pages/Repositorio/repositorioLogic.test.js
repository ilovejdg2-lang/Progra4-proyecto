import { describe, expect, it } from "vitest";

import {
  categoriasConConteo,
  etiquetaTipoArchivo,
  filtrosActivos,
  metaDocumento,
  normalizarOrden,
  obtenerNumerosPagina,
  validarEnvio,
} from "./repositorioLogic";

describe("normalizarOrden", () => {
  it("keeps the three supported values", () => {
    expect(normalizarOrden("recientes")).toBe("recientes");
    expect(normalizarOrden("descargas")).toBe("descargas");
    expect(normalizarOrden("az")).toBe("az");
  });

  it("falls back to recientes for unknown or empty values", () => {
    expect(normalizarOrden("populares")).toBe("recientes");
    expect(normalizarOrden("")).toBe("recientes");
    expect(normalizarOrden(undefined)).toBe("recientes");
  });
});

describe("categoriasConConteo", () => {
  it("keeps only categories with at least one document", () => {
    const facetas = { categorias: [{ nombre: "Guías", count: 2 }, { nombre: "Vacía", count: 0 }] };
    expect(categoriasConConteo(facetas)).toEqual([{ nombre: "Guías", count: 2 }]);
  });

  it("tolerates missing facets", () => {
    expect(categoriasConConteo(undefined)).toEqual([]);
    expect(categoriasConConteo({})).toEqual([]);
  });
});

describe("etiquetaTipoArchivo", () => {
  it.each([
    [{ nombreOriginal: "a.pdf" }, "PDF"],
    [{ mimeType: "application/pdf" }, "PDF"],
    [{ nombreOriginal: "a.docx" }, "DOC"],
    [{ nombreOriginal: "a.xlsx" }, "XLS"],
    [{ nombreOriginal: "a.csv" }, "XLS"],
    [{ nombreOriginal: "a.png" }, "IMG"],
    [{ mimeType: "image/jpeg" }, "IMG"],
    [{ nombreOriginal: "a.zip" }, "ZIP"],
    [{ nombreOriginal: "a.txt" }, "TXT"],
    [{}, "ARCH"],
  ])("labels %j as %s", (doc, esperado) => {
    expect(etiquetaTipoArchivo(doc)).toBe(esperado);
  });
});

describe("metaDocumento", () => {
  const base = {
    autor: "Ana Mora",
    categoria: "Guías",
    anio: 2025,
    descargasCount: 3,
  };

  it("joins author, category, year and downloads", () => {
    expect(metaDocumento(base)).toEqual(["Ana Mora", "Guías", "2025", "3 descargas"]);
  });

  it("omits missing parts and singularizes one download", () => {
    expect(metaDocumento({ categoria: "Guías", descargasCount: 1 })).toEqual(["Guías", "1 descarga"]);
    expect(metaDocumento({ descargasCount: 0 })).toEqual([]);
  });

  it("adds Privado only for admins viewing private documents", () => {
    expect(metaDocumento({ ...base, esPrivado: true }, { esAdmin: true })[0]).toBe("Privado");
    expect(metaDocumento({ ...base, esPrivado: true }, { esAdmin: false })).not.toContain("Privado");
  });
});

describe("filtrosActivos", () => {
  it("is true when searching or filtering by category", () => {
    expect(filtrosActivos({ buscar: "poda", categoria: "todas" })).toBe(true);
    expect(filtrosActivos({ buscar: "", categoria: "Guías" })).toBe(true);
  });

  it("is false for the default state", () => {
    expect(filtrosActivos({ buscar: "  ", categoria: "todas" })).toBe(false);
  });
});

describe("validarEnvio", () => {
  const valido = { titulo: "Guía", categoria: "Guías", nombre: "Ana", correo: "ana@una.cr", archivo: {} };

  it("accepts a complete contribution", () => {
    expect(validarEnvio(valido, { esSolicitud: false })).toBe("");
  });

  it.each([
    [{ titulo: " " }, "título"],
    [{ categoria: "" }, "tema"],
    [{ archivo: null }, "archivo"],
    [{ nombre: "" }, "nombre"],
    [{ correo: "no-es-correo" }, "correo"],
  ])("rejects contribution with %j", (cambio, fragmento) => {
    expect(validarEnvio({ ...valido, ...cambio }, { esSolicitud: false }).toLowerCase()).toContain(fragmento);
  });

  it("does not require tema or file in access-request mode but requires the reason", () => {
    const solicitud = { titulo: "Doc", categoria: "", nombre: "Ana", correo: "ana@una.cr", archivo: null, motivo: "" };
    expect(validarEnvio(solicitud, { esSolicitud: true }).toLowerCase()).toContain("para qué");
    expect(validarEnvio({ ...solicitud, motivo: "Tesis" }, { esSolicitud: true })).toBe("");
  });
});

describe("obtenerNumerosPagina", () => {
  it("lists every page when there are few", () => {
    expect(obtenerNumerosPagina(1, 3)).toEqual([1, 2, 3]);
  });

  it("collapses the gaps around the current page", () => {
    expect(obtenerNumerosPagina(5, 9)).toEqual([1, "...", 4, 5, 6, "...", 9]);
    expect(obtenerNumerosPagina(1, 9)).toEqual([1, 2, "...", 9]);
    expect(obtenerNumerosPagina(9, 9)).toEqual([1, "...", 8, 9]);
  });
});
