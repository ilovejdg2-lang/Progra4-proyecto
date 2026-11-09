import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ProductCatalogTable } from "./ProductCatalogTable";
import { productoPuedeDestacarse } from "../../../../lib/productoDisponibilidad";

const known = (stock) => ({ productId: "x", locationCode: "BODEGA_CENTRAL", stock, confidence: "known" });

const cafe = {
  id: 1,
  nombre: "Café en grano",
  categoria: "Café",
  subcategoria: "Grano entero",
  precioNormal: 3098,
  estado: "Habilitado",
  esDestacado: true,
  imagen: "",
  centralStock: known(37),
};
const te = {
  id: 2,
  nombre: "Té verde",
  categoria: "Té",
  precioNormal: 1500,
  estado: "Habilitado",
  esDestacado: false,
  imagen: "",
  centralStock: known(3),
};
const agotado = {
  id: 3,
  nombre: "Miel de abeja",
  categoria: "Dulces",
  precioNormal: 2000,
  estado: "Deshabilitado",
  esDestacado: false,
  imagen: "",
  centralStock: known(0),
};

function setup(overrides = {}) {
  const handlers = {
    onToggleDestacado: vi.fn(),
    onEditar: vi.fn(),
    onEditarStock: vi.fn(),
    onToggleEstado: vi.fn(),
  };
  const utils = render(
    <ProductCatalogTable
      productos={[cafe, te, agotado]}
      destacadosEnUso={1}
      maxDestacados={3}
      puedeDestacarse={productoPuedeDestacarse}
      puedeEditar
      puedeInactivar
      puedeActualizarStock
      {...handlers}
      {...overrides}
    />,
  );
  return { ...utils, ...handlers };
}

describe("ProductCatalogTable", () => {
  it("puts the category under the product name in the identity cell and drops the Img column", () => {
    const { container } = setup();
    const table = container.querySelector("table");
    const headers = within(table).getAllByRole("columnheader").map((th) => th.textContent.trim());
    expect(headers.join("|")).not.toMatch(/Img/);
    expect(headers.join("|")).toMatch(/Producto/);
    const row = within(table).getByText("Café en grano").closest("tr");
    expect(within(row).getByText("Café · Grano entero")).toBeInTheDocument();
    expect(within(row).getByText("₡3 098", { exact: false })).toBeInTheDocument();
    expect(within(row).getByText("Activo")).toBeInTheDocument();
  });

  it("shows at most three interactive controls per row: star, adjust stock and the overflow menu", () => {
    const { container } = setup();
    const rows = container.querySelectorAll("table tbody tr");
    expect(rows).toHaveLength(3);
    rows.forEach((row) => {
      expect(within(row).getAllByRole("button")).toHaveLength(3);
    });
  });

  it("exposes the featured star as a pressed toggle with a product-specific name and calls the handler", async () => {
    const user = userEvent.setup();
    const { container, onToggleDestacado } = setup();
    const table = container.querySelector("table");
    const quitar = within(table).getByRole("button", { name: "Quitar Café en grano de destacados" });
    expect(quitar).toHaveAttribute("aria-pressed", "true");
    const destacar = within(table).getByRole("button", { name: "Destacar Té verde en inicio" });
    expect(destacar).toHaveAttribute("aria-pressed", "false");
    await user.click(destacar);
    expect(onToggleDestacado).toHaveBeenCalledWith(te);
    await user.click(quitar);
    expect(onToggleDestacado).toHaveBeenCalledWith(cafe);
  });

  it("disables the star at the featured limit and explains why", async () => {
    const { container, onToggleDestacado } = setup({ destacadosEnUso: 3 });
    const table = container.querySelector("table");
    const star = within(table).getByRole("button", { name: "Destacar Té verde en inicio" });
    expect(star).toBeDisabled();
    expect(star).toHaveAttribute("title", "Máximo 3 destacados");
    expect(star).toHaveAccessibleDescription("Máximo 3 destacados");
    // A featured product can always be un-featured.
    expect(within(table).getByRole("button", { name: "Quitar Café en grano de destacados" })).toBeEnabled();
    expect(onToggleDestacado).not.toHaveBeenCalled();
  });

  it("explains why a product that is out of stock or inactive cannot be featured", () => {
    const { container } = setup();
    const table = container.querySelector("table");
    const star = within(table).getByRole("button", { name: "Destacar Miel de abeja en inicio" });
    expect(star).toBeDisabled();
    expect(star).toHaveAttribute("title", "No puedes destacar un producto deshabilitado");
  });

  it("marks low stock with an amber word and the existing threshold, never by color alone", () => {
    const { container } = setup();
    const table = container.querySelector("table");
    const teRow = within(table).getByText("Té verde").closest("tr");
    expect(within(teRow).getByText("Bajo")).toBeInTheDocument();
    expect(within(teRow).getByText("3")).toBeInTheDocument();
    const mielRow = within(table).getByText("Miel de abeja").closest("tr");
    expect(within(mielRow).getByText("Agotado")).toBeInTheDocument();
    const cafeRow = within(table).getByText("Café en grano").closest("tr");
    expect(within(cafeRow).queryByText("Bajo")).not.toBeInTheDocument();
  });

  it("opens the stock editor from Ajustar stock without opening the edit drawer", async () => {
    const user = userEvent.setup();
    const { container, onEditarStock, onEditar } = setup();
    const table = container.querySelector("table");
    await user.click(within(table).getByRole("button", { name: "Ajustar stock de Té verde" }));
    expect(onEditarStock).toHaveBeenCalledTimes(1);
    expect(onEditarStock).toHaveBeenCalledWith(te);
    expect(onEditar).not.toHaveBeenCalled();
  });

  it("opens the editor when the row is clicked, once", async () => {
    const user = userEvent.setup();
    const { container, onEditar } = setup();
    const table = container.querySelector("table");
    await user.click(within(table).getByText("Té verde"));
    expect(onEditar).toHaveBeenCalledTimes(1);
    expect(onEditar).toHaveBeenCalledWith(te);
  });

  it("does not open the editor from the row when the user cannot edit", async () => {
    const user = userEvent.setup();
    const { container, onEditar } = setup({ puedeEditar: false });
    const table = container.querySelector("table");
    await user.click(within(table).getByText("Té verde"));
    expect(onEditar).not.toHaveBeenCalled();
  });

  it("keeps Editar and Desactivar inside the overflow menu and Activar for inactive products", async () => {
    const user = userEvent.setup();
    const { container, onEditar, onToggleEstado } = setup();
    const table = container.querySelector("table");

    expect(within(table).queryByRole("button", { name: "Desactivar" })).not.toBeInTheDocument();
    await user.click(within(table).getByRole("button", { name: "Más acciones de Té verde" }));
    await user.click(screen.getByRole("menuitem", { name: "Desactivar" }));
    expect(onToggleEstado).toHaveBeenCalledWith(te);

    await user.click(within(table).getByRole("button", { name: "Más acciones de Té verde" }));
    await user.click(screen.getByRole("menuitem", { name: "Editar" }));
    expect(onEditar).toHaveBeenCalledWith(te);
    expect(onEditar).toHaveBeenCalledTimes(1);

    await user.click(within(table).getByRole("button", { name: "Más acciones de Miel de abeja" }));
    expect(screen.getByRole("menuitem", { name: "Activar" })).toBeInTheDocument();
  });

  it("blocks deactivating a featured product and says how to unblock it", async () => {
    const user = userEvent.setup();
    const { container, onToggleEstado } = setup();
    const table = container.querySelector("table");
    await user.click(within(table).getByRole("button", { name: "Más acciones de Café en grano" }));
    const item = screen.getByRole("menuitem", { name: /Desactivar/ });
    expect(item).toBeDisabled();
    expect(item).toHaveAccessibleDescription("Quita el destacado antes de desactivarlo");
    await user.click(item);
    expect(onToggleEstado).not.toHaveBeenCalled();
  });

  it("hides mutation controls the user is not allowed to use", () => {
    const { container } = setup({ puedeEditar: false, puedeInactivar: false, puedeActualizarStock: false });
    const table = container.querySelector("table");
    expect(within(table).queryByRole("button", { name: /Ajustar stock/ })).not.toBeInTheDocument();
    expect(within(table).queryByRole("button", { name: /Más acciones/ })).not.toBeInTheDocument();
  });

  it("renders compact mobile rows with category and status on the second line", () => {
    const { container } = setup();
    const list = container.querySelector("ul");
    const item = within(list).getByText("Té verde").closest("li");
    expect(within(item).getByText("Té")).toBeInTheDocument();
    expect(within(item).getByText("Activo")).toBeInTheDocument();
    expect(within(item).getByText("Bajo")).toBeInTheDocument();
    expect(within(item).getByRole("button", { name: "Destacar Té verde en inicio" })).toBeInTheDocument();
    expect(within(item).getByRole("button", { name: "Más acciones de Té verde" })).toBeInTheDocument();
    // Ajustar stock moves into the menu on small containers.
    expect(within(item).getAllByRole("button")).toHaveLength(2);
  });

  it("sorts by name, price and stock from the column headers", async () => {
    const user = userEvent.setup();
    const { container } = setup();
    const table = container.querySelector("table");
    const names = () => within(table).getAllByRole("row").slice(1).map((row) => row.querySelector("td").textContent);
    expect(names()[0]).toMatch(/Café en grano/);
    await user.click(within(table).getByRole("button", { name: /Precio/ }));
    expect(names()[0]).toMatch(/Té verde/);
    await user.click(within(table).getByRole("button", { name: /Stock/ }));
    expect(names()[0]).toMatch(/Miel de abeja/);
  });
});
