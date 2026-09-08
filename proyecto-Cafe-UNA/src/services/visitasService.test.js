import { beforeEach, describe, expect, it, vi } from "vitest";

const apiRequestMock = vi.fn();
vi.mock("./apiClient", () => ({ apiRequest: (...args) => apiRequestMock(...args) }));

import {
  actualizarSolicitudVisita,
  crearSolicitudVisita,
  eliminarSolicitudVisita,
  normalizarVisita,
  obtenerSolicitudesVisitaDeUsuario,
  obtenerSolicitudesVisitas,
} from "./visitasService";

describe("visitasService", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it("normalizes both backend casing variants", () => {
    expect(
      normalizarVisita({
        Id: 15,
        EncargadoNombre: " Ana López ",
        EncargadoEmail: "ana@ejemplo.com",
        CantidadVisitantes: 4,
        Estado: "Pendiente",
      }),
    ).toMatchObject({
      id: "15",
      encargadoNombre: "Ana López",
      encargadoEmail: "ana@ejemplo.com",
      cantidadVisitantes: 4,
      estado: "Pendiente",
    });

    expect(normalizarVisita({ id: "16", estado: "Aprobada" })).toMatchObject({
      id: "16",
      estado: "Aprobada",
    });
    expect(normalizarVisita({})).toBeNull();
  });

  it("creates a visit using the backend PascalCase payload", async () => {
    apiRequestMock.mockResolvedValueOnce({ id: "21", estado: "Pendiente" });

    await expect(
      crearSolicitudVisita({
        encargadoNombre: "Ana",
        encargadoIdentificacion: "1-1111-1111",
        encargadoEmail: "ana@ejemplo.com",
        encargadoTelefono: "8888-7777",
        tipoVisitante: "Nacional",
        ciudadProvincia: "Heredia",
        cantidadVisitantes: "4",
        tipoGrupo: "Universidad",
        fechaVisita: "2026-12-01",
        horaPreferida: "09:00",
        motivoVisita: "Académica",
      }),
    ).resolves.toMatchObject({ id: "21", estado: "Pendiente" });

    expect(apiRequestMock).toHaveBeenCalledWith(
      expect.stringContaining("/visitas/solicitudes"),
      expect.objectContaining({
        method: "POST",
        data: expect.objectContaining({
          EncargadoNombre: "Ana",
          CantidadVisitantes: 4,
          FechaVisita: "2026-12-01",
        }),
      }),
    );
  });

  it("loads filtered admin and user lists", async () => {
    apiRequestMock
      .mockResolvedValueOnce([{ id: 1, estado: "Pendiente" }])
      .mockResolvedValueOnce([{ id: 2, estado: "Aprobada" }]);

    await expect(
      obtenerSolicitudesVisitas({ estado: "Pendiente", busqueda: "Ana" }),
    ).resolves.toEqual([expect.objectContaining({ id: "1" })]);
    expect(apiRequestMock.mock.calls[0][0]).toContain("estado=Pendiente");
    expect(apiRequestMock.mock.calls[0][0]).toContain("busqueda=Ana");

    await expect(obtenerSolicitudesVisitaDeUsuario(7)).resolves.toEqual([
      expect.objectContaining({ id: "2" }),
    ]);
    expect(apiRequestMock.mock.calls[1][0]).toContain("/usuario/7");
  });

  it("updates and soft-deletes a visit", async () => {
    apiRequestMock.mockResolvedValueOnce({ id: 8, estado: "Rechazada" }).mockResolvedValueOnce({
      message: "Solicitud inactivada",
    });

    await expect(
      actualizarSolicitudVisita(8, { Estado: "Rechazada" }),
    ).resolves.toMatchObject({ id: "8", estado: "Rechazada" });
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/visitas/solicitudes/8"),
      expect.objectContaining({ method: "PUT", data: { Estado: "Rechazada" } }),
    );

    await expect(eliminarSolicitudVisita(8)).resolves.toMatchObject({
      message: "Solicitud inactivada",
    });
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/visitas/solicitudes/8"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
