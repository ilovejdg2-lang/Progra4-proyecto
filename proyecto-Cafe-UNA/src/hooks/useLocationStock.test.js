import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({ obtenerStockPorUbicacion: vi.fn() }));
vi.mock("../services/productosService", () => serviceMocks);

import { useLocationStock } from "./useLocationStock";

describe("useLocationStock", () => {
  beforeEach(() => serviceMocks.obtenerStockPorUbicacion.mockReset());

  it("reloads the scoped stock when the selected location changes", async () => {
    serviceMocks.obtenerStockPorUbicacion
      .mockResolvedValueOnce([{ productId: "1", locationCode: "POS_FUNA_UNA", stock: 2 }])
      .mockResolvedValueOnce([{ productId: "1", locationCode: "POS_EDITORIAL", stock: 0 }]);

    const { result, rerender } = renderHook(({ code }) => useLocationStock(code), { initialProps: { code: "POS_FUNA_UNA" } });
    await waitFor(() => expect(result.current.data[0]?.locationCode).toBe("POS_FUNA_UNA"));

    rerender({ code: "POS_EDITORIAL" });
    await waitFor(() => expect(result.current.data[0]?.locationCode).toBe("POS_EDITORIAL"));

    expect(serviceMocks.obtenerStockPorUbicacion).toHaveBeenNthCalledWith(1, "POS_FUNA_UNA");
    expect(serviceMocks.obtenerStockPorUbicacion).toHaveBeenNthCalledWith(2, "POS_EDITORIAL");
  });

  it("ignores a slower response from a previous location", async () => {
    let resolveFirst;
    let resolveSecond;
    serviceMocks.obtenerStockPorUbicacion
      .mockReturnValueOnce(new Promise((resolve) => { resolveFirst = resolve; }))
      .mockReturnValueOnce(new Promise((resolve) => { resolveSecond = resolve; }));

    const { result, rerender } = renderHook(({ code }) => useLocationStock(code), { initialProps: { code: "POS_FUNA_UNA" } });
    rerender({ code: "POS_EDITORIAL" });
    resolveFirst([{ productId: "1", locationCode: "POS_FUNA_UNA", stock: 99 }]);
    resolveSecond([{ productId: "1", locationCode: "POS_EDITORIAL", stock: 3 }]);

    await waitFor(() => expect(result.current.data[0]?.locationCode).toBe("POS_EDITORIAL"));
    expect(result.current.data[0].stock).toBe(3);
  });
});
