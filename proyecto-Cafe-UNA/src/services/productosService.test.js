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
  ajustarStockPorUbicacion,
  actualizarStockCentral,
  construirPayloadCatalogo,
  limpiarInventarioUbicacionCache,
  normalizarStockPorUbicacion,
  normalizarStockCentral,
  normalizarUbicacion,
  obtenerStockPorUbicacion,
  obtenerUbicaciones,
  validarCodigoUbicacion,
  validarStockCentral,
} from "./productosService";

describe("productosService contract", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    limpiarInventarioUbicacionCache();
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
      categoria: "",
      subcategoria: "",
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
      categoria: "",
      subcategoria: "",
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

  it("normalizes locations from the API without a fixed allowlist", () => {
    expect(["BODEGA_CENTRAL", "POS_FUNA_UNA", "POS_EDITORIAL", "POS_STAND_FERIAS", "POS_NUEVO"]
      .every((code) => validarCodigoUbicacion(code))).toBe(true);
    expect(normalizarUbicacion({ Code: "POS_EDITORIAL", Nombre: "Editorial", Activo: true })).toEqual({
      id: null, code: "POS_EDITORIAL", name: "Editorial", activo: true,
    });
    expect(normalizarUbicacion({ codigo: "POS_NUEVO", nombre: "Kiosco", activo: false })).toEqual({
      id: null, code: "POS_NUEVO", name: "Kiosco", activo: false,
    });
    expect(normalizarUbicacion({ codigo: "bad code!" })).toBeNull();
    expect(validarCodigoUbicacion("bad code!")).toBe(false);
  });

  it("preserves absent and explicit zero stock states", () => {
    expect(normalizarStockPorUbicacion({ ProductId: "p-1", LocationCode: "POS_EDITORIAL", Stock: 0, Provisioned: false }))
      .toEqual({ productId: "p-1", locationCode: "POS_EDITORIAL", stock: 0, provisioned: false });
    expect(normalizarStockPorUbicacion({ id: "p-2", code: "POS_EDITORIAL" }))
      .toEqual({ productId: "p-2", locationCode: "POS_EDITORIAL", stock: null, provisioned: false });
    expect(normalizarStockPorUbicacion({ id: "p-3", code: "bad code!", stock: 2 })).toBeNull();
  });

  it("loads and caches locations without bypassing auth", async () => {
    apiRequestMock.mockResolvedValueOnce([
      { code: "BODEGA_CENTRAL", name: "Bodega Central" },
      { code: "POS_FUNA_UNA", name: "FUNA-UNA" },
    ]);
    const first = await obtenerUbicaciones();
    const second = await obtenerUbicaciones();
    expect(first).toEqual([
      { code: "BODEGA_CENTRAL", name: "Bodega Central", activo: true },
      { code: "POS_FUNA_UNA", name: "FUNA-UNA", activo: true },
    ]);
    expect(second).toBe(first);
    expect(apiRequestMock).toHaveBeenCalledTimes(1);
    expect(apiRequestMock.mock.calls[0][1]).toMatchObject({ errorPrefix: "Error en inventario" });
    expect(apiRequestMock.mock.calls[0][1]).not.toHaveProperty("skipAuth", true);
  });

  it("reads bulk stock by location and isolates the cache", async () => {
    apiRequestMock.mockResolvedValueOnce([
      { productId: "p-1", locationCode: "POS_EDITORIAL", stock: 7, provisioned: true },
      { productId: "p-2", locationCode: "POS_FUNA_UNA", stock: 11, provisioned: true },
    ]).mockResolvedValueOnce([
      { ProductId: "p-1", LocationCode: "POS_FUNA_UNA", Stock: 11, Provisioned: true },
    ]);
    const editorial = await obtenerStockPorUbicacion("POS_EDITORIAL");
    const cachedEditorial = await obtenerStockPorUbicacion("POS_EDITORIAL");
    const funaUna = await obtenerStockPorUbicacion("POS_FUNA_UNA");
    expect(editorial).toEqual([{ productId: "p-1", locationCode: "POS_EDITORIAL", stock: 7, provisioned: true }]);
    expect(cachedEditorial).toBe(editorial);
    expect(funaUna).toEqual([{ productId: "p-1", locationCode: "POS_FUNA_UNA", stock: 11, provisioned: true }]);
    expect(apiRequestMock).toHaveBeenCalledTimes(2);
    expect(apiRequestMock.mock.calls[0][1]).not.toHaveProperty("skipAuth", true);
  });

  it("rejects invalid locations before making a request", async () => {
    await expect(obtenerStockPorUbicacion("bad code!")).rejects.toThrow("El código de ubicación no es válido.");
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("sends the lower camel case adjustment payload and normalizes response casing", async () => {
    apiRequestMock.mockResolvedValue({
      ProductId: "1",
      LocationCode: "POS_EDITORIAL",
      PreviousStock: 2,
      Stock: 7,
      Reason: "  Conteo inicial  ",
    });

    await expect(ajustarStockPorUbicacion("POS_EDITORIAL", "1", 7, "  Conteo inicial  "))
      .resolves.toEqual({
        productId: "1",
        locationCode: "POS_EDITORIAL",
        previousStock: 2,
        stock: 7,
        reason: "Conteo inicial",
      });

    expect(apiRequestMock).toHaveBeenCalledWith(
      expect.stringContaining("/inventario/ubicaciones/POS_EDITORIAL/productos/1/stock"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ stock: 7, reason: "Conteo inicial" }),
      }),
    );
  });

  it.each([
    ["BODEGA_CENTRAL", "1", 7, "Conteo", "La ruta de ajustes solo admite puntos de venta."],
    ["bad code!", "1", 7, "Conteo", "El código de ubicación no es válido."],
    ["POS_EDITORIAL", null, 7, "Conteo", "El identificador del producto no es válido."],
    ["POS_EDITORIAL", "", 7, "Conteo", "El identificador del producto no es válido."],
    ["POS_EDITORIAL", "1", null, "Conteo", "La cantidad de stock debe ser un entero entre 0 y 2147483647."],
    ["POS_EDITORIAL", "1", "", "Conteo", "La cantidad de stock debe ser un entero entre 0 y 2147483647."],
    ["POS_EDITORIAL", "1", "7", "Conteo", "La cantidad de stock debe ser un entero entre 0 y 2147483647."],
    ["POS_EDITORIAL", "1", 7, null, "El motivo del ajuste es obligatorio."],
    ["POS_EDITORIAL", "1", 7, "", "El motivo del ajuste debe tener entre 1 y 300 caracteres."],
    ["POS_EDITORIAL", "1", 7, "a".repeat(301), "El motivo del ajuste debe tener entre 1 y 300 caracteres."],
  ])("rejects invalid adjustment input before the request: %s", async (locationCode, productId, stock, reason, message) => {
    await expect(ajustarStockPorUbicacion(locationCode, productId, stock, reason)).rejects.toThrow(message);
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it("propagates HTTP errors without invalidating the location cache", async () => {
    apiRequestMock
      .mockResolvedValueOnce([{ productId: "1", locationCode: "POS_EDITORIAL", stock: 2, provisioned: true }])
      .mockRejectedValueOnce(new Error("No se pudo guardar el ajuste."));

    await obtenerStockPorUbicacion("POS_EDITORIAL");
    await expect(ajustarStockPorUbicacion("POS_EDITORIAL", "1", 7, "Conteo")).rejects.toThrow(
      "No se pudo guardar el ajuste.",
    );
    await obtenerStockPorUbicacion("POS_EDITORIAL");

    expect(apiRequestMock).toHaveBeenCalledTimes(2);
  });

  it("invalidates only the selected location cache after a successful adjustment", async () => {
    apiRequestMock
      .mockResolvedValueOnce([{ productId: "1", locationCode: "POS_EDITORIAL", stock: 2, provisioned: true }])
      .mockResolvedValueOnce([{ productId: "1", locationCode: "POS_FUNA_UNA", stock: 4, provisioned: true }])
      .mockResolvedValueOnce({
        productId: "1",
        locationCode: "POS_EDITORIAL",
        previousStock: 2,
        stock: 7,
        reason: "Conteo",
      })
      .mockResolvedValueOnce([{ productId: "1", locationCode: "POS_EDITORIAL", stock: 7, provisioned: true }]);

    const editorial = await obtenerStockPorUbicacion("POS_EDITORIAL");
    const funaUna = await obtenerStockPorUbicacion("POS_FUNA_UNA");
    await ajustarStockPorUbicacion("POS_EDITORIAL", "1", 7, "Conteo");

    const refreshedEditorial = await obtenerStockPorUbicacion("POS_EDITORIAL");
    const cachedFunaUna = await obtenerStockPorUbicacion("POS_FUNA_UNA");

    expect(refreshedEditorial).not.toBe(editorial);
    expect(cachedFunaUna).toBe(funaUna);
    expect(apiRequestMock).toHaveBeenCalledTimes(4);
  });
});
