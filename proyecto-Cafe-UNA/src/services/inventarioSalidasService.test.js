import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "./apiClient";
import {
  crearSolicitudSalidaInventario,
  obtenerSolicitudesSalidaInventario,
  revisarSolicitudSalidaInventario,
} from "./inventarioSalidasService";

vi.mock("./apiClient", () => ({ apiRequest: vi.fn() }));

describe("inventory exit request service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a request through the approval-controlled endpoint", async () => {
    const payload = {
      tipo: "donacion",
      fechaSalida: "2026-10-27",
      destinatario: "Fundación Café UNA",
      responsable: "Ana Solís",
      items: [{ productoId: "101", cantidad: 2 }],
    };
    apiRequest.mockResolvedValue({ Id: "44" });

    await crearSolicitudSalidaInventario(payload);

    expect(apiRequest).toHaveBeenCalledWith(
      `${import.meta.env.BACKEND_URL}/inventario/salidas-solicitudes`,
      expect.objectContaining({ method: "POST", data: payload }),
    );
  });

  it("filters the request history by encoded status", async () => {
    apiRequest.mockResolvedValue({ value: [{ Id: "44" }] });

    await expect(obtenerSolicitudesSalidaInventario("pendiente revisión")).resolves.toEqual([{ Id: "44" }]);

    expect(apiRequest).toHaveBeenCalledWith(
      `${import.meta.env.BACKEND_URL}/inventario/salidas-solicitudes?estado=pendiente%20revisi%C3%B3n`,
      expect.any(Object),
    );
  });

  it("rejects unsupported review actions without making a request", async () => {
    await expect(revisarSolicitudSalidaInventario("44", "delete")).rejects.toThrow("La acción de revisión no es válida.");
    expect(apiRequest).not.toHaveBeenCalled();
  });
});
