import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SolicitudSalidaInventarioForm } from "./SolicitudSalidaInventarioForm";

describe("SolicitudSalidaInventarioForm", () => {
  it("submits a dated multi-item donation request with recipient and responsible person", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <SolicitudSalidaInventarioForm
        productos={[
          { id: "101", nombre: "Café de altura", stock: 8 },
          { id: "102", nombre: "Café molido", stock: 5 },
        ]}
        onSubmit={onSubmit}
      />,
    );

    await user.selectOptions(screen.getByRole("combobox", { name: "Tipo de salida" }), "donacion");
    await user.type(screen.getByRole("textbox", { name: "Destinatario" }), "Fundación Café UNA");
    await user.type(screen.getByRole("textbox", { name: "Responsable" }), "Ana Solís");
    await user.clear(screen.getByLabelText("Fecha de salida"));
    await user.type(screen.getByLabelText("Fecha de salida"), "2026-10-27");

    const firstItem = screen.getByRole("group", { name: "Artículo 1" });
    await user.selectOptions(within(firstItem).getByRole("combobox", { name: "Producto" }), "101");
    await user.type(within(firstItem).getByRole("spinbutton", { name: "Cantidad" }), "2");
    await user.click(screen.getByRole("button", { name: "Agregar artículo" }));

    const secondItem = screen.getByRole("group", { name: "Artículo 2" });
    await user.selectOptions(within(secondItem).getByRole("combobox", { name: "Producto" }), "102");
    await user.type(within(secondItem).getByRole("spinbutton", { name: "Cantidad" }), "1");
    await user.click(screen.getByRole("button", { name: "Enviar solicitud" }));

    expect(onSubmit).toHaveBeenCalledWith({
      tipo: "donacion",
      fechaSalida: "2026-10-27",
      destinatario: "Fundación Café UNA",
      responsable: "Ana Solís",
      items: [
        { productoId: "101", cantidad: 2 },
        { productoId: "102", cantidad: 1 },
      ],
    });
  });

  it("keeps the remaining row's input node and typed value when another row is removed", async () => {
    const user = userEvent.setup();
    render(<SolicitudSalidaInventarioForm productos={[{ id: "101", nombre: "Café de altura", stock: 8 }]} />);
    await user.click(screen.getByRole("button", { name: "Agregar artículo" }));
    const [first, second] = screen.getAllByRole("spinbutton", { name: "Cantidad" });
    await user.type(first, "3");
    await user.type(second, "7");

    await user.click(within(screen.getByRole("group", { name: "Artículo 1" })).getByRole("button", { name: "Quitar" }));

    const [remaining] = screen.getAllByRole("spinbutton", { name: "Cantidad" });
    expect(screen.getAllByRole("spinbutton", { name: "Cantidad" })).toHaveLength(1);
    expect(remaining).toBe(second);
    expect(remaining).toHaveValue(7);
  });
});
