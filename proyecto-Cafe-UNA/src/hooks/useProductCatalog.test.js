import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  obtenerCatalogoProductos: vi.fn(),
}));

vi.mock("../services/productosService", () => serviceMocks);

import { useProductCatalog } from "./useProductCatalog";

describe("useProductCatalog", () => {
  beforeEach(() => {
    serviceMocks.obtenerCatalogoProductos.mockReset();
  });

  it("exposes loading, success, error and independent retry transitions", async () => {
    serviceMocks.obtenerCatalogoProductos
      .mockRejectedValueOnce(new Error("catalog unavailable"))
      .mockResolvedValueOnce([{ id: "p-1", nombre: "Café" }]);

    const { result } = renderHook(() => useProductCatalog());

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.data).toEqual([]);

    await result.current.retry();
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.data).toEqual([{ id: "p-1", nombre: "Café" }]);
    expect(serviceMocks.obtenerCatalogoProductos).toHaveBeenCalledTimes(2);
  });
});
