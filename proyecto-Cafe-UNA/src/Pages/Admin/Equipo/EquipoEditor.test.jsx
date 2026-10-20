import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EquipoEditor } from "./EquipoEditor";
import { actualizarMiembroEquipo, crearMiembroEquipo, obtenerEquipo, subirImagenInformacion } from "../../../services/informacionService";

vi.mock("../../../services/informacionService", async (original) => ({
  ...(await original()), obtenerEquipo: vi.fn(), actualizarMiembroEquipo: vi.fn(),
  crearMiembroEquipo: vi.fn(), subirImagenInformacion: vi.fn(),
}));
vi.mock("../../../lib/traducir", async (original) => ({
  ...(await original()), camposParaVistaAdmin: async (data) => data, asegurarCamposEnEspanol: async (data) => data,
}));

const person = { id: 7, nombre: "Ana", cargo: "Coordinación", correo: "ana@example.test", telefono: "88888888", foto: "https://example.test/current.png", orden: 1 };
const uploaded = "/api/informacion/imagenes/team.webp";
const image = () => new File(["image"], "team.webp", { type: "image/webp" });

async function openEditor(edit = false) {
  render(<EquipoEditor puedeEliminar />);
  if (edit) fireEvent.click((await screen.findAllByRole("button", { name: "Editar" }))[0]);
  else fireEvent.click(await screen.findByRole("button", { name: "Agregar persona" }));
  return screen.getByRole("dialog");
}

describe("team CMS image integration", () => {
  beforeEach(() => {
    localStorage.setItem("cafe-una-idioma", "es");
    vi.clearAllMocks();
    obtenerEquipo.mockResolvedValue([person]);
    subirImagenInformacion.mockReset();
  });

  it("offers drag/select on the existing person form", async () => {
    const dialog = await openEditor(true);
    expect(within(dialog).getByRole("button", { name: /Arrastrá o seleccioná/ })).toBeEnabled();
  });

  it("preserves optional photo URL constraints", async () => {
    const dialog = await openEditor(true);
    const input = within(dialog).getByRole("textbox", { name: "URL de foto (opcional)" });
    expect(input).toHaveAttribute("maxLength", "1000");
    expect(input).toHaveAttribute("name", "foto");
    expect(input).not.toBeRequired();
  });

  it("blocks pending saves and sends the uploaded URL with the same person ID", async () => {
    const dialog = await openEditor(true);
    let finish;
    subirImagenInformacion.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    fireEvent.change(within(dialog).getByLabelText("Subir archivo para URL de foto (opcional)"), { target: { files: [image()] } });
    expect(within(dialog).getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
    fireEvent.submit(dialog.querySelector("form"));
    expect(actualizarMiembroEquipo).not.toHaveBeenCalled();
    finish(uploaded);
    await waitFor(() => expect(within(dialog).getByRole("textbox", { name: "URL de foto (opcional)" })).toHaveValue(uploaded));
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(actualizarMiembroEquipo).toHaveBeenCalledWith(7, { nombre: "Ana", cargo: "Coordinación", correo: "ana@example.test", telefono: "88888888", foto: uploaded }));
  });

  it.each(["", "https://example.test/manual.png"])("preserves an optional manual photo URL: %s", async (foto) => {
    const dialog = await openEditor(true);
    fireEvent.change(within(dialog).getByRole("textbox", { name: "URL de foto (opcional)" }), { target: { value: foto } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(actualizarMiembroEquipo).toHaveBeenCalledWith(7, expect.objectContaining({ foto })));
    expect(subirImagenInformacion).not.toHaveBeenCalled();
  });

  it("retains the original URL after upload failure and cancels without saving", async () => {
    subirImagenInformacion.mockRejectedValue(new Error("No se pudo subir la imagen."));
    const dialog = await openEditor(true);
    fireEvent.change(within(dialog).getByLabelText("Subir archivo para URL de foto (opcional)"), { target: { files: [image()] } });
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("No se pudo subir la imagen.");
    expect(within(dialog).getByRole("textbox", { name: "URL de foto (opcional)" })).toHaveValue(person.foto);
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(actualizarMiembroEquipo).not.toHaveBeenCalled();
    expect(crearMiembroEquipo).not.toHaveBeenCalled();
  });

  it("creates a new person with an uploaded optional photo", async () => {
    const dialog = await openEditor();
    subirImagenInformacion.mockResolvedValue(uploaded);
    fireEvent.change(within(dialog).getByRole("textbox", { name: /^Nombre/ }), { target: { value: "Ana" } });
    fireEvent.change(within(dialog).getByRole("textbox", { name: /^Cargo/ }), { target: { value: "Coordinación" } });
    fireEvent.change(within(dialog).getByLabelText("Subir archivo para URL de foto (opcional)"), { target: { files: [image()] } });
    await waitFor(() => expect(within(dialog).getByRole("textbox", { name: "URL de foto (opcional)" })).toHaveValue(uploaded));
    fireEvent.click(within(dialog).getByRole("button", { name: "Agregar persona" }));
    await waitFor(() => expect(crearMiembroEquipo).toHaveBeenCalledWith({ nombre: "Ana", cargo: "Coordinación", correo: "", telefono: "", foto: uploaded }));
  });
});
