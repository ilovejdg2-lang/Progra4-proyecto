import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getActiveSessionUser: vi.fn(),
  navigate: vi.fn(),
  obtenerMisSolicitudes: vi.fn(),
  obtenerDetalleSolicitudPropia: vi.fn(),
  linkProps: [],
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, params, ...rest }) => {
    mocks.linkProps.push({ to, params });
    return (
      <a href={typeof to === "string" ? to : "#"} data-params={JSON.stringify(params || {})} {...rest}>
        {children}
      </a>
    );
  },
  useNavigate: () => mocks.navigate,
}));
vi.mock("lucide-react", () => ({ ArrowLeft: () => null, Eye: () => null }));
vi.mock("../../Components/Admin/ui/AdminModal", () => ({
  AdminModal: ({ children }) => <div>{children}</div>,
  AdminModalBody: ({ children }) => <div>{children}</div>,
  AdminModalHeader: ({ children }) => <div>{children}</div>,
}));
vi.mock("../../Components/Perfil/PerfilClienteLayout", () => ({
  PerfilClienteLayout: ({ children }) => <div>{children}</div>,
}));
vi.mock("../../Components/PublicPageGate/PublicPageGate", () => ({
  PublicPageGate: ({ children }) => children,
}));
vi.mock("../../Components/T/ST", () => ({ ST: ({ children }) => children }));
vi.mock("../../Components/ui/Select", () => ({
  UiSelect: ({ ariaLabel, options = [], value, onChange }) => (
    <label>
      {ariaLabel}
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {options.map((opcion) => (
          <option key={opcion.value} value={opcion.value}>
            {opcion.label}
          </option>
        ))}
      </select>
    </label>
  ),
}));
vi.mock("../../hooks/usePublicPageLoadingGate", () => ({
  usePublicPageLoadingGate: () => false,
}));
vi.mock("../../hooks/useTraducir", () => ({ useTraducir: (text) => text }));
vi.mock("../../lib/permisos", () => ({
  rolesDeUsuario: () => ["Cliente"],
  tienePermiso: () => true,
}));
vi.mock("../../lib/t", () => ({ t: (text) => text }));
vi.mock("../../services/solicitudesService", () => ({
  obtenerMisSolicitudes: (...args) => mocks.obtenerMisSolicitudes(...args),
  obtenerDetalleSolicitudPropia: (...args) =>
    mocks.obtenerDetalleSolicitudPropia(...args),
}));
vi.mock("../../services/sessionService", () => ({
  SESSION_UPDATED_EVENT: "session-updated",
  getActiveSessionUser: (...args) => mocks.getActiveSessionUser(...args),
}));

import { HistorialSolicitudesContent } from "./HistorialSolicitudesCliente";

describe("HistorialSolicitudesContent", () => {
  beforeEach(() => {
    mocks.linkProps.length = 0;
    mocks.getActiveSessionUser.mockReset();
    mocks.navigate.mockReset();
    mocks.obtenerMisSolicitudes.mockReset();
    mocks.obtenerDetalleSolicitudPropia.mockReset();
    mocks.getActiveSessionUser.mockImplementation(() => ({
      id: "22",
      token: "jwt",
      role: "Cliente",
    }));
    mocks.obtenerMisSolicitudes.mockResolvedValue({
      data: [
        {
          id: "propuesta:44",
          tipo: "propuesta",
          tipoEtiqueta: "Propuesta",
          identificador: "44",
          titulo: "Café El Mirador",
          estado: "Pendiente",
          fechaEnvio: "2026-11-02T12:00:00.000Z",
        },
        {
          id: "documentacion:9",
          tipo: "documentacion",
          tipoEtiqueta: "Documentación",
          identificador: "9",
          titulo: "Guía de poda",
          estado: "Pendiente",
          fechaEnvio: "2026-11-01T10:00:00.000Z",
        },
      ],
      total: 2,
    });
  });

  it("incluye filtros de Propuesta y Documentación", async () => {
    render(<HistorialSolicitudesContent />);

    expect(await screen.findByText("Café El Mirador")).toBeInTheDocument();
    const tipoSelect = screen.getByLabelText("Tipo");
    expect(tipoSelect).toHaveDisplayValue("Todos");
    expect(
      Array.from(tipoSelect.querySelectorAll("option")).map((nodo) => nodo.value),
    ).toEqual(
      expect.arrayContaining(["propuesta", "documentacion", "visita", "donacion"]),
    );
  });

  it("enlaza el detalle de una propuesta a /perfil/propuestas/$propuestaId", async () => {
    render(<HistorialSolicitudesContent />);

    expect(await screen.findByText("Café El Mirador")).toBeInTheDocument();
    const enlace = mocks.linkProps.find(
      (item) => item.to === "/perfil/propuestas/$propuestaId",
    );
    expect(enlace).toEqual({
      to: "/perfil/propuestas/$propuestaId",
      params: { propuestaId: "44" },
    });
  });
});
