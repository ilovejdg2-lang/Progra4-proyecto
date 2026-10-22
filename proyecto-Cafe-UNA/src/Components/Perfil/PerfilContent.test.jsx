import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PerfilContent } from "./PerfilContent";
import { actualizarPerfil, obtenerPerfil, subirImagenPerfil } from "../../services/perfilService";

const session = vi.hoisted(() => ({ user: { id: 1, token: "synthetic", name: "Persona" }, apply: vi.fn() }));
vi.mock("../../services/sessionService", () => ({ getActiveSessionUser: () => session.user, getStoredUser: () => session.user, isLoggingOut: () => !session.user, isSessionExpired: () => false, applyPerfilToSession: session.apply, SESSION_UPDATED_EVENT: "session-updated" }));
vi.mock("../../services/perfilService", () => ({ obtenerPerfil: vi.fn(), actualizarPerfil: vi.fn(), subirImagenPerfil: vi.fn(), actualizarPerfilCliente: vi.fn(), cambiarPasswordPerfil: vi.fn(), clearPerfilCache: vi.fn(), confirmarCambioCorreo: vi.fn(), solicitarCambioCorreo: vi.fn() }));
vi.mock("../../hooks/useTraducir", () => ({ useTraducir: (text) => text }));
vi.mock("../T/ST", () => ({ ST: ({ children }) => children }));
vi.mock("../../lib/useIdioma", () => ({ useIdioma: () => ({ idioma: "es" }) }));
vi.mock("../../lib/permisos", () => ({ rolesDeUsuario: () => [], tienePermiso: () => false }));
vi.mock("@tanstack/react-router", () => ({ Link: ({ to, children }) => <a href={to}>{children}</a> }));
vi.mock("../../Pages/HistorialCompras/rutasCompras", () => ({ rutaMisCompras: () => "/compras" }));
vi.mock("../../Pages/HistorialSolicitudes/HistorialSolicitudesCliente", () => ({ rutaMisSolicitudes: () => "/solicitudes" }));
vi.mock("../../Pages/Productores/MisPropuestas", () => ({ rutaMisPropuestas: () => "/propuestas" }));
vi.mock("../../hooks/useProfileImage", () => ({ useProfileImage: (source) => source?.startsWith("/api/perfil/imagenes/") ? `blob:${source.split("/").at(-1)}` : source }));

const avatar = "/api/perfil/imagenes/00000000-0000-4000-8000-000000000000.webp";
const banner = avatar.replace("000000000000.webp", "000000000001.webp");
const profile = { id: 1, nombre: "Persona", correo: "persona@example.test", fotoPerfilUrl: avatar, fotoBannerUrl: banner, fotoPerfilPosicion: "25% 75%", fotoBannerPosicion: "40% 60%", roles: [] };

describe("PerfilContent image integration", () => {
  beforeEach(() => {
    session.user = { id: 1, token: "synthetic", name: "Persona" };
    vi.clearAllMocks();
    obtenerPerfil.mockResolvedValue(profile);
    actualizarPerfil.mockImplementation(async (payload) => ({ ...profile, ...payload }));
    subirImagenPerfil.mockResolvedValue(banner);
  });
  it("renders private avatar and banner as authenticated blobs", async () => {
    const { container } = render(<PerfilContent />);
    await screen.findByRole("heading", { name: "Persona" });
    expect(container.querySelectorAll('img[src^="blob:"]')).toHaveLength(2);
    expect(container.querySelector('img[src^="/api/perfil/imagenes/"]')).toBeNull();
  });
  it.each(["avatar", "banner"])("preserves the complete PUT payload when replacing %s", async (type) => {
    render(<PerfilContent variant="admin" />);
    await screen.findByRole("heading", { name: "Persona" });
    fireEvent.click(screen.getByRole("button", { name: type === "avatar" ? "Cambiar foto de perfil" : "Cambiar banner" }));
    fireEvent.change(screen.getByRole("textbox", { name: "URL de la imagen" }), { target: { value: "https://example.test/manual.png" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar imagen" }));
    await waitFor(() => expect(actualizarPerfil).toHaveBeenCalledWith({ nombre: "Persona", fotoPerfilUrl: type === "avatar" ? "https://example.test/manual.png" : avatar, fotoBannerUrl: type === "banner" ? "https://example.test/manual.png" : banner, fotoPerfilPosicion: "25% 75%", fotoBannerPosicion: "40% 60%" }));
  });
  it("waits for upload and explicit save, and restores the original draft on cancel", async () => {
    let resolve;
    subirImagenPerfil.mockReturnValue(new Promise((yes) => { resolve = yes; }));
    const { container } = render(<PerfilContent />);
    await screen.findByRole("heading", { name: "Persona" });
    fireEvent.click(screen.getByRole("button", { name: "Cambiar foto de perfil" }));
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [new File(["png"], "avatar.png", { type: "image/png" })] } });
    expect(screen.getByRole("button", { name: "Guardar imagen" })).toBeDisabled();
    expect(actualizarPerfil).not.toHaveBeenCalled();
    await act(async () => resolve(banner));
    expect(screen.getByRole("textbox", { name: "URL de la imagen" })).toHaveValue(banner);
    expect(actualizarPerfil).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.click(screen.getByRole("button", { name: "Cambiar foto de perfil" }));
    expect(screen.getByRole("textbox", { name: "URL de la imagen" })).toHaveValue(avatar);
  });
  it("does not apply a save response after logout", async () => {
    let resolve;
    actualizarPerfil.mockReturnValue(new Promise((yes) => { resolve = yes; }));
    render(<PerfilContent />);
    await screen.findByRole("heading", { name: "Persona" });
    fireEvent.click(screen.getByRole("button", { name: "Cambiar banner" }));
    session.apply.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Guardar imagen" }));
    session.user = null;
    act(() => window.dispatchEvent(new Event("session-updated")));
    await act(async () => resolve(profile));
    expect(session.apply).not.toHaveBeenCalled();
  });
  it("keeps the saved profile and the open draft when the profile PUT fails", async () => {
    actualizarPerfil.mockRejectedValue(new Error("No se pudo guardar la imagen."));
    const { container } = render(<PerfilContent />);
    await screen.findByRole("heading", { name: "Persona" });
    fireEvent.click(screen.getByRole("button", { name: "Cambiar banner" }));
    fireEvent.change(screen.getByRole("textbox", { name: "URL de la imagen" }), { target: { value: "https://example.test/replacement.png" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar imagen" }));
    await screen.findByText("No se pudo guardar la imagen.");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(container.querySelector(".perfil-hero__banner")).toHaveAttribute("src", `blob:${banner.split("/").at(-1)}`);
    expect(screen.getByRole("button", { name: "Guardar imagen" })).toBeEnabled();
  });
});
