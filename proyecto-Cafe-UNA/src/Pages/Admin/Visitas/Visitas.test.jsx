import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const obtenerMock = vi.fn();
const actualizarMock = vi.fn();
const eliminarMock = vi.fn();
const obtenerDisponibilidadMock = vi.fn();
const crearDisponibilidadMock = vi.fn();
const actualizarDisponibilidadMock = vi.fn();

vi.mock("../../../hooks/useAdminPageGate", () => ({
  useAdminPageGate: () => ({
    showLoading: false,
    loadingMessage: "",
  }),
}));

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
  encargadoTelefono: "8888-8888",
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
    window.history.replaceState({}, "", "/admin/visitas");
    obtenerMock.mockReset().mockResolvedValue([request]);
    actualizarMock.mockReset();
    eliminarMock.mockReset();
    obtenerDisponibilidadMock.mockReset().mockResolvedValue([slot]);
    crearDisponibilidadMock.mockReset();
    actualizarDisponibilidadMock.mockReset();
  });

  it("loads visits and updates their state through the details modal", async () => {
    actualizarMock.mockResolvedValueOnce({ ...request, estado: "Aprobada" });
    render(<AdminVisitas />);

    const matching = await screen.findAllByText("Ana López");
    expect(matching.length).toBeGreaterThanOrEqual(1);

    // Abre el modal de detalle
    fireEvent.click(screen.getByLabelText("Ver solicitud 41"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Aprueba la solicitud desde las acciones del modal
    fireEvent.click(screen.getByRole("button", { name: "Aprobar" }));

    await waitFor(() =>
      expect(actualizarMock).toHaveBeenCalledWith("41", {
        Estado: "Aprobada",
        Observaciones: "",
      }),
    );
    expect(await screen.findByText(/actualizada correctamente/i)).toBeInTheDocument();
  });

  it("soft-deletes a visit immediately without confirm dialog", async () => {
    eliminarMock.mockResolvedValueOnce({ message: "Solicitud inactivada" });
    const confirmSpy = vi.spyOn(window, "confirm");
    render(<AdminVisitas />);

    const matching = await screen.findAllByText("Ana López");
    expect(matching.length).toBeGreaterThanOrEqual(1);

    // Abre el modal y presiona Inactivar
    fireEvent.click(screen.getByLabelText("Ver solicitud 41"));
    fireEvent.click(screen.getByRole("button", { name: /inactivar/i }));

    // Se inactiva inmediatamente sin alerta de confirmación
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.queryByText("Ana López")).not.toBeInTheDocument();
    await waitFor(() => expect(eliminarMock).toHaveBeenCalledWith("41"));
    vi.restoreAllMocks();
  });

  it("opens edit modal and saves changes", async () => {
    actualizarMock.mockResolvedValueOnce({ ...request, encargadoNombre: "Ana López Editada" });
    render(<AdminVisitas />);

    const matching = await screen.findAllByText("Ana López");
    expect(matching.length).toBeGreaterThanOrEqual(1);

    // Abre el modal de edición
    fireEvent.click(screen.getByLabelText("Editar solicitud 41"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/modificá los datos del grupo o encargado/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }));
    await waitFor(() =>
      expect(actualizarMock).toHaveBeenCalledWith(
        "41",
        expect.objectContaining({
          EncargadoNombre: "Ana López",
        }),
      ),
    );
  });

  it("creates an administrated visit slot", async () => {
    crearDisponibilidadMock.mockResolvedValueOnce({ ...slot, id: "6" });
    render(<AdminVisitas />);

    fireEvent.click(screen.getByRole("button", { name: /gestión de fechas/i }));
    await screen.findByText(/recorrido por la finca/i);

    fireEvent.click(screen.getAllByRole("button", { name: /nuevo horario/i })[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/^fecha \*/i), { target: { value: "2099-06-01" } });
    fireEvent.change(screen.getByLabelText(/hora de inicio \*/i), { target: { value: "09:00" } });
    fireEvent.change(screen.getByLabelText(/hora de fin \*/i), { target: { value: "10:00" } });
    fireEvent.change(screen.getByLabelText(/indicaciones o notas/i), { target: { value: "Llegar temprano" } });
    fireEvent.click(screen.getByRole("button", { name: /crear horario/i }));

    await waitFor(() =>
      expect(crearDisponibilidadMock).toHaveBeenCalledWith({
        fecha: "2099-06-01",
        horaInicio: "09:00:00",
        horaFin: "10:00:00",
        habilitada: true,
        nota: "Llegar temprano",
      }),
    );
  });

  it("disables an existing visit slot", async () => {
    actualizarDisponibilidadMock.mockResolvedValueOnce({ ...slot, habilitada: false });
    render(<AdminVisitas />);

    fireEvent.click(screen.getByRole("button", { name: /gestión de fechas/i }));
    await screen.findByText(/recorrido por la finca/i);
    fireEvent.click(screen.getByRole("button", { name: /deshabilitar/i }));

    await waitFor(() =>
      expect(actualizarDisponibilidadMock).toHaveBeenCalledWith("5", { habilitada: false }),
    );
    expect(await screen.findByText("Deshabilitado")).toBeInTheDocument();
  });

  it("opens details modal to inspect group visit request", async () => {
    render(<AdminVisitas />);
    const matching = await screen.findAllByText("Ana López");
    expect(matching.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByLabelText("Ver solicitud 41"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/datos de la solicitud/i)).toBeInTheDocument();
  });
});
