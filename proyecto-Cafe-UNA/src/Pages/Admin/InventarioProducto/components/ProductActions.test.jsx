import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductActions } from "./ProductActions";

const product = {
  id: 1,
  nombre: "Café Premium",
  estado: "Habilitado",
  esDestacado: false,
};

describe("ProductActions", () => {
  it("does not expose catalog mutations without permission", () => {
    render(
      <ProductActions
        producto={product}
        puedeEditar={false}
        puedeInactivar={false}
        onEditar={vi.fn()}
        onToggleEstado={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Desactivar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Inhabilitar" })).not.toBeInTheDocument();
  });
});

describe("ProductActions color roles", () => {
  const renderActions = (producto) =>
    render(
      <ProductActions
        producto={producto}
        puedeEditar
        puedeInactivar
        puedeActualizarStock
        onEditar={vi.fn()}
        onToggleEstado={vi.fn()}
        onEditarStock={vi.fn()}
      />,
    );

  it("Editar is a quiet row action, not a filled black button", () => {
    renderActions(product);
    const cls = screen.getByRole("button", { name: "Editar" }).className;
    expect(cls).toContain("admin-role-quiet");
    expect(cls).not.toMatch(/slate-950|bg-black|text-white/);
  });

  it("Desactivar is danger text with a border on a transparent fill", () => {
    renderActions(product);
    const cls = screen.getByRole("button", { name: "Desactivar" }).className;
    expect(cls).toContain("admin-role-danger");
    expect(cls).not.toMatch(/rose-|pink-/);
  });

  it("Activar is success text with a border on a transparent fill", () => {
    renderActions({ ...product, estado: "Deshabilitado" });
    const cls = screen.getByRole("button", { name: "Activar" }).className;
    expect(cls).toContain("admin-role-positive");
    expect(cls).not.toMatch(/emerald-/);
  });
});
