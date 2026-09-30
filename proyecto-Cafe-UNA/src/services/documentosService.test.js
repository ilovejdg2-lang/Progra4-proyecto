import { beforeEach, describe, expect, it, vi } from "vitest";

const apiRequestMock = vi.fn();
vi.mock("./apiClient", () => ({ apiRequest: (...args) => apiRequestMock(...args) }));

import {
  normalizarCategoriaDoc,
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
