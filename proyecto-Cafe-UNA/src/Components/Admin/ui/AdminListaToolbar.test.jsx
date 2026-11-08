import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminListaToolbar } from "./AdminListaToolbar";

const filtrosBase = (overrides = {}) => [
  {
    id: "estado",
    label: "Estado",
    value: overrides.estado ?? "todos",
    onChange: vi.fn(),
    opciones: [
      { value: "todos", label: "Todos" },
      { value: "activo", label: "Activo" },
    ],
  },
  { id: "desde", label: "Desde", tipo: "fecha", value: overrides.desde ?? "", onChange: vi.fn() },
  { id: "hasta", label: "Hasta", tipo: "fecha", value: overrides.hasta ?? "", onChange: vi.fn() },
];

function renderToolbar(props = {}) {
  return render(
    <AdminListaToolbar busqueda="" onBusquedaChange={vi.fn()} total={5} visibles={5} filtros={filtrosBase()} {...props} />,
  );
}

describe("AdminListaToolbar", () => {
  beforeEach(() => {
    localStorage.setItem("cafe-una-idioma", "es");
  });

  it("renders filter labels in sentence case without uppercase or tracking styles", () => {
    renderToolbar();

    const etiqueta = screen.getByText("Estado", { selector: "span, span *" });
    const contenedor = etiqueta.closest("[class*='13px']");
    expect(contenedor).not.toBeNull();
    expect(contenedor.className).not.toMatch(/uppercase|tracking-/);
    expect(contenedor.className).toMatch(/font-semibold/);
  });

  it("keeps the search input when the extra slot is used", () => {
    renderToolbar({ extra: <button type="button">Exportar CSV</button> });

    expect(screen.getByRole("searchbox", { name: "Buscar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar CSV" })).toBeInTheDocument();
  });

  it("toggles the filters disclosure with aria-expanded and aria-controls", async () => {
    renderToolbar();

    const boton = screen.getByRole("button", { name: /^Filtros/ });
    expect(boton).toHaveAttribute("aria-expanded", "false");
    const panel = document.getElementById(boton.getAttribute("aria-controls"));
    expect(panel).not.toBeNull();
    expect(panel.className).toMatch(/(^|\s)hidden(\s|$)/);

    await userEvent.setup().click(boton);
    expect(boton).toHaveAttribute("aria-expanded", "true");
    expect(panel.className).not.toMatch(/(^|\s)hidden(\s|$)/);

    await userEvent.setup().click(boton);
    expect(boton).toHaveAttribute("aria-expanded", "false");
    expect(panel.className).toMatch(/(^|\s)hidden(\s|$)/);
  });

  it("shows the number of active filters on the disclosure button", () => {
    renderToolbar({ filtros: filtrosBase({ estado: "activo", desde: "2026-01-01" }) });

    expect(screen.getByRole("button", { name: "Filtros · 2" })).toBeInTheDocument();
  });

  it("starts with the filters open when some are already active", () => {
    renderToolbar({ filtros: filtrosBase({ estado: "activo" }) });

    expect(screen.getByRole("button", { name: "Filtros · 1" })).toHaveAttribute("aria-expanded", "true");
  });

  it("omits the disclosure when there are no filters", () => {
    renderToolbar({ filtros: [] });

    expect(screen.queryByRole("button", { name: /^Filtros/ })).toBeNull();
  });

  it("still clears filters from the Limpiar filtros button", async () => {
    const onLimpiar = vi.fn();
    renderToolbar({ hayFiltrosActivos: true, onLimpiar });

    await userEvent.setup().click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(onLimpiar).toHaveBeenCalledTimes(1);
  });
});
