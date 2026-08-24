import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProductCatalogFormDrawer } from "./ProductCatalogFormDrawer";

describe("ProductCatalogFormDrawer", () => {
  it("announces required errors and focuses the first invalid field", async () => {
    const user = userEvent.setup();
    render(<ProductCatalogFormDrawer open onClose={vi.fn()} onSave={vi.fn()} />);

    const dialog = screen.getByRole("dialog", { name: "Nuevo producto" });
    await user.click(within(dialog).getByRole("button", { name: "Crear producto" }));

    expect(within(dialog).getByText("Ingrese el nombre del producto.")).toHaveAttribute("role", "alert");
    expect(within(dialog).getByText("Ingrese la descripción del producto.")).toHaveAttribute("role", "alert");
    await waitFor(() => expect(within(dialog).getByRole("textbox", { name: /^Nombre/ })).toHaveFocus());
  });

  it("prevents duplicate submits and sends only catalog fields", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(() => new Promise(() => {}));
    render(<ProductCatalogFormDrawer open onClose={vi.fn()} onSave={onSave} />);

    const dialog = screen.getByRole("dialog", { name: "Nuevo producto" });
    await user.type(within(dialog).getByRole("textbox", { name: "Nombre" }), "Café nuevo");
    await user.type(within(dialog).getByRole("textbox", { name: "Descripción" }), "Descripción válida");
    await user.type(within(dialog).getByRole("spinbutton", { name: "Precio normal" }), "1000");

    const submit = within(dialog).getByRole("button", { name: "Crear producto" });
    await user.click(submit);
    await user.click(submit);

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0]).not.toHaveProperty("stock");
    expect(onSave.mock.calls[0][0]).toMatchObject({ nombre: "Café nuevo", precioNormal: 1000 });
  });
});
