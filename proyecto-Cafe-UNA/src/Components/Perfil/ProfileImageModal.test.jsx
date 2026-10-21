import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileImageModal } from "./ProfileImageModal";

vi.mock("../../hooks/useTraducir", () => ({ useTraducir: (text) => text }));
vi.mock("../T/ST", () => ({ ST: ({ children }) => children }));
vi.mock("../../hooks/useProfileImage", () => ({ useProfileImage: (source) => source?.startsWith("/api/perfil/imagenes/") ? "blob:private-preview" : source }));
const session = vi.hoisted(() => ({ user: null, loggingOut: false }));
vi.mock("../../services/sessionService", () => ({ getStoredUser: () => session.user, isLoggingOut: () => session.loggingOut, isSessionExpired: () => false, SESSION_UPDATED_EVENT: "session-updated" }));

const privatePath = "/api/perfil/imagenes/00000000-0000-4000-8000-000000000000.webp";
const file = () => new File(["image"], "avatar.png", { type: "image/png" });
function setup(overrides = {}) {
  const props = { open: true, type: "avatar", value: "https://example.test/old.png", onChange: vi.fn(), onSave: vi.fn(), onClose: vi.fn(), uploader: vi.fn(), ...overrides };
  const view = render(<ProfileImageModal {...props} />);
  return { ...view, props, select: (image = file()) => fireEvent.change(view.container.querySelector('input[type="file"]'), { target: { files: [image] } }) };
}

describe("ProfileImageModal", () => {
  beforeEach(() => { session.user = { id: 1, token: "synthetic" }; session.loggingOut = false; });
  it("offers file selection without saving the profile during upload", async () => {
    const upload = vi.fn().mockResolvedValue("/api/perfil/imagenes/00000000-0000-4000-8000-000000000000.webp");
    const onChange = vi.fn();
    const onSave = vi.fn();
    const { container } = render(<ProfileImageModal open type="avatar" value="https://example.test/old.png" onChange={onChange} onSave={onSave} onClose={vi.fn()} uploader={upload} />);
    expect(screen.getByRole("button", { name: "Arrastra o selecciona una imagen" })).toBeEnabled();
    const file = new File(["image"], "avatar.png", { type: "image/png" });
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith("/api/perfil/imagenes/00000000-0000-4000-8000-000000000000.webp"));
    expect(onSave).not.toHaveBeenCalled();
  });

  it("uses an authenticated preview, preserves manual editing and saves only explicitly", () => {
    const { props } = setup({ value: privatePath, variant: "admin" });
    expect(screen.getByAltText("Vista previa")).toHaveAttribute("src", "blob:private-preview");
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "https://example.test/manual.png" } });
    expect(props.onChange).toHaveBeenCalledWith("https://example.test/manual.png");
    fireEvent.click(screen.getByRole("button", { name: "Guardar imagen" }));
    expect(props.onSave).toHaveBeenCalledOnce();
    expect(screen.getByText("Vista previa (96×96 px)")).toBeInTheDocument();
  });

  it("blocks save and manual replacement while uploading, then enables retry after failure", async () => {
    let reject;
    const pending = new Promise((_, no) => { reject = no; });
    const { props, select } = setup({ uploader: vi.fn().mockReturnValueOnce(pending).mockResolvedValue(privatePath) });
    select();
    expect(screen.getByRole("button", { name: "Guardar imagen" })).toBeDisabled();
    expect(screen.getByRole("textbox")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Guardar imagen" }));
    expect(props.onSave).not.toHaveBeenCalled();
    await act(async () => reject(new Error("secret server detail")));
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar la imagen");
    expect(props.onChange).not.toHaveBeenCalled();
    expect(screen.getByAltText("Vista previa")).toHaveAttribute("src", props.value);
    select();
    await vi.waitFor(() => expect(props.onChange).toHaveBeenCalledWith(privatePath));
  });

  it.each(["invalid type", "oversized"])("rejects %s without replacing the current image", (reason) => {
    const { props, select } = setup();
    const image = reason === "invalid type" ? new File(["<svg/>"], "bad.svg", { type: "image/svg+xml" }) : file();
    if (reason === "oversized") Object.defineProperty(image, "size", { value: 10 * 1024 * 1024 + 1 });
    select(image);
    expect(screen.getByRole("alert")).toHaveTextContent("hasta 10 MB");
    expect(props.uploader).not.toHaveBeenCalled();
    expect(props.onChange).not.toHaveBeenCalled();
  });

  it.each(["cancel", "unmount", "logout", "token", "user"])("rejects late uploads after %s", async (transition) => {
    let resolve;
    const pending = new Promise((yes) => { resolve = yes; });
    const { props, select, unmount } = setup({ uploader: vi.fn().mockReturnValue(pending) });
    select();
    const signal = props.uploader.mock.calls[0][1];
    if (transition === "cancel") fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    if (transition === "unmount") unmount();
    if (transition === "logout") session.loggingOut = true;
    if (transition === "token") session.user = { ...session.user, token: "replacement" };
    if (transition === "user") session.user = { ...session.user, id: 2 };
    if (["logout", "token", "user"].includes(transition)) act(() => window.dispatchEvent(new Event("session-updated")));
    expect(signal.aborted).toBe(true);
    await act(async () => resolve(privatePath));
    expect(props.onChange).not.toHaveBeenCalled();
    expect(props.onSave).not.toHaveBeenCalled();
  });

  it("disables selection, save and dismissal while saving", () => {
    const { props } = setup({ saving: true });
    expect(screen.getByRole("button", { name: "Arrastra o selecciona una imagen" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(props.onClose).not.toHaveBeenCalled();
  });
});
