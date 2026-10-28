import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ModalEditarMiPropuesta } from "./ModalEditarMiPropuesta";
import { urlImagenPublica } from "../../lib/propuestaProductor";
import { editarMiPropuesta, solicitarEdicionMiPropuesta } from "../../services/propuestasProductoresService";

vi.mock("../../hooks/useTraducir", () => ({ useTraducir: (text) => text }));
vi.mock("../../Components/T/ST", () => ({ ST: ({ children }) => <>{children}</> }));
vi.mock("../../Components/ui/SelectFiltro", () => ({ SelectFiltro: ({ children, ...props }) => <select {...props}>{children}</select> }));
vi.mock("../../Components/Admin/ui/AdminModal", () => ({
  AdminModal: ({ children }) => <div role="dialog">{children}</div>,
  AdminModalBody: ({ children }) => <div>{children}</div>,
  AdminModalHeader: ({ children }) => <h2>{children}</h2>,
  adminBtnPrimary: "", adminBtnVoluntariadoCancel: "",
}));
vi.mock("../../Components/Productores/CampoUbicacionMapa", () => ({
  default: function CampoUbicacionMapaMock({ onChangeCoords, enlaceUbicacion }) {
    const React = require("react");
    const aplicado = React.useRef("");
    React.useEffect(() => {
      if (!enlaceUbicacion || typeof onChangeCoords !== "function") return;
      if (aplicado.current === enlaceUbicacion) return;
      aplicado.current = enlaceUbicacion;
      onChangeCoords({ latitud: "9.9281", longitud: "-84.0907" });
    }, [enlaceUbicacion, onChangeCoords]);
    return null;
  },
}));
vi.mock("../../services/propuestasProductoresService", () => ({ editarMiPropuesta: vi.fn(), solicitarEdicionMiPropuesta: vi.fn() }));
vi.mock("../../services/sessionService", () => ({ getActiveSessionUser: () => null }));

const proposal = {
  id: 7, nombre: "Café local", descripcion: "Café de especialidad", provincia: "San José",
  canton: "San José", distrito: "Carmen", direccion: "Frente al parque",
  enlaceUbicacion: "https://maps.google.com/", latitud: "9.9281", longitud: "-84.0907",
  correo: "cafe@example.com", telefono: "88888888",
  imagenUrl: "/imagenes/current.png", estado: "Pendiente",
};
const currentPreview = urlImagenPublica(proposal.imagenUrl);
const file = () => new File(["image"], "replacement.png", { type: "image/png" });
const picker = () => screen.getByRole("button", { name: "Arrastra o selecciona una imagen" });

describe("producer edit image intake", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn((image) => `blob:${image.name}`);
    URL.revokeObjectURL = vi.fn();
    editarMiPropuesta.mockReset();
    solicitarEdicionMiPropuesta.mockReset();
  });

  it("provides keyboard selection without replacing the current image until a file is selected", async () => {
    const user = userEvent.setup();
    render(<ModalEditarMiPropuesta open propuesta={proposal} onClose={vi.fn()} />);
    expect(screen.getByAltText("Vista previa")).toHaveAttribute("src", currentPreview);
    const button = picker();
    const click = vi.spyOn(document.getElementById("edit-mi-imagen"), "click");
    button.focus();
    await user.keyboard("{Enter}");
    expect(click).toHaveBeenCalledOnce();
    expect(editarMiPropuesta).not.toHaveBeenCalled();
    expect(solicitarEdicionMiPropuesta).not.toHaveBeenCalled();
  });

  it.each([false, true])("sends the optional file in multipart data for request mode %s", async (esSolicitud) => {
    const save = esSolicitud ? solicitarEdicionMiPropuesta : editarMiPropuesta;
    save.mockResolvedValue({ id: 7 });
    const onGuardado = vi.fn();
    const onClose = vi.fn();
    const { container } = render(<ModalEditarMiPropuesta open propuesta={proposal} esSolicitud={esSolicitud} onClose={onClose} onGuardado={onGuardado} />);
    if (esSolicitud) fireEvent.change(document.getElementById("edit-mi-motivo"), { target: { value: "  Actualizamos nuestra imagen  " } });
    const selected = file();
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [selected] } });
    expect(save).not.toHaveBeenCalled();
    fireEvent.submit(container.querySelector("form"));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    const [id, data] = save.mock.calls[0];
    expect(id).toBe(7);
    expect(data).toBeInstanceOf(FormData);
    expect(data.get("imagen")).toBe(selected);
    expect(data.get("nombre")).toBe(proposal.nombre);
    expect(data.has("motivoCambio")).toBe(false);
    expect(data.get("motivo")).toBe(esSolicitud ? "Actualizamos nuestra imagen" : null);
    await waitFor(() => expect(onGuardado).toHaveBeenCalledWith({ id: 7 }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps the existing image when saving without a replacement", async () => {
    editarMiPropuesta.mockImplementation(() => new Promise(() => {}));
    const { container } = render(<ModalEditarMiPropuesta open propuesta={proposal} onClose={vi.fn()} />);
    fireEvent.submit(container.querySelector("form"));
    await waitFor(() => expect(editarMiPropuesta).toHaveBeenCalledOnce());
    const data = editarMiPropuesta.mock.calls[0][1];
    expect(data).toBeInstanceOf(FormData);
    expect(data.has("imagen")).toBe(false);
    expect(data.has("imagenUrl")).toBe(false);
    expect(screen.getByAltText("Vista previa")).toHaveAttribute("src", currentPreview);
    expect(picker()).toBeDisabled();
  });

  it("preserves cancel, replacement and clearing only the pending replacement", () => {
    const onClose = vi.fn();
    const { rerender, unmount } = render(<ModalEditarMiPropuesta open propuesta={proposal} onClose={onClose} />);
    fireEvent.drop(picker(), { dataTransfer: { files: [file()] } });
    const input = document.getElementById("edit-mi-imagen");
    expect(screen.getByAltText("Vista previa")).toHaveAttribute("src", "blob:replacement.png");
    fireEvent.change(input, { target: { files: [] } });
    expect(screen.getByAltText("Vista previa")).toHaveAttribute("src", "blob:replacement.png");
    fireEvent.click(screen.getByRole("button", { name: "Descartar nueva imagen" }));
    expect(screen.getByAltText("Vista previa")).toHaveAttribute("src", currentPreview);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:replacement.png");
    fireEvent.drop(picker(), { dataTransfer: { files: [file()] } });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledOnce();
    rerender(<ModalEditarMiPropuesta open={false} propuesta={proposal} onClose={onClose} />);
    rerender(<ModalEditarMiPropuesta open propuesta={proposal} onClose={onClose} />);
    expect(screen.getByAltText("Vista previa")).toHaveAttribute("src", currentPreview);
    fireEvent.drop(picker(), { dataTransfer: { files: [file()] } });
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3);
    expect(editarMiPropuesta).not.toHaveBeenCalled();
  });

  it.each(["format", "size"])("rejects invalid %s without losing the current image", (kind) => {
    render(<ModalEditarMiPropuesta open propuesta={proposal} onClose={vi.fn()} />);
    const invalid = kind === "format" ? new File(["text"], "notes.txt", { type: "text/plain" }) : Object.defineProperty(file(), "size", { value: 5 * 1024 * 1024 + 1 });
    fireEvent.drop(picker(), { dataTransfer: { files: [invalid] } });
    expect(screen.getByRole("alert")).toHaveTextContent(kind === "format" ? "La imagen debe ser JPG, JPEG, PNG o WebP." : "La imagen no puede superar 5 MB.");
    expect(screen.getByAltText("Vista previa")).toHaveAttribute("src", currentPreview);
    expect(editarMiPropuesta).not.toHaveBeenCalled();
  });

  it.each([["extension.JPG", ""], ["no-extension", "image/png"]])("accepts supported extension OR MIME (%s)", (name, type) => {
    render(<ModalEditarMiPropuesta open propuesta={proposal} onClose={vi.fn()} />);
    fireEvent.drop(picker(), { dataTransfer: { files: [new File(["image"], name, { type })] } });
    expect(screen.getByAltText("Vista previa")).toHaveAttribute("src", `blob:${name}`);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("retains the pending file for retry after API failure", async () => {
    editarMiPropuesta.mockRejectedValue(new Error("No se pudo guardar la propuesta."));
    const { container } = render(<ModalEditarMiPropuesta open propuesta={proposal} onClose={vi.fn()} />);
    fireEvent.drop(picker(), { dataTransfer: { files: [file()] } });
    fireEvent.submit(container.querySelector("form"));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo guardar la propuesta.");
    expect(screen.getByAltText("Vista previa")).toHaveAttribute("src", "blob:replacement.png");
    expect(picker()).toBeEnabled();
  });
});
