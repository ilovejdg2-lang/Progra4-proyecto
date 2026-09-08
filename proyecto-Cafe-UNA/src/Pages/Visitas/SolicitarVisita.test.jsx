import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SolicitarVisita } from "./SolicitarVisita";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
  useNavigate: () => vi.fn(),
}));

vi.mock("../../services/sessionService", () => ({
  getActiveSessionUser: () => ({ email: "test@ejemplo.com", roles: ["Cliente"] }),
}));

vi.mock("../../services/visitasService", () => ({
  crearSolicitudVisita: vi.fn(() =>
    Promise.resolve({
      id: "999",
      encargadoNombre: "Pedro Ramírez",
      encargadoEmail: "pedro@ejemplo.com",
      fechaVisita: "2026-11-10",
      cantidadVisitantes: 5,
    }),
  ),
}));

describe("SolicitarVisita Component", () => {
  it("renderiza el formulario de solicitud de visitas grupales", () => {
    render(<SolicitarVisita />);
    expect(screen.getByText(/Solicitud de Visitas Grupales/i)).toBeInTheDocument();
    expect(screen.getByText(/Información del Encargado/i)).toBeInTheDocument();
  });

  it("bloquea el avance si faltan campos obligatorios", () => {
    render(<SolicitarVisita />);
    const btnEnviar = screen.getByRole("button", { name: /Enviar Solicitud/i });
    fireEvent.click(btnEnviar);

    expect(screen.getAllByText(/obligatorio/i)[0]).toBeInTheDocument();
  });
});
