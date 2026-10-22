import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ModalFoto, ModalTexto } from "./InformacionSobreNosotros";
import { subirImagenInformacion } from "../../../services/informacionService";

vi.mock("../../../services/informacionService", async (original) => ({ ...(await original()), subirImagenInformacion: vi.fn() }));
vi.mock("../../../services/categoriasService", async (original) => ({ ...(await original()), obtenerCategorias: vi.fn().mockResolvedValue([]) }));
vi.mock("../../../lib/traducir", async (original) => ({
  ...(await original()), camposParaVistaAdmin: async (data) => data, asegurarCamposEnEspanol: async (data) => data,
}));

const current = "https://example.test/current.png";
const uploaded = "/api/informacion/imagenes/about.webp";
const image = () => new File(["image"], "about.webp", { type: "image/webp" });
const about = { title: "Nuestra historia", description: "Cultivamos café", eyebrow: "Café UNA", image: current };
const photo = { id: 9, title: "Cultivo", image: current, categoria: "Finca" };

describe("About CMS image integration", () => {
  beforeEach(() => {
    localStorage.setItem("cafe-una-idioma", "es");
    subirImagenInformacion.mockReset();
  });

  it.each(["historia", "mission", "vision"])("uploads the %s image and prevents saving a pending upload", async (tipo) => {
    const onGuardar = vi.fn();
    let finish;
    subirImagenInformacion.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    render(<ModalTexto tipo={tipo} data={about} onCerrar={vi.fn()} onGuardar={onGuardar} guardando={false} />);
    fireEvent.change(screen.getByLabelText("Subir archivo para URL de foto"), { target: { files: [image()] } });
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
    fireEvent.submit(screen.getByRole("dialog").querySelector("form"));
    expect(onGuardar).not.toHaveBeenCalled();
    finish(uploaded);
    await waitFor(() => expect(screen.getByRole("textbox", { name: "URL de foto" })).toHaveValue(uploaded));
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(onGuardar).toHaveBeenCalledWith(tipo, { ...about, image: uploaded }));
  });

  it.each(["", "https://example.test/manual.png"])("keeps an optional manual institutional image %s", async (image) => {
    const onGuardar = vi.fn();
    render(<ModalTexto tipo="historia" data={about} onCerrar={vi.fn()} onGuardar={onGuardar} />);
    fireEvent.change(screen.getByRole("textbox", { name: "URL de foto" }), { target: { value: image } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(onGuardar).toHaveBeenCalledWith("historia", { ...about, image }));
  });

  it.each(["create", "edit"])("saves the uploaded gallery URL in the %s payload", async (mode) => {
    const onGuardar = vi.fn();
    let finish;
    subirImagenInformacion.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    render(<ModalFoto inicial={mode === "edit" ? photo : null} onCerrar={vi.fn()} onGuardar={onGuardar} />);
    await act(async () => {});
    if (mode === "create") fireEvent.change(screen.getByRole("textbox", { name: /^Título/ }), { target: { value: "Cultivo" } });
    fireEvent.change(screen.getByLabelText("Subir archivo para URL de imagen"), { target: { files: [image()] } });
    const save = screen.getByRole("button", { name: mode === "edit" ? "Guardar foto" : "Agregar a la galería" });
    expect(save).toBeDisabled();
    fireEvent.submit(screen.getByRole("dialog").querySelector("form"));
    expect(onGuardar).not.toHaveBeenCalled();
    finish(uploaded);
    await waitFor(() => expect(save).toBeEnabled());
    fireEvent.click(save);
    await waitFor(() => expect(onGuardar).toHaveBeenCalledWith({ id: mode === "edit" ? 9 : undefined, title: "Cultivo", image: uploaded, categoria: mode === "edit" ? "Finca" : "" }));
  });

  it("rejects invalid uploads and preserves the existing gallery image after failure", async () => {
    subirImagenInformacion.mockRejectedValue(new Error("No se pudo subir la imagen."));
    render(<ModalFoto inicial={photo} onCerrar={vi.fn()} onGuardar={vi.fn()} />);
    const picker = screen.getByLabelText("Subir archivo para URL de imagen");
    fireEvent.change(picker, { target: { files: [new File(["text"], "notes.txt", { type: "text/plain" })] } });
    expect(screen.getByRole("alert")).toHaveTextContent("La imagen debe ser JPG, PNG o WEBP.");
    expect(subirImagenInformacion).not.toHaveBeenCalled();
    fireEvent.change(picker, { target: { files: [image()] } });
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo subir la imagen.");
    expect(screen.getByRole("textbox", { name: "URL de imagen" })).toHaveValue(current);
  });

  it("does not apply a canceled row's late upload to a different gallery row", async () => {
    let finish;
    subirImagenInformacion.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const onGuardar = vi.fn();
    const onCerrar = vi.fn();
    const { rerender } = render(<ModalFoto key={photo.id} inicial={photo} onCerrar={onCerrar} onGuardar={onGuardar} />);
    fireEvent.change(screen.getByLabelText("Subir archivo para URL de imagen"), { target: { files: [image()] } });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCerrar).toHaveBeenCalledOnce();
    const next = { ...photo, id: 12, title: "Segundo cultivo", image: "https://example.test/next.png" };
    rerender(<ModalFoto key={next.id} inicial={next} onCerrar={onCerrar} onGuardar={onGuardar} />);
    finish(uploaded);
    await waitFor(() => expect(screen.getByRole("textbox", { name: "URL de imagen" })).toHaveValue(next.image));
    fireEvent.click(screen.getByRole("button", { name: "Guardar foto" }));
    await waitFor(() => expect(onGuardar).toHaveBeenCalledWith(next));
  });

  it("preserves the required gallery URL field name", () => {
    render(<ModalFoto inicial={photo} onCerrar={vi.fn()} onGuardar={vi.fn()} />);
    const input = screen.getByRole("textbox", { name: "URL de imagen" });
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("name", "image");
  });

  it("saves a manual gallery URL without uploading", async () => {
    const onGuardar = vi.fn();
    render(<ModalFoto inicial={photo} onCerrar={vi.fn()} onGuardar={onGuardar} />);
    await act(async () => {});
    fireEvent.change(screen.getByRole("textbox", { name: "URL de imagen" }), { target: { value: "https://example.test/manual.png" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar foto" }));
    await waitFor(() => expect(onGuardar).toHaveBeenCalledWith({ ...photo, image: "https://example.test/manual.png" }));
    expect(subirImagenInformacion).not.toHaveBeenCalled();
  });
});
