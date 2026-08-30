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
