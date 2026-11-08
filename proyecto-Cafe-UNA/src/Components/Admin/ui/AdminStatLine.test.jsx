import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminStatLine } from "./AdminStatLine";

describe("AdminStatLine", () => {
  it("renders each label with its value as a description list", () => {
    const { container } = render(
      <AdminStatLine items={[{ label: "Pedidos", value: "12" }, { label: "Total en libro", value: "₡1 000" }]} />,
    );
    expect(container.querySelectorAll("dt")).toHaveLength(2);
    expect(screen.getByText("Pedidos")).toBeInTheDocument();
    expect(screen.getByText("₡1 000")).toBeInTheDocument();
  });

  it("uses tabular numerals for values and no uppercase styling", () => {
    const { container } = render(<AdminStatLine items={[{ label: "Pedidos", value: 3 }]} />);
    expect(container.querySelector("dd")).toHaveClass("tabular-nums", "font-semibold");
    expect(container.innerHTML).not.toMatch(/uppercase|tracking-/);
  });

  it("renders nothing without items", () => {
    const { container } = render(<AdminStatLine items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
