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
  Link: ({ to, activeProps, children, ...props }) => (
    <a href={to} {...props} {...activeProps}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
  useRouterState: router.useRouterState,
}));
vi.mock("../../lib/permisos", () => permissions);
vi.mock("../../hooks/useHomeBrandNavigation", () => ({
  useHomeBrandNavigation: () => vi.fn(),
}));
vi.mock("../../services/informacionService", () => ({
  obtenerNavbar: vi.fn().mockResolvedValue({ logoUrl: "" }),
}));
vi.mock("../../services/perfilService", () => ({
  clearPerfilCache: vi.fn(),
  obtenerPerfil: vi.fn().mockResolvedValue(null),
}));
vi.mock("../../services/apiClient", () => ({
  cancelPendingSessionRefresh: vi.fn(),
}));
vi.mock("../../services/sessionService", () => ({
  applyPerfilToSession: vi.fn(),
  beginLogout: vi.fn(),
  clearSession: vi.fn(),
  getActiveSessionUser: vi.fn(() => ({ id: "1", name: "Admin" })),
  getStoredUser: vi.fn(() => ({ id: "1" })),
  SESSION_UPDATED_EVENT: "session-updated",
}));

import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "./ui/Sidebar";

describe("AppSidebar", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
    });
    router.useRouterState.mockReturnValue("/admin/puntos-venta");
    permissions.rolesDeUsuario.mockReturnValue(["SuperAdmin"]);
    permissions.tienePermiso.mockReturnValue(true);
  });

  it("exposes Puntos de venta inside the inventory section", () => {
    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>,
    );

    expect(screen.getAllByRole("link", { name: /Puntos de venta/i })[0]).toHaveAttribute(
      "href",
      "/admin/puntos-venta",
    );
  });

  it("does not expose inventory navigation without permission", () => {
    permissions.tienePermiso.mockImplementation((_, permission) => permission !== "ver_inventario");

    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>,
    );

    expect(screen.queryByRole("link", { name: /Puntos de venta/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^Producto$/i })).not.toBeInTheDocument();
  });
});
