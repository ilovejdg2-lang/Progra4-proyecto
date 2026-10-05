import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CartLine, metaCarrito } from "./CartLine";

describe("metaCarrito", () => {
  it("junta peso y tueste sin la cantidad", () => {
    expect(metaCarrito({ peso: "500 g", subcategoria: "Tueste medio", units: 2 })).toBe(
      "500 g · Tueste medio",
    );
  });

  it("omite partes vacias", () => {
    expect(metaCarrito({ peso: "500 g", subcategoria: "  " })).toBe("500 g");
    expect(metaCarrito({})).toBe("");
  });
});

describe("CartLine", () => {
  it("muestra el producto compacto, sin importe", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const onDecrease = vi.fn();
    const onIncrease = vi.fn();

    render(
      <CartLine
        nombre="Café molido"
        meta="500 g · Tueste medio"
        precio="CRC 5,650"
        imagen="/cafe.jpg"
        unidades={1}
        onRemove={onRemove}
        onDecrease={onDecrease}
        onIncrease={onIncrease}
        removeLabel="Eliminar producto: Café molido"
        ivaLabel="IVA incluido"
        decreaseLabel="Quitar una unidad"
        increaseLabel="Agregar una unidad"
      />,
    );

    expect(screen.getByText("Café molido")).toBeInTheDocument();
    expect(screen.getByText("500 g · Tueste medio")).toBeInTheDocument();
    expect(screen.getByText("CRC 5,650")).toBeInTheDocument();
    expect(screen.getByText("IVA incluido")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.queryByText(/importe/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sin iva/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Eliminar producto: Café molido" }));
    await user.click(screen.getByRole("button", { name: "Quitar una unidad" }));
    await user.click(screen.getByRole("button", { name: "Agregar una unidad" }));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onDecrease).toHaveBeenCalledTimes(1);
    expect(onIncrease).toHaveBeenCalledTimes(1);
  });
});
