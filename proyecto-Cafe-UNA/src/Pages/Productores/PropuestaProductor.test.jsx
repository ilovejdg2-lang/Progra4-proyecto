import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PropuestaProductor from "./PropuestaProductor";
import { crearPropuestaProductor } from "../../services/propuestasProductoresService";
import { eliminarBorradorPropuesta, leerBorradorPropuesta } from "../../lib/propuestaProductorDraft";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }) => <a href={typeof to === "string" ? to : "#"}>{children}</a>,
}));
vi.mock("../../hooks/usePaintPublicPage", () => ({ usePaintPublicPage: () => ({}) }));
vi.mock("../../hooks/useTraducir", () => ({ useTraducir: (text) => text }));
vi.mock("../../Components/T/ST", () => ({ ST: ({ children }) => <>{children}</> }));
vi.mock("../../Components/IconoSitio/IconoSitio", () => ({ IconoSitio: () => null }));
vi.mock("../../Components/BackToHomeLink/BackToHomeLink", () => ({ default: () => null }));
vi.mock("../../Components/PageLoading/PageLoading", () => ({ default: () => null }));
vi.mock("../../Components/Productores/CampoUbicacionMapa", () => ({
  default: function CampoUbicacionMapaMock({ onChangeCoords, enlaceUbicacion }) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { useEffect } = require("react");
    useEffect(() => {
      if (!enlaceUbicacion || typeof onChangeCoords !== "function") return;
      onChangeCoords({ latitud: "9.9281", longitud: "-84.0907" });
    }, [enlaceUbicacion, onChangeCoords]);
    return null;
  },
}));
vi.mock("../../Components/ui/SelectFiltro", () => ({ SelectFiltro: ({ children, ...props }) => <select {...props}>{children}</select> }));
vi.mock("../../services/sessionService", () => ({ getActiveSessionUser: () => ({ id: 1 }), SESSION_UPDATED_EVENT: "session-updated" }));
vi.mock("../../services/propuestasProductoresService", () => ({ crearPropuestaProductor: vi.fn() }));
vi.mock("./MisPropuestas", () => ({ rutaMisPropuestas: () => "/perfil/propuestas" }));

const image = (name = "cafe.png", type = "image/png") => new File(["image"], name, { type });
const dropzone = () => screen.getByRole("button", { name: "Arrastra o selecciona una imagen" });
const input = () => screen.getByLabelText(/^Imagen representativa/);
const continuar = () => screen.getByRole("button", { name: "Continuar" });
const anterior = () => screen.getByRole("button", { name: "Anterior" });
const enviar = () => screen.getByRole("button", { name: "Enviar propuesta" });

async function flushDraft() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 350));
  });
}

function fillStepEmprendimiento(file = image()) {
  fireEvent.change(document.getElementById("nombre"), { target: { value: "Café local" } });
  fireEvent.change(document.getElementById("descripcion"), { target: { value: "Café de especialidad" } });
  fireEvent.drop(dropzone(), { dataTransfer: { files: [file] } });
}

function fillStepUbicacion() {
  fireEvent.change(document.getElementById("provincia"), { target: { value: "San José" } });
  fireEvent.change(document.getElementById("canton"), { target: { value: "San José" } });
  fireEvent.change(document.getElementById("distrito"), { target: { value: "Carmen" } });
  fireEvent.change(document.getElementById("direccion"), { target: { value: "Frente al parque" } });
  fireEvent.change(document.getElementById("enlaceUbicacion"), { target: { value: "https://maps.google.com/" } });
}

function fillStepContacto() {
  fireEvent.change(document.getElementById("correo"), { target: { value: "cafe@example.com" } });
  fireEvent.change(document.getElementById("telefono"), { target: { value: "88888888" } });
}

async function completeWizard(file = image()) {
  fillStepEmprendimiento(file);
  fireEvent.click(continuar());
  fillStepUbicacion();
  fireEvent.click(continuar());
  fillStepContacto();
  fireEvent.click(continuar());
  fireEvent.click(document.getElementById("aceptaTerminos"));
}

describe("producer proposal image intake", () => {
  beforeEach(() => {
    eliminarBorradorPropuesta(1);
    vi.stubGlobal("URL", Object.assign(URL, {
      createObjectURL: vi.fn((file) => `blob:${file.name}`), revokeObjectURL: vi.fn(),
    }));
    crearPropuestaProductor.mockReset();
  });

  it("explica que la publicación promueve el emprendimiento", () => {
    render(<PropuestaProductor />);
    expect(screen.getByRole("heading", { name: "Promoción del emprendimiento" })).toBeVisible();
    expect(screen.getByText(/no vende tus productos ni comercializa en tu nombre/i)).toBeVisible();
  });

  it("muestra una sola sección a la vez con navegación lateral", () => {
    render(<PropuestaProductor />);
    expect(screen.getByRole("heading", { name: "Emprendimiento" })).toBeVisible();
    expect(screen.queryByLabelText(/^Provincia/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ubicación/ })).toBeVisible();
    expect(screen.getByRole("button", { name: /Revisión/ })).toBeVisible();
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
    fireEvent.change(document.getElementById("nombre"), { target: { value: "Café local" } });
    fireEvent.change(document.getElementById("descripcion"), { target: { value: "Café de especialidad" } });
    if (file) fireEvent.drop(dropzone(), { dataTransfer: { files: [file] } });
    fireEvent.click(continuar());
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
    fireEvent.change(document.getElementById("nombre"), { target: { value: "Café local" } });
    fireEvent.change(document.getElementById("descripcion"), { target: { value: "Café de especialidad" } });
    fireEvent.click(continuar());
    expect(screen.getByText("La imagen representativa es obligatoria.")).toBeVisible();
    expect(crearPropuestaProductor).not.toHaveBeenCalled();
  });

  it.each([["extension.JPG", ""], ["no-extension", "image/png"]])("submits supported extension OR MIME unchanged (%s)", async (name, type) => {
    crearPropuestaProductor.mockImplementation(() => new Promise(() => {}));
    render(<PropuestaProductor />);
    const file = image(name, type);
    await completeWizard(file);
    fireEvent.click(enviar());
    await waitFor(() => expect(crearPropuestaProductor).toHaveBeenCalledOnce());
    const data = crearPropuestaProductor.mock.calls[0][0];
    expect(data.get("imagen")).toBe(file);
    expect(data.get("nombre")).toBe("Café local");
    expect(data.get("aceptaTerminos")).toBe("true");
    expect(data.get("claveIdempotencia")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Enviando propuesta..." })).toBeDisabled();
    expect(anterior()).toBeDisabled();
  });

  it("preserves server error feedback and selected image for retry", async () => {
    crearPropuestaProductor.mockRejectedValue(new Error("No se pudo guardar la propuesta."));
    render(<PropuestaProductor />);
    await completeWizard();
    await flushDraft();
    fireEvent.click(enviar());
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo guardar la propuesta.");
    expect(screen.getByText("cafe.png")).toBeVisible();
    expect(leerBorradorPropuesta(1)?.form?.nombre).toBe("Café local");
  });

  it("avanza, retrocede y conserva los datos al recargar", async () => {
    const { unmount } = render(<PropuestaProductor />);
    fillStepEmprendimiento();
    fireEvent.click(continuar());
    fillStepUbicacion();
    await flushDraft();
    await waitFor(() => expect(leerBorradorPropuesta(1)?.imagen?.dataUrl).toBeTruthy());

    expect(leerBorradorPropuesta(1)?.form?.direccion).toBe("Frente al parque");
    expect(leerBorradorPropuesta(1)?.paso).toBe(1);

    fireEvent.click(anterior());
    expect(document.getElementById("nombre")).toHaveValue("Café local");
    expect(screen.getByText("cafe.png")).toBeVisible();

    await flushDraft();
    await waitFor(() => expect(leerBorradorPropuesta(1)?.imagen?.name).toBe("cafe.png"));
    unmount();

    render(<PropuestaProductor />);
    await waitFor(() => expect(document.getElementById("nombre")).toHaveValue("Café local"));
    await waitFor(() => expect(screen.getByText("cafe.png")).toBeVisible());
    fireEvent.click(continuar());
    await waitFor(() => expect(document.getElementById("direccion")).toHaveValue("Frente al parque"));
  });

  it("elimina el borrador solo cuando el backend confirma el registro", async () => {
    crearPropuestaProductor.mockResolvedValue({
      id: 99,
      fechaEnvio: "2026-10-28T12:00:00.000Z",
      estado: "Pendiente",
      mensaje: "Listo",
    });
    render(<PropuestaProductor />);
    await completeWizard();
    await flushDraft();
    expect(leerBorradorPropuesta(1)?.form?.nombre).toBe("Café local");
    fireEvent.click(enviar());
    await waitFor(() => expect(screen.getByRole("heading", { name: "Propuesta enviada" })).toBeVisible());
    expect(leerBorradorPropuesta(1)).toBeNull();
  });
});
