import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({ obtenerUbicaciones: vi.fn() }));
vi.mock("../services/productosService", () => serviceMocks);

import { useInventoryLocations } from "./useInventoryLocations";

describe("useInventoryLocations", () => {
  beforeEach(() => serviceMocks.obtenerUbicaciones.mockReset());

  it("returns POS locations from the API excluding Bodega Central", async () => {
    serviceMocks.obtenerUbicaciones.mockResolvedValue([
      { code: "POS_STAND_FERIAS", name: "Stand Ferias", activo: true },
      { code: "BODEGA_CENTRAL", name: "Bodega Central", activo: true },
      { code: "POS_EDITORIAL", name: "Editorial", activo: false },
      { code: "POS_FUNA_UNA", name: "FUNA-UNA", activo: true },
      { code: "POS_NUEVO", name: "Kiosco Norte", activo: true },
    ]);

    const { result } = renderHook(() => useInventoryLocations());
    await waitFor(() => expect(result.current.status).toBe("success"));

    expect(result.current.data.map((location) => location.code)).toEqual([
      "POS_EDITORIAL",
      "POS_FUNA_UNA",
      "POS_NUEVO",
      "POS_STAND_FERIAS",
    ]);
    expect(result.current.data.some((location) => location.code === "BODEGA_CENTRAL")).toBe(false);
  });

  it("keeps the previous data and success status while refetching", async () => {
    serviceMocks.obtenerUbicaciones.mockResolvedValueOnce([{ code: "POS_A", name: "A", activo: true }]);
    const { result } = renderHook(() => useInventoryLocations());
    await waitFor(() => expect(result.current.status).toBe("success"));

    let resolveSecond;
    serviceMocks.obtenerUbicaciones.mockReturnValueOnce(new Promise((resolve) => { resolveSecond = resolve; }));
    let pending;
    act(() => { pending = result.current.retry(); });

    expect(result.current.loading).toBe(false);
    expect(result.current.refreshing).toBe(true);
    expect(result.current.data.map((location) => location.code)).toEqual(["POS_A"]);

    await act(async () => {
      resolveSecond([{ code: "POS_A", name: "A", activo: false }]);
      await pending;
    });
    expect(result.current.refreshing).toBe(false);
    expect(result.current.data[0].activo).toBe(false);
  });
});
