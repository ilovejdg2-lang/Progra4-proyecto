import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CategoryTree } from "./CategoryTree";

function renderTree(overrides = {}) {
  const props = {
    categorias: [{ nombre: "Cafés", count: 3 }],
    subcategorias: [{ nombre: "Molido", categoria: "Cafés", count: 2 }],
    onSelectCategoria: vi.fn(),
    onSelectSubcategoria: vi.fn(),
    ...overrides,
  };
  render(<CategoryTree {...props} />);
  return props;
}

describe("CategoryTree category row", () => {
  it("selects a category when its name is clicked", async () => {
    const props = renderTree();

    await userEvent.click(screen.getByText("Cafés"));

    expect(props.onSelectCategoria).toHaveBeenCalledWith("Cafés");
  });

  it("selects a category from the keyboard", async () => {
    const props = renderTree();

    await userEvent.tab(); // "Todas las categorías"
    await userEvent.tab(); // expand toggle
    await userEvent.tab(); // category row control
    await userEvent.keyboard("{Enter}");

    expect(props.onSelectCategoria).toHaveBeenCalledWith("Cafés");
  });

  it("expands subcategories with the toggle without selecting the category", async () => {
    const props = renderTree();

    await userEvent.click(screen.getByRole("button", { name: "Expandir subcategorías" }));

    expect(screen.getByText("Molido")).toBeInTheDocument();
    expect(props.onSelectCategoria).not.toHaveBeenCalled();
  });

  it("does not nest interactive controls", () => {
    renderTree();

    const toggle = screen.getByRole("button", { name: "Expandir subcategorías" });
    expect(toggle.parentElement.closest("button, [role='button']")).toBeNull();
    fireEvent.click(toggle);
  });
});
