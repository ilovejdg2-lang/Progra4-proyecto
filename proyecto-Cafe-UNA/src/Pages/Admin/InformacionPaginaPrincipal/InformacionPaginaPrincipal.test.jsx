import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { subirImagenInformacion } = vi.hoisted(() => ({
  subirImagenInformacion: vi.fn(),
}));

vi.mock("../../../services/informacionService", async (importOriginal) => ({
  ...(await importOriginal()),
  subirImagenInformacion,
}));

import { ModalHero, ModalTarjetasInicio } from "./InformacionPaginaPrincipal";

describe("CMS home image integration", () => {
  beforeEach(() => {
    localStorage.setItem("cafe-una-idioma", "es");
    subirImagenInformacion.mockReset();
  });

  it("saves the uploaded hero URL in the existing hero payload", async () => {
    const user = userEvent.setup();
    const onGuardar = vi.fn();
    subirImagenInformacion.mockResolvedValue("/api/informacion/imagenes/hero.webp");
    render(
      <ModalHero
        hero={{ title: "Café UNA", subtitle: "Cultivamos futuro", backgroundImage: "https://example.test/current.png" }}
        onCerrar={vi.fn()}
        onGuardar={onGuardar}
        guardando={false}
      />,
    );

    fireEvent.change(screen.getByLabelText("Subir archivo para Imagen de fondo URL"), {
      target: { files: [new File(["image"], "hero.webp", { type: "image/webp" })] },
    });
    await waitFor(() => expect(subirImagenInformacion).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Imagen de fondo URL" })).toHaveValue("/api/informacion/imagenes/hero.webp"));

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(onGuardar).toHaveBeenCalledWith(expect.objectContaining({ backgroundImage: "/api/informacion/imagenes/hero.webp" })));
  });

  it("renders one editable card per home card key with typed values preserved", async () => {
    const user = userEvent.setup();
    const tarjetas = ["donaciones", "visitas", "voluntariado"].map((clave) => ({ clave, etiqueta: clave, titulo: `Titulo ${clave}` }));
    render(<ModalTarjetasInicio tarjetas={tarjetas} onCerrar={vi.fn()} onGuardar={vi.fn()} guardando={false} />);

    const titulos = screen.getAllByDisplayValue(/^Titulo /);
    expect(titulos).toHaveLength(3);
    await user.type(titulos[1], "!");
    expect(screen.getAllByDisplayValue(/^Titulo /)[1]).toBe(titulos[1]);
    expect(titulos[1]).toHaveValue("Titulo visitas!");
  });
});
