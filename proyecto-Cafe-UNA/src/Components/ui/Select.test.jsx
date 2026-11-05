import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { UiSelect } from "./Select";

function renderWithLabel() {
  render(
    <div>
      <label htmlFor="color-select">Color</label>
      <UiSelect
        id="color-select"
        value="a"
        onChange={() => {}}
        options={[
          { value: "a", label: "Rojo" },
          { value: "b", label: "Azul" },
        ]}
        traducirOpciones={false}
      />
      <button type="button">Outside</button>
    </div>,
  );
  return screen.getByRole("button", { name: "Color" });
}

describe("UiSelect open state", () => {
  it("toggles from its trigger", async () => {
    const trigger = renderWithLabel();

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on an outside click", async () => {
    const trigger = renderWithLabel();

    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("button", { name: "Outside" }));

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens a closed select when its label is clicked", async () => {
    const trigger = renderWithLabel();

    await userEvent.click(screen.getByText("Color"));

    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("closes an open select when its label is clicked, without reopening it", async () => {
    const trigger = renderWithLabel();

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(screen.getByText("Color"));

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
