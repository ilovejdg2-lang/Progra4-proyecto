import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const crearSolicitudVisitaMock = vi.fn();
const obtenerDisponibilidadMock = vi.fn();
const consultarCedulaMock = vi.fn();
const navigateMock = vi.fn();

let mockSessionUser = { id: 7, email: "test@ejemplo.com", roles: ["Cliente"] };

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, onClick, className }) => (
    <a href={to} onClick={onClick} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => navigateMock,
}));

vi.mock("../../hooks/usePaintPublicPage", () => ({
  usePaintPublicPage: () => ({
    ref: { current: null },
    showLoading: false,
    showPrepaint: false,
    inert: false,
    loadingMessage: "",
  }),
}));
vi.mock("../../services/sessionService", () => ({
  getActiveSessionUser: () => mockSessionUser,
}));

vi.mock("../../services/visitasService", () => ({
  crearSolicitudVisita: (...args) => crearSolicitudVisitaMock(...args),
  obtenerDisponibilidadVisitasPublica: (...args) => obtenerDisponibilidadMock(...args),
}));

vi.mock("../../services/cedulaService", () => ({
  consultarCedulaDetallada: (...args) => consultarCedulaMock(...args),
}));

import SolicitarVisita from "./SolicitarVisita";

describe("SolicitarVisita", () => {
  beforeEach(() => {
    mockSessionUser = { id: 7, email: "test@ejemplo.com", roles: ["Cliente"] };
    crearSolicitudVisitaMock.mockReset();
    obtenerDisponibilidadMock.mockReset().mockResolvedValue([
      {
        id: "12",
        fecha: "2099-12-31",
        horaInicio: "09:00:00",
        horaFin: "10:00:00",
        habilitada: true,
        nota: "Llegar 10 minutos antes",
      },
    ]);
    consultarCedulaMock.mockReset();
    navigateMock.mockReset();
    sessionStorage.clear();
  });

  it("shows validation instead of sending an incomplete group request", async () => {
    render(<SolicitarVisita />);

    fireEvent.click(screen.getByRole("button", { name: /enviar solicitud/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/completá los campos obligatorios/i);
    expect(crearSolicitudVisitaMock).not.toHaveBeenCalled();
  });

  it("submits the backend-compatible visit payload", async () => {
    crearSolicitudVisitaMock.mockResolvedValueOnce({ id: "31", estado: "Pendiente" });
    render(<SolicitarVisita />);

    fireEvent.change(screen.getByLabelText(/^identificación/i), { target: { value: "1-1111-1111" } });
    fireEvent.change(screen.getByLabelText(/^nombre \*/i), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText(/^primer apellido/i), { target: { value: "López" } });
    fireEvent.change(screen.getByLabelText(/^segundo apellido/i), { target: { value: "Mora" } });
    fireEvent.change(screen.getByLabelText(/^correo electrónico/i), { target: { value: "ana@ejemplo.com" } });
    fireEvent.change(screen.getByLabelText(/^teléfono/i), { target: { value: "8888-7777" } });

    // Nacional geographic selectors
    fireEvent.change(screen.getByLabelText(/^provincia \*/i), { target: { value: "Heredia" } });
    fireEvent.change(screen.getByLabelText(/^cantón \*/i), { target: { value: "Barva" } });

    fireEvent.change(screen.getByLabelText(/cantidad de visitantes/i), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText(/tipo de grupo/i), { target: { value: "Universidad" } });

    // Select turno/slot
    const slotRadio = await screen.findByRole("radio", { name: /09:00/i });
    fireEvent.click(slotRadio);

    fireEvent.change(screen.getByLabelText(/motivo de la visita/i), { target: { value: "Académica" } });

    fireEvent.click(screen.getByRole("button", { name: /enviar solicitud/i }));

    await waitFor(() => expect(crearSolicitudVisitaMock).toHaveBeenCalledTimes(1));
    expect(crearSolicitudVisitaMock).toHaveBeenCalledWith(
      expect.objectContaining({
        encargadoNombre: "Ana López Mora",
        encargadoIdentificacion: "1-1111-1111",
        encargadoEmail: "ana@ejemplo.com",
        encargadoTelefono: "8888-7777",
        ciudadProvincia: "Heredia, Barva",
        paisProcedencia: "Costa Rica",
        cantidadVisitantes: "4",
        disponibilidadVisitaId: "12",
      }),
    );
    expect(await screen.findByText(/solicitud #31/i)).toBeInTheDocument();
  });

  it("offers only API-provided slots and removes the obsolete guide request", async () => {
    render(<SolicitarVisita />);

    const slotOption = await screen.findByRole("radio", { name: /09:00/i });
    expect(slotOption).toBeInTheDocument();
    fireEvent.click(slotOption);

    expect(screen.queryByLabelText(/guía/i)).not.toBeInTheDocument();
    expect(screen.getByText(/vestimenta cómoda/i)).toBeInTheDocument();
    expect(screen.getByText(/repelente/i)).toBeInTheDocument();
    expect(screen.getByText(/protección solar/i)).toBeInTheDocument();
    expect(screen.getByText(/llegar 10 minutos antes/i)).toBeInTheDocument();
  });

  it("prevents submission when no visit slots are available", async () => {
    obtenerDisponibilidadMock.mockResolvedValueOnce([]);
    render(<SolicitarVisita />);

    expect(await screen.findByText(/no hay fechas y horarios habilitados/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enviar solicitud/i })).toBeDisabled();
  });

  it("renders 'Parqueo' label instead of 'Parqueo para bus'", () => {
    render(<SolicitarVisita />);
    expect(screen.getByLabelText("Parqueo")).toBeInTheDocument();
    expect(screen.queryByLabelText(/parqueo para bus/i)).not.toBeInTheDocument();
  });

  it("redirects unauthenticated user to login upon interacting with the form", () => {
    mockSessionUser = null;
    render(<SolicitarVisita />);

    // Form is fully visible even when not logged in
    expect(screen.getByText(/debe iniciar sesión para enviar su solicitud de visita/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enviar solicitud/i })).toBeInTheDocument();

    // User attempts to focus on an input field
    const inputNombre = screen.getByLabelText(/^nombre \*/i);
    fireEvent.focus(inputNombre);

    expect(sessionStorage.getItem("postLoginRedirect")).toBe("/visitas/solicitar");
    expect(navigateMock).toHaveBeenCalledWith({ to: "/login" });
  });

  it("autocompletes names when entering a valid 9-digit cédula", async () => {
    consultarCedulaMock.mockResolvedValueOnce({
      nombre: "CARLOS",
      primerApellido: "RAMIREZ",
      segundoApellido: "SOLIS",
    });

    render(<SolicitarVisita />);

    const idInput = screen.getByLabelText(/^identificación/i);
    fireEvent.change(idInput, { target: { value: "112340567" } });

    await waitFor(() => expect(consultarCedulaMock).toHaveBeenCalledWith("112340567"));

    await waitFor(() => {
      expect(screen.getByLabelText(/^nombre \*/i)).toHaveValue("CARLOS");
      expect(screen.getByLabelText(/^primer apellido/i)).toHaveValue("RAMIREZ");
      expect(screen.getByLabelText(/^segundo apellido/i)).toHaveValue("SOLIS");
    });
    expect(screen.getByText(/datos cargados automáticamente/i)).toBeInTheDocument();
  });

  it("handles international visitor mode with free text fields", async () => {
    crearSolicitudVisitaMock.mockResolvedValueOnce({ id: "99", estado: "Pendiente" });
    render(<SolicitarVisita />);

    fireEvent.change(screen.getByLabelText(/tipo de visitante/i), {
      target: { value: "Internacional" },
    });

    expect(screen.getByLabelText(/país de procedencia \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/provincia o estado \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ciudad \*/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^identificación/i), { target: { value: "PASSPORT-123" } });
    fireEvent.change(screen.getByLabelText(/^nombre \*/i), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText(/^primer apellido/i), { target: { value: "Doe" } });
    fireEvent.change(screen.getByLabelText(/^correo electrónico/i), { target: { value: "john@example.com" } });
    fireEvent.change(screen.getByLabelText(/^teléfono/i), { target: { value: "+1-555-0199" } });
    fireEvent.change(screen.getByLabelText(/país de procedencia \*/i), { target: { value: "Estados Unidos" } });
    fireEvent.change(screen.getByLabelText(/provincia o estado \*/i), { target: { value: "California" } });
    fireEvent.change(screen.getByLabelText(/ciudad \*/i), { target: { value: "San Francisco" } });
    fireEvent.change(screen.getByLabelText(/cantidad de visitantes/i), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText(/tipo de grupo/i), { target: { value: "Investigadores" } });

    const slotRadio = await screen.findByRole("radio", { name: /09:00/i });
    fireEvent.click(slotRadio);

    fireEvent.change(screen.getByLabelText(/motivo de la visita/i), { target: { value: "Gira de campo" } });

    fireEvent.click(screen.getByRole("button", { name: /enviar solicitud/i }));

    await waitFor(() => expect(crearSolicitudVisitaMock).toHaveBeenCalledTimes(1));
    expect(crearSolicitudVisitaMock).toHaveBeenCalledWith(
      expect.objectContaining({
        encargadoNombre: "John Doe",
        encargadoIdentificacion: "PASSPORT-123",
        tipoVisitante: "Internacional",
        paisProcedencia: "Estados Unidos",
        ciudadProvincia: "California, San Francisco",
      }),
    );
  });
});
