import { beforeEach, describe, expect, it, vi } from "vitest";

const apiRequestMock = vi.fn();
vi.mock("./apiClient", () => ({ apiRequest: (...args) => apiRequestMock(...args) }));

import {
  normalizarCompra,
  obtenerCompraPorId,
  obtenerMisCompras,
  registrarCompra,
} from "./comprasService";

describe("comprasService", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("normalizes purchase history records", () => {
    expect(
      normalizarCompra({
        Id: 3,
        Numero: "C-3",
        Fecha: "2026-03-01T10:00:00.000Z",
        ClienteNombre: "Ana",
        CantidadProductos: 2,
        Subtotal: 1000,
        Impuestos: 130,
        Total: 1130,
        MetodoPago: "Tarjeta",
        Estado: "Pagado",
        Items: [{ Nombre: "Café", Cantidad: 2, PrecioUnitario: 565, Subtotal: 1130 }],
      }),
    ).toMatchObject({
      id: "3",
      numero: "C-3",
      clienteNombre: "Ana",
      cantidadProductos: 2,
      total: 1130,
      items: [{ nombre: "Café", cantidad: 2 }],
    });
  });

  it("registers a completed purchase through the API", async () => {
    apiRequestMock.mockResolvedValueOnce({
      id: 10,
      numero: "C-10",
      total: 2000,
      items: [],
    });
    await expect(
      registrarCompra({
        clienteNombre: "Ana",
        items: [{ nombre: "Café", cantidad: 1, precioUnitario: 2000, subtotal: 2000 }],
        total: 2000,
      }),
    ).resolves.toMatchObject({ numero: "C-10", total: 2000 });
    expect(apiRequestMock).toHaveBeenCalledWith(
      expect.stringContaining("/compras"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("loads own paginated purchases", async () => {
    apiRequestMock.mockResolvedValueOnce({
      data: [{ id: 1, numero: "C-1", total: 100 }],
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    });
    await expect(obtenerMisCompras({ page: 1 })).resolves.toMatchObject({
      total: 1,
      data: [{ numero: "C-1" }],
    });
    expect(apiRequestMock.mock.calls[0][0]).toContain("/compras/mias");
  });

  it("loads purchase detail by id", async () => {
    apiRequestMock.mockResolvedValueOnce({ id: 8, numero: "C-8", items: [] });
    await expect(obtenerCompraPorId(8)).resolves.toMatchObject({ numero: "C-8" });
    expect(apiRequestMock.mock.calls[0][0]).toContain("/compras/8");
  });
});
