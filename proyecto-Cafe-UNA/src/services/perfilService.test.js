import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./apiClient";
import * as profile from "./perfilService";
import { clearSession, saveAuthenticatedUser } from "./sessionService";

vi.mock("./apiClient", () => ({ apiRequest: vi.fn() }));

const name = "00000000-0000-4000-8000-000000000000.webp";
const path = `/api/perfil/imagenes/${name}`;
const endpoint = `${import.meta.env.BACKEND_URL}/perfil/imagenes`;
const blob = new Blob(["image"], { type: "image/webp" });

describe("trusted private profile image transport", () => {
  beforeEach(() => {
    clearSession();
    saveAuthenticatedUser({ id: 7, token: "local-test" });
    apiRequest.mockReset();
  });

  it("uploads multipart and returns only a validated canonical path", async () => {
    apiRequest.mockResolvedValue({ url: path });
    const image = new File(["image"], "avatar.png", { type: "image/png" });
    const controller = new AbortController();
    expect(await profile.subirImagenPerfil(image, controller.signal)).toBe(path);
    expect(apiRequest).toHaveBeenCalledWith(endpoint, expect.objectContaining({ method: "POST", signal: controller.signal }));
    expect(apiRequest.mock.calls[0][1].data.get("imagen")).toBe(image);
    expect([...apiRequest.mock.calls[0][1].data.keys()]).toEqual(["imagen"]);
  });

  it("reads a private Blob only through the reconstructed trusted endpoint", async () => {
    apiRequest.mockResolvedValue(blob);
    const controller = new AbortController();
    expect(await profile.obtenerImagenPerfil(path, controller.signal)).toBe(blob);
    expect(apiRequest).toHaveBeenCalledWith(`${endpoint}/${name}`, expect.objectContaining({ responseType: "blob", signal: controller.signal }));
    const absolute = new URL(path, window.location.origin).href;
    expect(await profile.obtenerImagenPerfil(absolute)).toBe(blob);
    expect(apiRequest.mock.lastCall[0]).toBe(`${endpoint}/${name}`);
  });

  it.each([
    `https://evil.test${path}`, `//evil.test${path}`, `${path}?token=secret`, `${path}#fragment`,
    `http://user:pass@localhost${path}`, "/api/perfil/imagenes/../imagenes/00000000-0000-4000-8000-000000000000.webp",
    path.replace("/imagenes/", "/%69magenes/"), path.replace(".webp", ".svg"), "/api/perfil/imagenes/not-a-uuid.webp",
    path.toUpperCase(),
  ])("never forwards authenticated requests for unsafe source %s", async (source) => {
    await expect(profile.obtenerImagenPerfil(source)).rejects.toThrow();
    expect(profile.classifyProfileImageSource(source).kind).toBe("blocked");
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("preserves external manual images without authenticated transport", () => {
    expect(profile.classifyProfileImageSource("https://images.example.test/avatar.png?width=96")).toEqual({ kind: "external", url: "https://images.example.test/avatar.png?width=96" });
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("rejects forged uploader URLs and unexpected response media", async () => {
    apiRequest.mockResolvedValue({ url: `https://evil.test${path}` });
    await expect(profile.subirImagenPerfil(new File(["image"], "a.png", { type: "image/png" }))).rejects.toThrow();
    apiRequest.mockResolvedValue(new Blob(["<html/>"], { type: "text/html" }));
    await expect(profile.obtenerImagenPerfil(path)).rejects.toThrow();
  });

  it("requires an active session and enforces the upload byte limit", async () => {
    const oversized = Object.defineProperty(new File(["image"], "a.png", { type: "image/png" }), "size", { value: 10 * 1024 * 1024 + 1 });
    await expect(profile.subirImagenPerfil(oversized)).rejects.toThrow();
    clearSession();
    await expect(profile.obtenerImagenPerfil(path)).rejects.toThrow();
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("keeps the existing full-profile JSON PUT contract unchanged", async () => {
    apiRequest.mockResolvedValue({ id: 7, fotoPerfilUrl: path });
    const payload = { nombre: "Ana", fotoPerfilUrl: path, fotoBannerUrl: "https://example.test/banner.png", fotoPerfilPosicion: "50% 50%", fotoBannerPosicion: "50% 50%" };
    await profile.actualizarPerfil(payload);
    expect(apiRequest).toHaveBeenCalledWith(`${import.meta.env.BACKEND_URL}/perfil`, expect.objectContaining({ method: "PUT", body: JSON.stringify(payload) }));
  });
});
