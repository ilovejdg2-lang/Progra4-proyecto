import { fireEvent, render, screen } from "@testing-library/react";
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

vi.mock("../../services/informacionService", () => ({
  obtenerSeccion: () => Promise.resolve(null),
}));

vi.mock("../../services/cedulaService", () => ({
  consultarCedulaDetallada: vi.fn(),
}));

vi.mock("../../services/voluntariadoService", () => ({
  crearSolicitud: vi.fn(),
}));

vi.mock("../../services/voluntariadoFechasService", () => ({
  ZONA_HORARIA_PREDETERMINADA: "America/Costa_Rica",
  obtenerConfigFechas: () => Promise.resolve({ zonaHoraria: "America/Costa_Rica" }),
  obtenerFechasDisponibles: () => Promise.resolve([]),
  obtenerHoyIso: () => "2026-01-01",
  obtenerResumenTipos: () => Promise.resolve({}),
}));

import SolicitarVoluntariado from "./SolicitarVoluntariado";

describe("SolicitarVoluntariado", () => {
  beforeEach(() => {
    mockSessionUser = { id: 7, email: "test@ejemplo.com", roles: ["Cliente"] };
    navigateMock.mockReset();
    sessionStorage.clear();
  });

  it("uses the voseo title and lead in the public page header", () => {
    render(<SolicitarVoluntariado />);

    expect(screen.getByRole("heading", { level: 1, name: /sumate a nuestras iniciativas/i })).toBeInTheDocument();
    expect(screen.getByText(/elegí cómo querés participar/i)).toBeInTheDocument();
  });

  it("marks every missing field on submit and links its message", () => {
    render(<SolicitarVoluntariado />);

    fireEvent.click(screen.getByRole("button", { name: /enviar solicitud/i }));

    const nombre = screen.getByLabelText(/^nombre \*/i);
    expect(nombre).toHaveAttribute("aria-invalid", "true");
    const describedBy = nombre.getAttribute("aria-describedby");
    expect(document.getElementById(describedBy)).toHaveTextContent(/ingresá el nombre/i);
    expect(screen.getByLabelText(/^primer apellido \*/i)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/^teléfono|^número de teléfono/i)).toHaveAttribute("aria-invalid", "true");
  });

  it("asks for the member list only for group requests", () => {
    render(<SolicitarVoluntariado />);

    expect(screen.queryByLabelText(/cantidad de participantes/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /grupal/i }));

    expect(screen.getByLabelText(/cantidad de participantes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lista de integrantes del grupo/i)).toBeInTheDocument();
  });

  it("keeps the submit button disabled with a login prompt when there is no session", () => {
    mockSessionUser = null;
    render(<SolicitarVoluntariado />);

    expect(screen.getByRole("button", { name: /iniciá sesión para enviar/i })).toBeDisabled();
  });

  it("sends the person to login when they touch the form without a session", () => {
    mockSessionUser = null;
    render(<SolicitarVoluntariado />);

    fireEvent.focus(screen.getByLabelText(/^nombre \*/i));

    expect(sessionStorage.getItem("postLoginRedirect")).toBe("/voluntariado/solicitar");
    expect(navigateMock).toHaveBeenCalledWith({ to: "/login" });
  });
});
