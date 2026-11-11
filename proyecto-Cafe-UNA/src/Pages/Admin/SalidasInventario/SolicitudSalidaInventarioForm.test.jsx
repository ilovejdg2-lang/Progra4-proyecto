import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../Components/ui/SelectFiltro", () => ({
  SelectFiltro: ({ children, options, ...props }) => {
    delete props.traducirOpciones;
    return (
      <select {...props}>
        {options
          ? options.map((opcion) => (
              <option key={String(opcion.value)} value={opcion.value}>
                {opcion.label}
              </option>
            ))
          : children}
      </select>
    );
  },
}));

import { SolicitudSalidaInventarioForm } from "./SolicitudSalidaInventarioForm";

describe("SolicitudSalidaInventarioForm", () => {
  it("submits a dated multi-item donation request with recipient and responsible person", async () => {
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

    fireEvent.change(screen.getByRole("combobox", { name: "Tipo de salida" }), { target: { value: "donacion" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Destinatario" }), { target: { value: "Fundación Café UNA" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Responsable" }), { target: { value: "Ana Solís" } });
    fireEvent.change(screen.getByLabelText("Fecha de salida"), { target: { value: "2026-10-27" } });

    const firstItem = screen.getByRole("group", { name: "Artículo 1" });
    fireEvent.change(within(firstItem).getByRole("combobox", { name: "Producto" }), { target: { value: "101" } });
    fireEvent.change(within(firstItem).getByRole("spinbutton", { name: "Cantidad" }), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Agregar artículo" }));

    const secondItem = screen.getByRole("group", { name: "Artículo 2" });
    fireEvent.change(within(secondItem).getByRole("combobox", { name: "Producto" }), { target: { value: "102" } });
    fireEvent.change(within(secondItem).getByRole("spinbutton", { name: "Cantidad" }), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar solicitud" }));

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

  it("keeps the remaining row's input node and typed value when another row is removed", () => {
    render(<SolicitudSalidaInventarioForm productos={[{ id: "101", nombre: "Café de altura", stock: 8 }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Agregar artículo" }));
    const [first, second] = screen.getAllByRole("spinbutton", { name: "Cantidad" });
    fireEvent.change(first, { target: { value: "3" } });
    fireEvent.change(second, { target: { value: "7" } });

    fireEvent.click(within(screen.getByRole("group", { name: "Artículo 1" })).getByRole("button", { name: "Quitar" }));

    const [remaining] = screen.getAllByRole("spinbutton", { name: "Cantidad" });
    expect(screen.getAllByRole("spinbutton", { name: "Cantidad" })).toHaveLength(1);
    expect(remaining).toBe(second);
    expect(remaining).toHaveValue(7);
  });
});
