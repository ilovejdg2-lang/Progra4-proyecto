import { beforeEach, describe, expect, it, vi } from "vitest";

const apiRequestMock = vi.fn();
vi.mock("./apiClient", () => ({ apiRequest: (...args) => apiRequestMock(...args) }));

import {
  crearCategoriaDocumento,
  normalizarCategoriaDoc,
  normalizarDoc,
  obtenerCategoriasDocumentosAdmin,
  obtenerDocumentoDetalle,
  obtenerDocumentosPublicos,
  registrarVistaDocumento,
} from "./documentosService";

describe("documentosService - Biblioteca Digital", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("normalizes category object correctly", () => {
    const cat = normalizarCategoriaDoc({
      Id: 10,
      Nombre: "Investigaciones",
      Tipo: "documento",
      Padre: "",
      Usos: 5,
    });

    expect(cat).toMatchObject({
      id: "10",
      nombre: "Investigaciones",
      tipo: "documento",
      usos: 5,
    });
  });

  it("fetches public documents with faceted structure", async () => {
    const mockResponse = {
      items: [
        { id: "1", titulo: "Manual de Calidad" },
        { id: "2", titulo: "Informe Anual" },
      ],
      total: 2,
      pagina: 1,
      limite: 12,
      totalPaginas: 1,
      facetas: {
        categorias: [{ nombre: "Manuales", count: 1 }],
      },
      estadisticas: { totalDocumentos: 2, totalDescargas: 50 },
    };

    apiRequestMock.mockResolvedValueOnce(mockResponse);

    const result = await obtenerDocumentosPublicos({
      categoria: "Manuales",
      buscar: "calidad",
      pagina: 1,
    });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.facetas.categorias).toHaveLength(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      expect.stringContaining("/documentos/publicos?categoria=Manuales&buscar=calidad&pagina=1"),
      expect.anything(),
    );
  });

  it("calls detail endpoint with id", async () => {
    apiRequestMock.mockResolvedValueOnce({
      documento: { id: "5", titulo: "Guía de Poda" },
      relacionados: [],
    });

    const res = await obtenerDocumentoDetalle("5");
    expect(res.documento.titulo).toBe("Guía de Poda");
    expect(apiRequestMock).toHaveBeenCalledWith(
      expect.stringContaining("/documentos/5/detalle"),
      expect.anything(),
    );
  });

  it("records document view via POST /vista", async () => {
    apiRequestMock.mockResolvedValueOnce({ vistasCount: 15 });

    const res = await registrarVistaDocumento("5");
    expect(res.vistasCount).toBe(15);
    expect(apiRequestMock).toHaveBeenCalledWith(
      expect.stringContaining("/documentos/5/vista"),
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("documentosService - audiencia de categorías", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("derives audiencia from the category tipo when the API omits it", () => {
    expect(normalizarCategoriaDoc({ Nombre: "MINUTAS", Tipo: "documento_admin" }).audiencia).toBe("administrativa");
    expect(normalizarCategoriaDoc({ Nombre: "Tesis", Tipo: "documento" }).audiencia).toBe("publica");
    expect(normalizarCategoriaDoc({ Nombre: "X", Tipo: "documento", audiencia: "administrativa" }).audiencia).toBe("administrativa");
  });

  it("loads admin screens categories from the admin endpoint", async () => {
    apiRequestMock.mockResolvedValue([{ id: 1, nombre: "MINUTAS", tipo: "documento_admin", audiencia: "administrativa" }]);
    const cats = await obtenerCategoriasDocumentosAdmin();
    expect(apiRequestMock.mock.calls[0][0]).toMatch(/\/documentos\/admin\/categorias$/);
    expect(cats[0]).toMatchObject({ nombre: "MINUTAS", audiencia: "administrativa" });
  });

  it("sends the audience when creating a document category", async () => {
    apiRequestMock.mockResolvedValue({ id: 2, nombre: "Actas", tipo: "documento", audiencia: "administrativa" });
    await crearCategoriaDocumento({ nombre: "Actas", audiencia: "administrativa" });
    expect(apiRequestMock.mock.calls[0][1].data).toEqual({ nombre: "Actas", tipo: "documento", audiencia: "administrativa", padre: "" });
  });

  it("defaults the created category audience to public", async () => {
    apiRequestMock.mockResolvedValue({ id: 3, nombre: "Tesis" });
    await crearCategoriaDocumento({ nombre: "Tesis" });
    expect(apiRequestMock.mock.calls[0][1].data.audiencia).toBe("publica");
  });
});

describe("documentosService - audiencia de documentos", () => {
  it("maps audiencia from the admin listing row", () => {
    expect(normalizarDoc({ id: 1, titulo: "A", Audiencia: "Administrativa" }).audiencia).toBe("administrativa");
    expect(normalizarDoc({ id: 2, titulo: "B" }).audiencia).toBe("");
  });
});
