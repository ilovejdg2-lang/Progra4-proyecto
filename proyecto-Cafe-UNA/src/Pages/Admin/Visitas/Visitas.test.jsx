import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const obtenerMock = vi.fn();
const actualizarMock = vi.fn();
const eliminarMock = vi.fn();
const obtenerDisponibilidadMock = vi.fn();
const crearDisponibilidadMock = vi.fn();
const actualizarDisponibilidadMock = vi.fn();

vi.mock("../../../services/sessionService", () => ({
  getActiveSessionUser: () => ({ role: "admin", roles: ["Admin"] }),
}));
vi.mock("../../../services/visitasService", () => ({
  obtenerSolicitudesVisitas: (...args) => obtenerMock(...args),
  actualizarSolicitudVisita: (...args) => actualizarMock(...args),
  eliminarSolicitudVisita: (...args) => eliminarMock(...args),
  obtenerDisponibilidadVisitasAdmin: (...args) => obtenerDisponibilidadMock(...args),
  crearDisponibilidadVisita: (...args) => crearDisponibilidadMock(...args),
  actualizarDisponibilidadVisita: (...args) => actualizarDisponibilidadMock(...args),
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

const slot = {
  id: "5",
  fecha: "2099-05-01",
  horaInicio: "09:00:00",
  horaFin: "10:00:00",
  habilitada: true,
  nota: "Recorrido por la finca",
};

describe("AdminVisitas", () => {
  beforeEach(() => {
    obtenerMock.mockReset().mockResolvedValue([request]);
    actualizarMock.mockReset();
    eliminarMock.mockReset();
    obtenerDisponibilidadMock.mockReset().mockResolvedValue([slot]);
    crearDisponibilidadMock.mockReset();
    actualizarDisponibilidadMock.mockReset();
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

  it("creates an administrated visit slot", async () => {
    crearDisponibilidadMock.mockResolvedValueOnce({ ...slot, id: "6" });
    render(<AdminVisitas />);

    await screen.findByText("Recorrido por la finca");
    fireEvent.click(screen.getByRole("button", { name: /nuevo horario/i }));
    expect(screen.getByRole("dialog", { name: /nuevo horario/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/^fecha$/i), { target: { value: "2099-06-01" } });
    fireEvent.change(screen.getByLabelText(/hora de inicio/i), { target: { value: "09:00" } });
    fireEvent.change(screen.getByLabelText(/hora de finalización/i), { target: { value: "10:00" } });
    fireEvent.change(screen.getByLabelText(/indicación para visitantes/i), { target: { value: "Llegar temprano" } });
    fireEvent.click(screen.getByRole("button", { name: /^crear$/i }));

    await waitFor(() => expect(crearDisponibilidadMock).toHaveBeenCalledWith({
      fecha: "2099-06-01",
      horaInicio: "09:00",
      horaFin: "10:00",
      habilitada: true,
      nota: "Llegar temprano",
    }));
  });

  it("disables an existing visit slot", async () => {
    actualizarDisponibilidadMock.mockResolvedValueOnce({ ...slot, habilitada: false });
    render(<AdminVisitas />);

    await screen.findByText("Recorrido por la finca");
    fireEvent.click(screen.getByRole("button", { name: "Inactivar horario 5" }));

    await waitFor(() =>
      expect(actualizarDisponibilidadMock).toHaveBeenCalledWith("5", { habilitada: false }),
    );
    expect(await screen.findByText("Inactivo")).toBeInTheDocument();
  });
});
