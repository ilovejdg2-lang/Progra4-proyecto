import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

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
    const field = within(dialog).getByRole("spinbutton", { name: /^Unidades disponibles/ });
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
    const field = within(dialog).getByRole("spinbutton", { name: /^Unidades disponibles/ });
    fireEvent.change(field, { target: { value: "1.5" } });
    await user.click(within(dialog).getByRole("button", { name: "Guardar stock" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(/entero entre 0/);
    await waitFor(() => expect(field).toHaveFocus());
  });
});
