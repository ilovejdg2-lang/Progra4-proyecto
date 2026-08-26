import { renderHook, waitFor } from "@testing-library/react";
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
});
