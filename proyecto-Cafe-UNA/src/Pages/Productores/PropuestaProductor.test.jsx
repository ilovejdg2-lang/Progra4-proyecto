import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PropuestaProductor from "./PropuestaProductor";
import { crearPropuestaProductor } from "../../services/propuestasProductoresService";

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn(), Link: ({ children }) => <a>{children}</a> }));
vi.mock("../../hooks/usePaintPublicPage", () => ({ usePaintPublicPage: () => ({}) }));
vi.mock("../../hooks/useTraducir", () => ({ useTraducir: (text) => text }));
vi.mock("../../Components/T/ST", () => ({ ST: ({ children }) => <>{children}</> }));
vi.mock("../../Components/IconoSitio/IconoSitio", () => ({ IconoSitio: () => null }));
vi.mock("../../Components/BackToHomeLink/BackToHomeLink", () => ({ default: () => null }));
vi.mock("../../Components/PageLoading/PageLoading", () => ({ default: () => null }));
vi.mock("../../Components/ui/SelectFiltro", () => ({ SelectFiltro: ({ children, ...props }) => <select {...props}>{children}</select> }));
vi.mock("../../services/sessionService", () => ({ getActiveSessionUser: () => ({ id: 1 }), SESSION_UPDATED_EVENT: "session-updated" }));
vi.mock("../../services/propuestasProductoresService", () => ({ crearPropuestaProductor: vi.fn() }));
vi.mock("./MisPropuestas", () => ({ rutaMisPropuestas: () => "/perfil/propuestas" }));

const image = (name = "cafe.png", type = "image/png") => new File(["image"], name, { type });
const dropzone = () => screen.getByRole("button", { name: "Arrastra o selecciona una imagen" });
const input = () => screen.getByLabelText(/^Imagen representativa/);

function completeForm() {
  const values = {
    nombre: "Café local", descripcion: "Café de especialidad", provincia: "San José",
    canton: "San José", distrito: "Carmen", direccion: "Frente al parque",
    enlaceUbicacion: "https://maps.google.com/", correo: "cafe@example.com", telefono: "88888888",
  };
  for (const [id, value] of Object.entries(values)) {
    fireEvent.change(document.getElementById(id), { target: { value } });
  }
  fireEvent.click(document.getElementById("aceptaTerminos"));
}

describe("producer proposal image intake", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", Object.assign(URL, {
      createObjectURL: vi.fn((file) => `blob:${file.name}`), revokeObjectURL: vi.fn(),
    }));
    crearPropuestaProductor.mockReset();
  });

  it("supports a keyboard-accessible picker and keeps selection deferred", async () => {
    const user = userEvent.setup();
    render(<PropuestaProductor />);
    const button = dropzone();
    const click = vi.spyOn(input(), "click");
    button.focus();
    await user.keyboard("{Enter}");
    expect(click).toHaveBeenCalledOnce();
    fireEvent.change(input(), { target: { files: [image()] } });
    expect(screen.getByText("cafe.png")).toBeVisible();
    expect(screen.getByAltText("Vista previa de la imagen seleccionada")).toHaveAttribute("src", "blob:cafe.png");
    expect(crearPropuestaProductor).not.toHaveBeenCalled();
  });

  it("supports dropping and replacing, preserves a canceled selection, and cleans previews", () => {
    const { unmount } = render(<PropuestaProductor />);
    fireEvent.drop(dropzone(), { dataTransfer: { files: [image()] } });
    expect(screen.getByText("cafe.png")).toBeVisible();
    fireEvent.change(input(), { target: { files: [] } });
    expect(screen.getByText("cafe.png")).toBeVisible();
    fireEvent.change(input(), { target: { files: [image("replacement.webp", "image/webp")] } });
    expect(screen.getByText("replacement.webp")).toBeVisible();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:cafe.png");
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:replacement.webp");
  });

  it.each([
    ["missing", null, "La imagen representativa es obligatoria."],
    ["format", image("notes.txt", "text/plain"), "La imagen debe ser JPG, JPEG, PNG o WebP."],
    ["size", Object.defineProperty(image("large.png"), "size", { value: 5 * 1024 * 1024 + 1 }), "La imagen no puede superar 5 MB."],
  ])("preserves required, format and 5 MB validation (%s)", (_label, file, error) => {
    render(<PropuestaProductor />);
    if (file) fireEvent.drop(dropzone(), { dataTransfer: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar propuesta" }));
    expect(screen.getByText(error)).toBeVisible();
    expect(input()).toHaveAttribute("aria-invalid", "true");
    expect(input()).toHaveAccessibleDescription(expect.stringContaining(error));
    expect(crearPropuestaProductor).not.toHaveBeenCalled();
  });

  it("removes the selected image, releases its preview and requires a new image", () => {
    render(<PropuestaProductor />);
    fireEvent.drop(dropzone(), { dataTransfer: { files: [image()] } });
    fireEvent.click(screen.getByRole("button", { name: "Quitar imagen" }));
    expect(screen.queryByText("cafe.png")).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:cafe.png");
    fireEvent.click(screen.getByRole("button", { name: "Enviar propuesta" }));
    expect(screen.getByText("La imagen representativa es obligatoria.")).toBeVisible();
    expect(crearPropuestaProductor).not.toHaveBeenCalled();
  });

  it.each([["extension.JPG", ""], ["no-extension", "image/png"]])("submits supported extension OR MIME unchanged (%s)", async (name, type) => {
    crearPropuestaProductor.mockImplementation(() => new Promise(() => {}));
    render(<PropuestaProductor />);
    completeForm();
    const file = image(name, type);
    fireEvent.drop(dropzone(), { dataTransfer: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar propuesta" }));
    await waitFor(() => expect(crearPropuestaProductor).toHaveBeenCalledOnce());
    const data = crearPropuestaProductor.mock.calls[0][0];
    expect(data.get("imagen")).toBe(file);
    expect(data.get("nombre")).toBe("Café local");
    expect(data.get("aceptaTerminos")).toBe("true");
    expect(data.get("claveIdempotencia")).toBeTruthy();
    expect(dropzone()).toBeDisabled();
    expect(input()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Quitar imagen" })).toBeDisabled();
  });

  it("preserves server error feedback and selected image for retry", async () => {
    crearPropuestaProductor.mockRejectedValue(new Error("No se pudo guardar la propuesta."));
    render(<PropuestaProductor />);
    completeForm();
    fireEvent.drop(dropzone(), { dataTransfer: { files: [image()] } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar propuesta" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo guardar la propuesta.");
    expect(screen.getByText("cafe.png")).toBeVisible();
    expect(dropzone()).toBeEnabled();
  });
});
