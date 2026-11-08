import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminPageHeader } from "./AdminPageHeader";

describe("AdminPageHeader", () => {
  it("renders the title as the page h1", () => {
    render(<AdminPageHeader title="Productos" />);
    expect(screen.getByRole("heading", { level: 1, name: "Productos" })).toBeInTheDocument();
  });

  it("renders the optional description, actions and meta", () => {
    render(
      <AdminPageHeader
        title="Productos"
        description="Administración de inventario"
        meta={<span>Destacados 1/3</span>}
        actions={<button type="button">Nuevo</button>}
      />,
    );
    expect(screen.getByText("Administración de inventario")).toBeInTheDocument();
    expect(screen.getByText("Destacados 1/3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nuevo" })).toBeInTheDocument();
  });

  it("omits optional slots when not provided", () => {
    const { container } = render(<AdminPageHeader title="Productos" />);
    expect(container.querySelector("p")).toBeNull();
    expect(container.querySelector("[data-slot='actions']")).toBeNull();
  });

  it("uses no uppercase or tracking utilities (no kicker)", () => {
    const { container } = render(
      <AdminPageHeader title="Productos" description="d" meta={<span>m</span>} actions={<button type="button">a</button>} />,
    );
    expect(container.innerHTML).not.toMatch(/uppercase|tracking-\[?0\.1|tracking-wide/);
  });
});
