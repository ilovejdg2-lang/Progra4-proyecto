import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../ProductDetail/HorarioCompra", () => ({
  HorarioCompra: ({ titulo, ubicacionId }) => (
    <div data-testid="horario-retiro" data-ubicacion={ubicacionId}>{titulo}</div>
  ),
}));

import { CheckoutPuntoDetalle } from "./CheckoutPuntoDetalle";

function punto(extra = {}) {
  return {
    id: 2,
    name: "FUNDA-UNA",
    direccion: "Avenida 2 y Calle 9, Heredia",
    telefono: "+506 4000-2010",
    horario: "Lunes a viernes de 7:30 a. m. a 5:00 p. m.",
    imagenUrl: "/api/inventario/ubicaciones/imagenes/principal.jpg",
    imagenes: [
      "/api/inventario/ubicaciones/imagenes/extra-1.jpg",
      "/api/inventario/ubicaciones/imagenes/extra-2.jpg",
    ],
    mapsUrl: "https://maps.app.goo.gl/abc",
    ...extra,
  };
}

describe("CheckoutPuntoDetalle", () => {
  it("muestra galería, datos y el horario de retiro del punto elegido", () => {
    const { container } = render(<CheckoutPuntoDetalle punto={punto()} />);

    expect(screen.getByRole("heading", { name: "Detalles del punto de venta" })).toBeTruthy();
    expect(screen.getByText("FUNDA-UNA")).toBeTruthy();
    expect(screen.getByText("Dirección")).toBeTruthy();
    expect(screen.getByText("Avenida 2 y Calle 9, Heredia")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Ver en Maps/ }).getAttribute("href")).toBe("https://maps.app.goo.gl/abc");
    expect(screen.getByText("Teléfono")).toBeTruthy();
    expect(screen.getByText("+506 4000-2010")).toBeTruthy();
    expect(screen.getByText("Horario")).toBeTruthy();
    expect(container.querySelectorAll("img")).toHaveLength(3);
    expect(screen.getByTestId("horario-retiro").textContent).toBe("Horarios disponibles para retiro");
    expect(screen.getByTestId("horario-retiro").getAttribute("data-ubicacion")).toBe("2");
  });

  it("omite la galería y los datos que no existen", () => {
    const { container } = render(
      <CheckoutPuntoDetalle
        punto={punto({
          imagenUrl: "",
          imagenes: [],
          direccion: "",
          telefono: "",
          horario: "",
          mapsUrl: "",
        })}
      />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(screen.queryByText("Dirección")).toBeNull();
    expect(screen.queryByText("Teléfono")).toBeNull();
    expect(screen.queryByText("Horario")).toBeNull();
    expect(screen.queryByRole("link", { name: /Ver en Maps/ })).toBeNull();
    expect(screen.getByText("FUNDA-UNA")).toBeTruthy();
  });
});
