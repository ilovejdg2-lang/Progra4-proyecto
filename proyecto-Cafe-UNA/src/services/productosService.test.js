import { beforeEach, describe, expect, it, vi } from "vitest";

const apiRequestMock = vi.hoisted(() => vi.fn());

vi.mock("../services/apiClient", () => ({
  apiRequest: apiRequestMock,
}));

vi.mock("../lib/pageDataCache", () => ({
  invalidateAllPageCaches: vi.fn(),
}));

import {
  adaptarProducto,
  actualizarStockCentral,
  construirPayloadCatalogo,
  normalizarStockCentral,
  validarStockCentral,
} from "./productosService";

describe("productosService contract", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("gives canonical aliases precedence and preserves valid zero/false values", () => {
    const mapped = adaptarProducto({
      id: "p-1",
      Id: "legacy-id",
      nombre: "Café canónico",
      Nombre: "Café legado",
      precioNormal: 0,
      PrecioNormal: 5000,
      priceWithoutIva: 4000,
      stock: 0,
      Stock: 12,
      esDestacado: false,
      EsDestacado: true,
    });

    expect(mapped.catalog).toMatchObject({
      id: "p-1",
      nombre: "Café canónico",
      precioNormal: 0,
      esDestacado: false,
    });
    expect(mapped.centralStock).toMatchObject({
      productId: "p-1",
      locationCode: "BODEGA_CENTRAL",
      stock: 0,
      confidence: "known",
    });
  });

  it("marks missing and malformed central stock as unknown instead of zero", () => {
    expect(normalizarStockCentral({ id: "p-1" })).toMatchObject({
      productId: "p-1",
      stock: null,
      confidence: "unknown",
    });
    expect(normalizarStockCentral({ id: "p-1", stock: "not-a-number" })).toMatchObject({
      productId: "p-1",
      stock: null,
      confidence: "unknown",
    });
    expect(adaptarProducto({ nombre: "Sin identidad" })).toBeNull();
  });

  it("builds a catalog payload without stock or location fields", () => {
    expect(construirPayloadCatalogo({
      nombre: "Café",
      descripcion: "Altura",
      imagen: "image.jpg",
      precioNormal: 0,
      precioConIVA: 0,
      estado: "Habilitado",
      peso: "",
      esDestacado: false,
      stock: 40,
      locationCode: "PUNTO_VENTA_1",
    })).toEqual({
      nombre: "Café",
      descripcion: "Altura",
      imagen: "image.jpg",
      precioNormal: 0,
      precioConIVA: 0,
      estado: "Habilitado",
      peso: "",
      esDestacado: false,
    });
  });

  it("validates the central stock integer range and exact endpoint contract", async () => {
    expect(validarStockCentral(0)).toBe(true);
    expect(validarStockCentral(2147483647)).toBe(true);
    expect(validarStockCentral(-1)).toBe(false);
    expect(validarStockCentral(1.5)).toBe(false);
    expect(validarStockCentral(2147483648)).toBe(false);

    apiRequestMock.mockResolvedValue({
      productId: "p-1",
      locationCode: "BODEGA_CENTRAL",
      stock: 8,
    });

    await expect(actualizarStockCentral("p-1", 8)).resolves.toMatchObject({
      productId: "p-1",
      locationCode: "BODEGA_CENTRAL",
      stock: 8,
    });
    expect(apiRequestMock).toHaveBeenCalledWith(
      expect.stringContaining("/productos/p-1/stock-central"),
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ stock: 8 }) }),
    );
  });
});
