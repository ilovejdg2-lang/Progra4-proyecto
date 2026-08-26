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

  it("fills the current product when opening edit", () => {
    const { rerender } = render(
      <ProductCatalogFormDrawer open={false} initial={null} onClose={vi.fn()} onSave={vi.fn()} />,
    );

    rerender(
      <ProductCatalogFormDrawer
        open
        initial={{
          id: 3,
          nombre: "Café otro",
          descripcion: "Tueste medio",
          imagen: "https://img.example/1.jpg\nhttps://img.example/2.jpg",
          precioNormal: 3390,
          precioConIVA: 3831,
          estado: "Habilitado",
          peso: "1 KG",
          categoria: "café",
          esDestacado: false,
        }}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "Editar producto" });
    expect(within(dialog).getByRole("textbox", { name: /^Nombre/ })).toHaveValue("Café otro");
    expect(within(dialog).getByRole("textbox", { name: /^Descripción/ })).toHaveValue("Tueste medio");
    expect(within(dialog).getByRole("spinbutton", { name: "Precio normal" })).toHaveValue(3390);
    expect(within(dialog).getByRole("textbox", { name: /Foto principal/ })).toHaveValue("https://img.example/1.jpg");
    expect(within(dialog).getByRole("textbox", { name: /Foto extra 2/ })).toHaveValue("https://img.example/2.jpg");
  });
});
