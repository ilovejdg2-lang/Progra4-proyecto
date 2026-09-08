import { beforeEach, describe, expect, it, vi } from "vitest";

const apiRequestMock = vi.fn();
vi.mock("./apiClient", () => ({ apiRequest: (...args) => apiRequestMock(...args) }));

import {
  normalizarMovimiento,
  obtenerHistorialMovimientos,
} from "./movimientosService";

describe("movimientosService", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("normalizes movement raw backend items", () => {
    const raw = {
      Id: "123",
      Fecha: "2026-09-07T14:30:00.000Z",
      Tipo: "entrada",
      ProductoId: "10",
      ProductoNombre: "Café Especial",
      Cantidad: 100,
      UbicacionOrigenId: null,
      OrigenNombre: "",
      UbicacionDestinoId: 1,
      DestinoNombre: "Bodega Central",
      ResponsableId: 5,
      ResponsableNombre: "Admin Maria",
      Notas: "Recepción de proveedor",
    };

    expect(normalizarMovimiento(raw)).toEqual({
      id: "123",
      fecha: "2026-09-07T14:30:00.000Z",
      tipo: "entrada",
      productoId: "10",
      productoNombre: "Café Especial",
      cantidad: 100,
      ubicacionOrigenId: null,
      origenNombre: "",
      ubicacionDestinoId: 1,
      destinoNombre: "Bodega Central",
      responsableId: 5,
      responsableNombre: "Admin Maria",
      notas: "Recepción de proveedor",
    });
  });

  it("fetches movement history with parameters", async () => {
    apiRequestMock.mockResolvedValueOnce({
      items: [
        {
          id: "1",
          fecha: "2026-09-07T10:00:00.000Z",
          tipo: "venta_presencial",
          productoId: "2",
          productoNombre: "Espresso",
          cantidad: 1,
          ubicacionOrigenId: 2,
          origenNombre: "Cafetería Central",
          ubicacionDestinoId: null,
          destinoNombre: "",
          responsableId: 3,
          responsableNombre: "Cajero",
          notas: "",
        },
      ],
      total: 1,
      page: 1,
      limit: 25,
    });

    const res = await obtenerHistorialMovimientos({
      producto: "Espresso",
      tipo: "venta_presencial",
      ubicacionId: "2",
      fechaDesde: "2026-09-01",
      fechaHasta: "2026-09-07",
      page: 1,
      limit: 25,
    });

    expect(res.total).toBe(1);
    expect(res.items).toHaveLength(1);
    expect(res.items[0].productoNombre).toBe("Espresso");
    expect(apiRequestMock).toHaveBeenCalledWith(
      expect.stringContaining("producto=Espresso"),
      expect.anything(),
    );
    expect(apiRequestMock).toHaveBeenCalledWith(
      expect.stringContaining("tipo=venta_presencial"),
      expect.anything(),
    );
    expect(apiRequestMock).toHaveBeenCalledWith(
      expect.stringContaining("ubicacion_id=2"),
      expect.anything(),
    );
  });
});
