import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigateMock = vi.fn();
let mockSessionUser = { id: 7, email: "test@ejemplo.com", roles: ["Cliente"] };

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, onClick, className }) => (
    <a href={to} onClick={onClick} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => navigateMock,
  useParams: () => ({}),
  useRouterState: ({ select }) => select({ location: { search: {} } }),
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

vi.mock("../../hooks/useCatalogo", () => ({
  useCatalogo: (_tipo, respaldo) => respaldo,
}));

vi.mock("../../services/sessionService", () => ({
  getActiveSessionUser: () => mockSessionUser,
}));

vi.mock("../../services/informacionService", () => ({
  obtenerSeccion: () => Promise.resolve(null),
}));

vi.mock("../../services/cedulaService", () => ({
  consultarCedulaDetallada: vi.fn(),
}));

vi.mock("../../services/donacionesService", () => ({
  enviarSolicitudDonacion: vi.fn(),
  obtenerNecesidadesPublicas: () =>
    Promise.resolve([
      {
        id: 4,
        estado: "ACTIVA",
        titulo: "Herramientas",
        materiales: [{ id: 9, nombre: "Palas", estado: "ACTIVA" }],
      },
    ]),
  obtenerFechasRecepcionDisponibles: () =>
    Promise.resolve([{ fecha: "2099-12-31", habilitada: true, horarios: ["8:00 a. m. - 12:00 m. d."] }]),
}));

import SolicitarDonacion from "./SolicitarDonacion";

describe("SolicitarDonacion", () => {
  beforeEach(() => {
    mockSessionUser = { id: 7, email: "test@ejemplo.com", roles: ["Cliente"] };
    navigateMock.mockReset();
    sessionStorage.clear();
  });

  it("uses the public page header and lists the active needs", async () => {
    render(<SolicitarDonacion />);

    expect(screen.getByRole("heading", { level: 1, name: /solicitud de donación/i })).toBeInTheDocument();
    expect(await screen.findByText("Palas")).toBeInTheDocument();
  });

  it("marks every missing field on submit with a linked message", async () => {
    render(<SolicitarDonacion />);

    fireEvent.click(screen.getByRole("button", { name: /enviar solicitud/i }));

    const nombre = screen.getByLabelText(/^nombre \*/i);
    expect(nombre).toHaveAttribute("aria-invalid", "true");
    expect(document.getElementById(nombre.getAttribute("aria-describedby"))).toHaveTextContent(
      /ingresá el nombre/i,
    );
    expect(screen.getByLabelText(/^descripción detallada/i)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("checkbox", { name: /certifico que los artículos/i })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("switches the donor fields when the donor is an organization", () => {
    render(<SolicitarDonacion />);

    expect(screen.getByLabelText(/^primer apellido/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /^organización$/i }));

    expect(screen.getByLabelText(/^razón social/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^primer apellido/i)).not.toBeInTheDocument();
  });

  it("shows the reception calendar and an info note for personal delivery, and a note for pickup", async () => {
    render(<SolicitarDonacion />);

    fireEvent.click(screen.getByRole("radio", { name: /lo entregaré personalmente/i }));
    expect(await screen.findByText(/día de entrega/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: /solicito recolección/i }));
    await waitFor(() => expect(screen.queryByText(/día de entrega/i)).not.toBeInTheDocument());
    expect(screen.getByText(/no garantiza que la recolección sea aprobada/i)).toBeInTheDocument();
  });

  it("keeps the submit button disabled with a login prompt when there is no session", () => {
    mockSessionUser = null;
    render(<SolicitarDonacion />);

    expect(screen.getByRole("button", { name: /iniciá sesión para enviar/i })).toBeDisabled();
  });
});
