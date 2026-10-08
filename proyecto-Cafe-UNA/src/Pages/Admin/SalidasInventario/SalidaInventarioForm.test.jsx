import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SalidaInventarioForm } from "./SalidaInventarioForm";

const productos = [
  { id: "101", nombre: "Café de altura", stockCentral: 8, estado: "Habilitado" },
  { id: "202", nombre: "Producto sin stock", stockCentral: 0, estado: "Habilitado" },
  { id: "303", nombre: "Producto inactivo", stockCentral: 9, estado: "Deshabilitado" },
];

const motivos = [
  { id: 1, nombre: "Venta" },
  { id: 2, nombre: "Donación" },
  { id: 3, nombre: "Traslado" },
  { id: 4, nombre: "Ajuste por merma" },
];

describe("SalidaInventarioForm", () => {
  it("offers only the canonical reasons and eligible products with available central stock", () => {
    render(<SalidaInventarioForm productos={productos} motivos={motivos} onSubmit={vi.fn()} />);

    const productSelect = screen.getByRole("combobox", { name: "Producto" });
    expect(within(productSelect).getByRole("option", { name: "Café de altura" })).toBeInTheDocument();
    expect(within(productSelect).queryByRole("option", { name: "Producto sin stock" })).not.toBeInTheDocument();
    expect(within(productSelect).queryByRole("option", { name: "Producto inactivo" })).not.toBeInTheDocument();

    const reasonSelect = screen.getByRole("combobox", { name: "Motivo de salida" });
    expect(within(reasonSelect).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Seleccionar…",
      "Venta",
      "Donación",
      "Traslado",
      "Ajuste por merma",
    ]);
  });

  it.each(["Donación", "Traslado"])("requires a recipient for %s", async (reasonName) => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SalidaInventarioForm productos={productos} motivos={motivos} onSubmit={onSubmit} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Producto" }), "101");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Motivo de salida" }),
      String(motivos.find((reason) => reason.nombre === reasonName).id),
    );

    const recipient = screen.getByRole("textbox", { name: "Destinatario" });
    expect(recipient).toBeRequired();
    await user.type(screen.getByRole("textbox", { name: "Cantidad" }), "1");
    await user.click(screen.getByRole("button", { name: "Registrar salida" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/destinatario/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each(["Venta", "Ajuste por merma"])("does not require a recipient for %s", async (reasonName) => {
    const user = userEvent.setup();
    render(<SalidaInventarioForm productos={productos} motivos={motivos} onSubmit={vi.fn()} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Motivo de salida" }), String(motivos.find((reason) => reason.nombre === reasonName).id));

    expect(screen.queryByRole("textbox", { name: "Destinatario" })).not.toBeInTheDocument();
  });

  it("submits a valid reason ID, quantity, and recipient", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<SalidaInventarioForm productos={productos} motivos={motivos} onSubmit={onSubmit} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Producto" }), "101");
    await user.selectOptions(screen.getByRole("combobox", { name: "Motivo de salida" }), "2");
    await user.type(screen.getByRole("textbox", { name: "Destinatario" }), "Fundación Café UNA");
    await user.type(screen.getByRole("textbox", { name: "Cantidad" }), "3");
    await user.click(screen.getByRole("button", { name: "Registrar salida" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
      productoId: "101",
      cantidad: 3,
      motivoSalidaId: 2,
      destinatario: "Fundación Café UNA",
    }));
  });

  it("prevents a quantity greater than central stock", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SalidaInventarioForm productos={productos} motivos={motivos} onSubmit={onSubmit} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Producto" }), "101");
    await user.selectOptions(screen.getByRole("combobox", { name: "Motivo de salida" }), "1");
    fireEvent.change(screen.getByRole("textbox", { name: "Cantidad" }), { target: { value: "9" } });
    await user.click(screen.getByRole("button", { name: "Registrar salida" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/stock disponible|máximo/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
