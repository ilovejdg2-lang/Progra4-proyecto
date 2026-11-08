import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Coffee } from "lucide-react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminSeccionFila } from "./AdminSeccionFila";

describe("AdminSeccionFila", () => {
  beforeEach(() => {
    localStorage.setItem("cafe-una-idioma", "es");
  });

  it("renders the whole row as one button named after the section", () => {
    render(<AdminSeccionFila nombre="Productos destacados" resumen="Nuestros cafes" icono={Coffee} onEditar={vi.fn()} />);

    const fila = screen.getByRole("button", { name: "Editar Productos destacados" });
    expect(fila).toHaveAttribute("type", "button");
    expect(fila.querySelector("button, a, input")).toBeNull();
    expect(screen.getByText("Productos destacados")).toBeInTheDocument();
    expect(screen.getByText("Nuestros cafes")).toBeInTheDocument();
  });

  it("calls onEditar when the row is clicked", async () => {
    const onEditar = vi.fn();
    render(<AdminSeccionFila nombre="Hero" resumen="Titulo" icono={Coffee} onEditar={onEditar} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Editar Hero" }));
    expect(onEditar).toHaveBeenCalledTimes(1);
  });

  it("shows a muted hint when there is no saved content", () => {
    render(<AdminSeccionFila nombre="Hero" resumen="" icono={Coffee} onEditar={vi.fn()} />);
    expect(screen.getByText("Sin contenido")).toBeInTheDocument();
  });

  it("shows the order number and a decorative thumbnail only when provided", () => {
    const { container, rerender } = render(
      <AdminSeccionFila numero={3} nombre="Hero" resumen="Titulo" icono={Coffee} imagen="https://example.test/a.png" onEditar={vi.fn()} />,
    );
    expect(screen.getByText("3")).toBeInTheDocument();
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("loading", "lazy");

    rerender(<AdminSeccionFila nombre="Hero" resumen="Titulo" icono={Coffee} onEditar={vi.fn()} />);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.queryByText("3")).not.toBeInTheDocument();
  });
});
