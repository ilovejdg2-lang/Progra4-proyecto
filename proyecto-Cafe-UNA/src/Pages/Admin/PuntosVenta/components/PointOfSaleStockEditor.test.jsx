import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PointOfSaleStockEditor } from "./PointOfSaleStockEditor";

const props = {
  open: true,
  location: { code: "POS_EDITORIAL", name: "Editorial" },
  product: { id: "1", nombre: "Café Editorial" },
  stockRecord: { stock: 2 },
  onSave: vi.fn(),
  onClose: vi.fn(),
};

describe("PointOfSaleStockEditor", () => {
  it("blocks invalid stock before saving", async () => {
    const user = userEvent.setup();
    render(<PointOfSaleStockEditor {...props} />);

    await user.clear(screen.getByRole("textbox", { name: /Unidades disponibles/i }));
    await user.click(screen.getByRole("button", { name: /Guardar stock/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/entero entre 0/i);
    expect(props.onSave).not.toHaveBeenCalled();
  });

  it("sends a validated integer and trimmed reason", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<PointOfSaleStockEditor {...props} onSave={onSave} />);

    await user.clear(screen.getByRole("textbox", { name: /Unidades disponibles/i }));
    await user.type(screen.getByRole("textbox", { name: /Unidades disponibles/i }), "7");
    await user.type(screen.getByRole("textbox", { name: /Motivo del ajuste/i }), "  Conteo inicial  ");
    await user.click(screen.getByRole("button", { name: /Guardar stock/i }));

    expect(onSave).toHaveBeenCalledWith(7, "Conteo inicial");
  });
});
