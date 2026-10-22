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
vi.mock("../../services/sessionService", () => ({
  applyPerfilToSession: vi.fn(),
  beginLogout: vi.fn(),
  clearSession: vi.fn(),
  getActiveSessionUser: vi.fn(() => ({ id: "1", name: "Admin" })),
  getStoredUser: vi.fn(() => ({ id: "1" })),
  SESSION_UPDATED_EVENT: "session-updated",
}));

import { ClienteSidebar } from "./ClienteSidebar";
import { SidebarProvider } from "../Admin/ui/Sidebar";
import { getActiveSessionUser } from "../../services/sessionService";

vi.mock("../../hooks/useProfileImage", () => ({
  useProfileImage: (source) => source ? "blob:private-avatar" : "",
}));

describe("ClienteSidebar profile image", () => {
  beforeEach(() => {
    getActiveSessionUser.mockReturnValue({ id: "1", name: "Cliente", fotoPerfilUrl: "/api/perfil/imagenes/550e8400-e29b-41d4-a716-446655440000.webp", fotoPerfilPosicion: "25% 75%" });
    router.useRouterState.mockReturnValue("/perfil");
    permissions.rolesDeUsuario.mockReturnValue(["Cliente"]);
    permissions.tienePermiso.mockReturnValue(true);
  });
  it("renders the authenticated blob instead of the private endpoint and preserves position", () => {
    const { container } = render(<SidebarProvider><ClienteSidebar /></SidebarProvider>);
    const avatar = container.querySelector('img[src="blob:private-avatar"]');
    expect(avatar).not.toBeNull();
    expect(avatar).toHaveStyle({ objectPosition: "25% 75%" });
    expect(container.querySelector('img[src^="/api/perfil/imagenes/"]')).toBeNull();
  });
  it("keeps the initial placeholder without an image", () => {
    getActiveSessionUser.mockReturnValue({ id: "1", name: "Cliente" });
    const { container } = render(<SidebarProvider><ClienteSidebar /></SidebarProvider>);
    expect(container.querySelector('img[src="blob:private-avatar"]')).toBeNull();
    expect(screen.getAllByText("C").length).toBeGreaterThan(0);
  });
});