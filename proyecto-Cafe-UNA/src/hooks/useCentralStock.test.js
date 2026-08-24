import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  obtenerStockCentral: vi.fn(),
}));

vi.mock("../services/productosService", () => serviceMocks);

import { useCentralStock } from "./useCentralStock";

describe("useCentralStock", () => {
  beforeEach(() => {
    serviceMocks.obtenerStockCentral.mockReset();
  });

  it("retries stock without changing the catalog hook contract", async () => {
    serviceMocks.obtenerStockCentral
      .mockRejectedValueOnce(new Error("stock unavailable"))
      .mockResolvedValueOnce([{
        productId: "p-1",
        locationCode: "BODEGA_CENTRAL",
        stock: 4,
        confidence: "known",
      }]);

    const { result } = renderHook(() => useCentralStock());

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.data).toEqual([]);

    await result.current.retry();
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.data[0]).toMatchObject({ productId: "p-1", stock: 4 });
    expect(serviceMocks.obtenerStockCentral).toHaveBeenCalledTimes(2);
  });
});
