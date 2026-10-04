import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const crearSolicitudVisitaMock = vi.fn();
const obtenerDisponibilidadMock = vi.fn();
const obtenerFranjasMock = vi.fn();
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
  obtenerFranjasHorariasPorFecha: (...args) => obtenerFranjasMock(...args),
  obtenerUrlInstructivoPdf: () => "/visitas/solicitudes/instructivo-pdf",
  formatearHora12: (hora) => {
    if (!hora) return "--:--";
    const [hhStr, mmStr] = String(hora).split(":");
    let h = parseInt(hhStr, 10);
    const m = mmStr || "00";
    if (isNaN(h)) return hora;
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  },
}));

vi.mock("../../services/cedulaService", () => ({
  consultarCedulaDetallada: (...args) => consultarCedulaMock(...args),
}));

import SolicitarVisita from "./SolicitarVisita";

function elegirOpcion(etiqueta, opcion) {
  fireEvent.click(screen.getByLabelText(etiqueta));
  fireEvent.pointerDown(screen.getByRole("option", { name: opcion }));
}

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
        capacidadMaxima: 30,
        cupoRestante: 26,
        agotada: false,
      },
    ]);
    obtenerFranjasMock.mockReset().mockResolvedValue([]);
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
    await waitFor(() => expect(consultarCedulaMock).toHaveBeenCalledWith("111111111"));
    fireEvent.change(screen.getByLabelText(/^nombre \*/i), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText(/^primer apellido/i), { target: { value: "López" } });
    fireEvent.change(screen.getByLabelText(/^segundo apellido/i), { target: { value: "Mora" } });
    fireEvent.change(screen.getByLabelText(/^correo electrónico/i), { target: { value: "ana@ejemplo.com" } });
    fireEvent.change(screen.getByLabelText(/^teléfono/i), { target: { value: "8888-7777" } });

    // Nacional geographic selectors
    elegirOpcion(/^provincia \*/i, "Heredia");
    elegirOpcion(/^cantón \*/i, "Barva");

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
        encargadoIdentificacion: "111111111",
        encargadoTipoIdentificacion: "cedula",
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

  it("autocompletes names for a DIMEX after choosing that type", async () => {
    consultarCedulaMock.mockResolvedValueOnce({
      nombre: "MARIA",
      primerApellido: "GOMEZ",
      segundoApellido: "",
    });

    render(<SolicitarVisita />);

    elegirOpcion(/tipo de identificación/i, "DIMEX");
    fireEvent.change(screen.getByLabelText(/^identificación/i), { target: { value: "155812345678" } });

    await waitFor(() => expect(consultarCedulaMock).toHaveBeenCalledWith("155812345678"));
    await waitFor(() => expect(screen.getByLabelText(/^nombre \*/i)).toHaveValue("MARIA"));
  });

  it("handles international visitor mode with free text fields", async () => {
    crearSolicitudVisitaMock.mockResolvedValueOnce({ id: "99", estado: "Pendiente" });
    render(<SolicitarVisita />);

    elegirOpcion(/tipo de visitante/i, "Internacional");

    expect(screen.getByLabelText(/país de procedencia \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/provincia o estado \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ciudad \*/i)).toBeInTheDocument();

    elegirOpcion(/tipo de identificación/i, "Pasaporte");
    elegirOpcion(/país de origen/i, /^estados unidos$/i);
    fireEvent.change(screen.getByLabelText(/^identificación/i), { target: { value: "passport-123" } });
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
        encargadoIdentificacion: "PASSPORT123",
        encargadoTipoIdentificacion: "pasaporte",
        encargadoNacionalidad: "US",
        tipoVisitante: "Internacional",
        paisProcedencia: "Estados Unidos",
        ciudadProvincia: "California, San Francisco",
      }),
    );
  });

  it("renders recommendations card, opens modal, and provides PDF download button", async () => {
    render(<SolicitarVisita />);

    expect(screen.getByText(/recomendaciones para la visita/i)).toBeInTheDocument();
    expect(screen.getByText(/calzado cerrado obligatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/hidratación continua/i)).toBeInTheDocument();
    expect(screen.getByText(/vestimenta y protección/i)).toBeInTheDocument();
    expect(screen.getByText(/zonas de parqueo/i)).toBeInTheDocument();

    const pdfLink = screen.getByRole("link", { name: /descargar instructivo en pdf/i });
    expect(pdfLink).toHaveAttribute("href", "/visitas/solicitudes/instructivo-pdf");

    const modalButton = screen.getByRole("button", { name: /ver recomendaciones detalladas/i });
    fireEvent.click(modalButton);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/instructivo de recomendaciones y seguridad/i)).toBeInTheDocument();

    const closeButton = screen.getByRole("button", { name: /entendido, cerrar/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("displays remaining capacity per slot and disables exhausted slots", async () => {
    obtenerDisponibilidadMock.mockResolvedValueOnce([
      {
        id: "slot-disponible",
        fecha: "2099-12-31",
        horaInicio: "09:00:00",
        horaFin: "10:00:00",
        habilitada: true,
        capacidadMaxima: 30,
        cupoRestante: 12,
        agotada: false,
      },
      {
        id: "slot-agotado",
        fecha: "2099-12-31",
        horaInicio: "10:30:00",
        horaFin: "11:30:00",
        habilitada: true,
        capacidadMaxima: 30,
        cupoRestante: 0,
        agotada: true,
      },
    ]);

    render(<SolicitarVisita />);

    const disponibleRadio = await screen.findByRole("radio", { name: /09:00/i });
    expect(disponibleRadio).not.toBeDisabled();
    expect(screen.getByText(/12 cupos disponibles/i)).toBeInTheDocument();

    const agotadoRadio = screen.getByRole("radio", { name: /10:30/i });
    expect(agotadoRadio).toBeDisabled();
    expect(screen.getByText(/cupo agotado/i)).toBeInTheDocument();
  });
});
