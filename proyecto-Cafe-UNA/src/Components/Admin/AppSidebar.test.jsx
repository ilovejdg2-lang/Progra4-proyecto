import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const permissions = vi.hoisted(() => ({
  tienePermiso: vi.fn(),
  rolesDeUsuario: vi.fn(),
}));
const router = vi.hoisted(() => ({
  useRouterState: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, search, activeOptions, activeProps, children, ...props }) => {
    const query =
      search && typeof search === "object" && Object.keys(search).length > 0
        ? `?${new URLSearchParams(
            Object.entries(search)
              .filter(([, value]) => value != null && value !== "")
              .map(([key, value]) => [key, String(value)]),
          ).toString()}`
        : "";
    return (
      <a
        href={`${to}${query}`}
        data-active-exact={activeOptions?.exact ? "true" : "false"}
        data-active-search={JSON.stringify(search ?? null)}
        {...props}
        {...activeProps}
      >
        {children}
      </a>
    );
  },
  useNavigate: () => vi.fn(),
  useRouterState: router.useRouterState,
}));
vi.mock("../../lib/permisos", () => permissions);
vi.mock("../../hooks/useHomeBrandNavigation", () => ({
  useHomeBrandNavigation: () => vi.fn(),
}));
vi.mock("../../services/informacionService", () => ({
  obtenerNavbar: vi.fn().mockResolvedValue({ logoUrl: "", logoClaroUrl: "" }),
}));
vi.mock("../../lib/brandLogoCache", () => ({
  LOGO_CLARO_FALLBACK: "/logoblancoyrojo.png",
  LOGO_OSCURO_FALLBACK: "/logo.webp",
  cacheBrandLogos: vi.fn(),
  readBrandLogos: () => ({ logoUrl: "", logoClaroUrl: "" }),
}));
vi.mock("../../lib/adminTheme", () => ({
  ADMIN_THEME_CHANGED_EVENT: "admin-theme-changed",
  isAdminThemeDark: () => false,
}));
vi.mock("../../services/perfilService", () => ({
  clearPerfilCache: vi.fn(),
  obtenerPerfil: vi.fn().mockResolvedValue(null),
}));
vi.mock("../../services/apiClient", () => ({
  cancelPendingSessionRefresh: vi.fn(),
}));
vi.mock("../../services/sessionService", () => {
  const activeUser = vi.fn(() => ({ id: "1", name: "Admin" }));
  return {
  applyPerfilToSession: vi.fn(),
  beginLogout: vi.fn(),
  clearSession: vi.fn(),
  getActiveSessionUser: activeUser,
  peekSessionUser: activeUser,
  getStoredUser: vi.fn(() => ({ id: "1" })),
  SESSION_UPDATED_EVENT: "session-updated",
  };
});

import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "./ui/Sidebar";
import { getActiveSessionUser } from "../../services/sessionService";

vi.mock("../../hooks/useProfileImage", () => ({
  useProfileImage: (source) => source ? "blob:private-avatar" : "",
}));

describe("AppSidebar", () => {
  it("renders private avatars through the authenticated image lifecycle", () => {
    getActiveSessionUser.mockReturnValue({ id: "1", name: "Admin", fotoPerfilUrl: "/api/perfil/imagenes/550e8400-e29b-41d4-a716-446655440000.webp" });
    const { container } = render(<SidebarProvider><AppSidebar /></SidebarProvider>);
    expect(container.querySelector('img[src="blob:private-avatar"]')).not.toBeNull();
    expect(container.querySelector('img[src^="/api/perfil/imagenes/"]')).toBeNull();
  });
  beforeEach(() => {
    getActiveSessionUser.mockReturnValue({ id: "1", name: "Admin" });
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn((key) =>
          key === "admin-sidebar-voluntariado-open" ||
          key === "admin-sidebar-visitas-open" ||
          key === "admin-sidebar-donaciones-open" ||
          key === "admin-sidebar-mi-cuenta-open"
            ? "true"
            : null,
        ),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
    });
    router.useRouterState.mockImplementation(({ select } = {}) => {
      const state = {
        location: { pathname: "/admin/puntos-venta", search: {} },
      };
      return typeof select === "function" ? select(state) : state;
    });
    permissions.rolesDeUsuario.mockReturnValue(["SuperAdmin"]);
    permissions.tienePermiso.mockReturnValue(true);
  });

  it("exposes Puntos de venta and Activos fijos inside the inventory section", () => {
    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>,
    );

    expect(screen.getAllByRole("link", { name: /Puntos de venta/i })[0]).toHaveAttribute(
      "href",
      "/admin/puntos-venta",
    );
    expect(screen.getAllByRole("link", { name: /Activos fijos/i })[0]).toHaveAttribute(
      "href",
      "/admin/activos-fijos",
    );
    expect(screen.getAllByRole("link", { name: /Historial de movimientos/i })[0]).toHaveAttribute(
      "href",
      "/admin/historial-movimientos",
    );
    expect(screen.getAllByRole("link", { name: /Salidas de bodega/i })[0]).toHaveAttribute(
      "href",
      "/admin/salidas-inventario",
    );
    expect(screen.queryByText("Formularios")).not.toBeInTheDocument();
    expect(screen.getAllByText("Voluntariado")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Visitas grupales")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Donaciones")[0]).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /^Voluntariado$/i })[0]).toHaveAttribute(
      "href",
      "/admin/voluntariado",
    );
    expect(screen.getAllByRole("link", { name: /Visitas grupales/i })[0]).toHaveAttribute(
      "href",
      "/admin/visitas",
    );
    expect(screen.getAllByRole("link", { name: /Necesidades de donación/i })[0]).toHaveAttribute(
      "href",
      "/admin/donaciones/necesidades",
    );
    expect(screen.getAllByRole("link", { name: /Solicitudes de donación/i })[0]).toHaveAttribute(
      "href",
      "/admin/donaciones/solicitudes",
    );
    expect(screen.getAllByRole("link", { name: /^Fechas disponibles$/i }).some((el) =>
      el.getAttribute("href") === "/admin/donaciones/fechas-recepcion",
    )).toBe(true);
    expect(screen.getAllByRole("link", { name: /^Mi perfil$/i })[0]).toHaveAttribute(
      "href",
      "/admin/perfil",
    );
  });

  it("uses exact path routes for fechas and parent/child inventory links", () => {
    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>,
    );

    const solicitudes = screen.getAllByRole("link", {
      name: /Solicitudes de donación/i,
    })[0];
    const fechasDonacion = screen
      .getAllByRole("link", { name: /^Fechas disponibles$/i })
      .find((el) => el.getAttribute("href") === "/admin/donaciones/fechas-recepcion");
    const fechasVoluntariado = screen
      .getAllByRole("link", { name: /^Fechas disponibles$/i })
      .find((el) => el.getAttribute("href") === "/admin/voluntariado/fechas");
    const fechasVisitas = screen
      .getAllByRole("link", { name: /^Fechas disponibles$/i })
      .find((el) => el.getAttribute("href") === "/admin/visitas/fechas");
    const puntosVenta = screen.getAllByRole("link", { name: /Puntos de venta/i })[0];
    const diasSinRetiro = screen.getAllByRole("link", { name: /Días sin retiro/i })[0];

    expect(solicitudes).toHaveAttribute("href", "/admin/donaciones/solicitudes");
    expect(solicitudes).toHaveAttribute("data-active-exact", "true");
    expect(fechasDonacion).toHaveAttribute("data-active-exact", "true");
    expect(fechasVoluntariado).toBeTruthy();
    expect(fechasVisitas).toBeTruthy();
    expect(puntosVenta).toHaveAttribute("data-active-exact", "true");
    expect(diasSinRetiro).toHaveAttribute("data-active-exact", "true");
  });

  it("does not expose inventory navigation without permission", () => {
    permissions.tienePermiso.mockImplementation(
      (_, permission) =>
        !permission.includes("inventario") &&
        permission !== "ver_productos" &&
        permission !== "ver_ventas" &&
        permission !== "registrar_ventas" &&
        permission !== "ajustar_stock_ubicaciones",
    );

    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>,
    );

    expect(screen.queryByRole("link", { name: /Puntos de venta/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Activos fijos/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^Producto$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Salidas de bodega/i })).not.toBeInTheDocument();
  });
});
