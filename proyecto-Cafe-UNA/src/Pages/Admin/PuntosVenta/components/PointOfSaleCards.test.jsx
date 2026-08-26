import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PointOfSaleCards } from "./PointOfSaleCards";

const locations = [
  { code: "POS_FUNA_UNA", name: "FUNA-UNA" },
  { code: "POS_EDITORIAL", name: "Editorial" },
];

describe("PointOfSaleCards", () => {
  it("selects a POS with an accessible pressed state", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PointOfSaleCards locations={locations} selectedCode="POS_FUNA_UNA" onSelect={onSelect} />);

    expect(screen.getByRole("button", { name: /FUNA-UNA/i }))
      .toHaveAttribute("aria-pressed", "true")
      .toHaveClass("!rounded-2xl");
    await user.click(screen.getByRole("button", { name: /Editorial/i }));
    expect(onSelect).toHaveBeenCalledWith("POS_EDITORIAL");
  });
});
