import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const obtenerMock = vi.fn();
const actualizarMock = vi.fn();
const eliminarMock = vi.fn();

vi.mock("../../../services/sessionService", () => ({
  getActiveSessionUser: () => ({ role: "admin", roles: ["Admin"] }),
}));
vi.mock("../../../services/visitasService", () => ({
  obtenerSolicitudesVisitas: (...args) => obtenerMock(...args),
  actualizarSolicitudVisita: (...args) => actualizarMock(...args),
  eliminarSolicitudVisita: (...args) => eliminarMock(...args),
}));
vi.mock("../layouts/AdminLayout", () => ({
  AdminLayout: ({ children }) => <div>{children}</div>,
}));

import AdminVisitas from "./Visitas";

const request = {
  id: "41",
  encargadoNombre: "Ana López",
  encargadoEmail: "ana@ejemplo.com",
  cantidadVisitantes: 4,
  fechaVisita: "2099-12-31",
  estado: "Pendiente",
  tipoGrupo: "Universidad",
  ciudadProvincia: "Heredia",
};

describe("AdminVisitas", () => {
  beforeEach(() => {
    obtenerMock.mockReset().mockResolvedValue([request]);
    actualizarMock.mockReset();
    eliminarMock.mockReset();
  });

  it("loads visits and updates their state", async () => {
    actualizarMock.mockResolvedValueOnce({ ...request, estado: "Aprobada" });
    render(<AdminVisitas />);

    expect(await screen.findByText("Ana López")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Estado de solicitud 41"), {
      target: { value: "Aprobada" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar estado de solicitud 41" }));

    await waitFor(() =>
      expect(actualizarMock).toHaveBeenCalledWith("41", { Estado: "Aprobada" }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(/actualizada/i);
  });

  it("soft-deletes a visit after confirmation", async () => {
    eliminarMock.mockResolvedValueOnce({ message: "Solicitud inactivada" });
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    render(<AdminVisitas />);

    expect(await screen.findByText("Ana López")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Inactivar solicitud 41" }));

    await waitFor(() => expect(eliminarMock).toHaveBeenCalledWith("41"));
    expect(screen.queryByText("Ana López")).not.toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
