import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../services/productosService", () => ({
  obtenerStockDesglosadoProducto: vi.fn().mockResolvedValue({
    productId: "p-1",
    locations: [{ code: "BODEGA_CENTRAL", name: "Bodega Central", stock: 4 }],
  }),
}));

import { expectApprovedModalAnatomy } from "../../../../test/modalAnatomy";
import { CentralStockEditor } from "./CentralStockEditor";

const product = { id: "p-1", nombre: "Café Premium" };

describe("CentralStockEditor", () => {
  it("shows the central location and saves an integer stock value", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <CentralStockEditor
        open
        product={product}
        stockRecord={{ productId: "p-1", locationCode: "BODEGA_CENTRAL", stock: 4, confidence: "known" }}
        onSave={onSave}
        onClose={vi.fn()}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "Stock de Bodega Central" });
    expect(within(dialog).getByText("Bodega Central")).toBeInTheDocument();
    const field = within(dialog).getByRole("textbox", { name: /^Unidades disponibles/ });
    await user.clear(field);
    await user.type(field, "12");
    await user.click(within(dialog).getByRole("button", { name: "Guardar stock" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(12));
  });

  it("rejects invalid values and focuses the field", async () => {
    const user = userEvent.setup();
    render(
      <CentralStockEditor
        open
        product={product}
        stockRecord={{ productId: "p-1", stock: null, confidence: "unknown" }}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "Stock de Bodega Central" });
    const field = within(dialog).getByRole("textbox", { name: /^Unidades disponibles/ });
    fireEvent.change(field, { target: { value: "2147483648" } });
    await user.click(within(dialog).getByRole("button", { name: "Guardar stock" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(/entero entre 0/);
    await waitFor(() => expect(field).toHaveFocus());
  });
});

describe("CentralStockEditor record sync", () => {
  const record = (stock) => ({ productId: "p-1", locationCode: "BODEGA_CENTRAL", stock, confidence: "known" });
  const renderEditor = (stock) => (
    <CentralStockEditor open product={product} stockRecord={record(stock)} onSave={vi.fn()} onClose={vi.fn()} />
  );
  const getField = () =>
    within(screen.getByRole("dialog", { name: "Stock de Bodega Central" })).getByRole("textbox", {
      name: /^Unidades disponibles/,
    });

  it("keeps in-progress edits when the same record is re-rendered", async () => {
    const { rerender } = render(renderEditor(4));
    fireEvent.change(getField(), { target: { value: "9" } });

    rerender(renderEditor(4));

    expect(getField()).toHaveValue("9");
  });

  it("loads a different record that arrives after mount and clears the validation error", async () => {
    const user = userEvent.setup();
    const { rerender } = render(renderEditor(null));
    fireEvent.change(getField(), { target: { value: "2147483648" } });
    await user.click(screen.getByRole("button", { name: "Guardar stock" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    rerender(renderEditor(7));

    expect(getField()).toHaveValue("7");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("CentralStockEditor anatomy", () => {
  it("follows the approved modal anatomy", async () => {
    const onClose = vi.fn();
    render(
      <CentralStockEditor
        open
        product={product}
        stockRecord={{ productId: "p-1", locationCode: "BODEGA_CENTRAL", stock: 4, confidence: "known" }}
        onSave={vi.fn()}
        onClose={onClose}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "Stock de Bodega Central" });
    await expectApprovedModalAnatomy(dialog, { onClose, primaryName: "Guardar stock" });
  });
});
