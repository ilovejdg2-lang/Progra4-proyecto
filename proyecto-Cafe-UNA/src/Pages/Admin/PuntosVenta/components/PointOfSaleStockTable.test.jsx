import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PointOfSaleStockTable } from "./PointOfSaleStockTable";

const products = [
  { id: "1", nombre: "Café Editorial", descripcion: "Grano", estado: "Habilitado", peso: "250g", imagen: "" },
  { id: "2", nombre: "Café sin registro", descripcion: "", estado: "Habilitado", peso: "1kg", imagen: "" },
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
});
