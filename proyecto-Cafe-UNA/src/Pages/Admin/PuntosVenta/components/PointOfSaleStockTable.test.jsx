import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PointOfSaleStockTable } from "./PointOfSaleStockTable";

const products = [
  { id: "1", nombre: "Café Editorial", descripcion: "Grano", estado: "Habilitado", peso: "250g", imagen: "" },
  { id: "2", nombre: "Café sin registro", descripcion: "", estado: "Deshabilitado", peso: "1kg", imagen: "" },
];

describe("PointOfSaleStockTable", () => {
  it("keeps explicit zero distinct from an absent balance and hides edits when unauthorized", () => {
    render(
      <PointOfSaleStockTable
        products={products}
        stockByProductId={new Map([["1", { productId: "1", stock: 0, provisioned: true }]])}
        canEdit={false}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sin registro").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Editar stock/i })).not.toBeInTheDocument();
  });

  it("exposes an icon-only pencil per product with an accessible name that opens the stock editor", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <PointOfSaleStockTable
        products={products}
        stockByProductId={new Map([["1", { productId: "1", stock: 24 }]])}
        canEdit
        onEdit={onEdit}
      />,
    );
    const pencils = screen.getAllByRole("button", { name: "Editar stock de Café Editorial" });
    expect(pencils.length).toBeGreaterThan(0);
    expect(pencils[0]).not.toHaveTextContent(/\S/);
    await user.click(pencils[0]);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(products[0]);
  });

  it("opens the editor when the row is clicked, once, without double firing from the pencil", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <PointOfSaleStockTable products={products} stockByProductId={new Map()} canEdit onEdit={onEdit} />,
    );
    await user.click(screen.getAllByText("Café sin registro")[0]);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(products[1]);
  });

  it("marks low stock with the existing threshold and a word, never by color alone", () => {
    render(
      <PointOfSaleStockTable
        products={products}
        stockByProductId={new Map([
          ["1", { productId: "1", stock: 3 }],
          ["2", { productId: "2", stock: 40 }],
        ])}
        canEdit={false}
      />,
    );
    expect(screen.getAllByText("Bajo").length).toBeGreaterThan(0);
    expect(screen.getAllByText("40").length).toBeGreaterThan(0);
    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
  });

  it("shows status as neutral text with a word (no green/red text classes)", () => {
    const { container } = render(
      <PointOfSaleStockTable products={products} stockByProductId={new Map()} canEdit={false} />,
    );
    expect(screen.getAllByText("Habilitado").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Deshabilitado").length).toBeGreaterThan(0);
    expect(container.innerHTML).not.toMatch(/text-green-|text-red-|text-emerald-|text-rose-/);
  });

  it("renders an empty message when there are no products", () => {
    render(<PointOfSaleStockTable products={[]} stockByProductId={new Map()} />);
    expect(screen.getByText(/No hay productos/i)).toBeInTheDocument();
  });
});
