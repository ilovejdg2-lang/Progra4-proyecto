import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { obtenerIdioma } from "../../lib/idioma";
import { LanguageSwitcher } from "./LanguageSwitcher";

describe("LanguageSwitcher", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("switches language with guardarIdioma only", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher compact />);

    expect(obtenerIdioma()).toBe("es");
    await user.click(screen.getByRole("button", { name: "EN" }));
    expect(obtenerIdioma()).toBe("en");
    await user.click(screen.getByRole("button", { name: "ES" }));
    expect(obtenerIdioma()).toBe("es");
  });
});
