import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CheckoutPuntoCard } from "./CheckoutPuntoCard";

const etiquetas = {
  etiquetaDisponible: "Disponible",
  etiquetaSinStock: "Sin stock suficiente para este pedido",
  etiquetaUnidades: "unidades",
  etiquetaUnidadesEnStock: "unidades en stock",
};

function punto(extra = {}) {
  return {
    code: "POS_EDITORIAL",
    name: "Editorial",
    direccion: "Campus Omar Dengo, Heredia",
    imagenUrl: "/api/inventario/ubicaciones/imagenes/punto-1.jpg",
    mapsUrl: "https://maps.app.goo.gl/abc",
    cubrePedido: true,
    ...extra,
  };
}

describe("CheckoutPuntoCard", () => {
  it("muestra foto, dirección, stock y un enlace seguro a Maps", () => {
    const { container } = render(
      <CheckoutPuntoCard
        punto={punto()}
        seleccionado={false}
        lineasStock={[{ id: "1", nombre: "Café", disponible: 24 }]}
        onSelect={vi.fn()}
        {...etiquetas}
      />,
    );

    expect(screen.getByRole("radio", { name: /Editorial/ })).toBeTruthy();
    expect(screen.getByText("Editorial")).toBeTruthy();
    expect(screen.getByText("Campus Omar Dengo, Heredia")).toBeTruthy();
    expect(screen.getByText("24 unidades en stock")).toBeTruthy();
    const enlace = screen.getByRole("link", { name: /ver en maps/i });
    expect(enlace).toHaveAttribute("href", "https://maps.app.goo.gl/abc");
    expect(enlace).toHaveAttribute("target", "_blank");
    expect(enlace).toHaveAttribute("rel", "noopener noreferrer");
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/api/inventario/ubicaciones/imagenes/punto-1.jpg",
    );
  });

  it("selecciona la tarjeta y no la selección al abrir Maps", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <CheckoutPuntoCard
        punto={punto()}
        seleccionado
        lineasStock={[{ id: "1", nombre: "Café", disponible: 24 }]}
        onSelect={onSelect}
        {...etiquetas}
      />,
    );

    await user.click(screen.getByText("Editorial"));
    expect(onSelect).toHaveBeenCalledWith("POS_EDITORIAL");

    onSelect.mockClear();
    await user.click(screen.getByRole("link", { name: /ver en maps/i }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("oculta el enlace si la URL no es de Maps y usa el recuadro sin foto", () => {
    const { container } = render(
      <CheckoutPuntoCard
        punto={punto({ imagenUrl: "", mapsUrl: "https://evil.example", direccion: "" })}
        seleccionado={false}
        lineasStock={[{ id: "1", nombre: "Café", disponible: 2 }]}
        onSelect={vi.fn()}
        {...etiquetas}
      />,
    );

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector(".checkout-pos__photo--empty")).toBeTruthy();
  });

  it("no selecciona un punto sin stock suficiente", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <CheckoutPuntoCard
        punto={punto({ cubrePedido: false })}
        seleccionado={false}
        lineasStock={[]}
        onSelect={onSelect}
        {...etiquetas}
      />,
    );

    expect(screen.getByText("Sin stock suficiente para este pedido")).toBeTruthy();
    await user.click(screen.getByText("Editorial"));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
