import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicPageHeader } from "./PublicPageHeader";

describe("PublicPageHeader", () => {
  it("renders the title as h1, the lead line and the actions slot", () => {
    render(
      <PublicPageHeader title="Repositorio" lead="Una línea." actions={<button type="button">Enviar</button>} />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Repositorio" })).toBeInTheDocument();
    expect(screen.getByText("Una línea.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar" })).toBeInTheDocument();
  });

  it("omits lead and actions when not provided", () => {
    const { container } = render(<PublicPageHeader title="Solo título" />);
    expect(container.querySelector(".pub-page-header__lead")).toBeNull();
    expect(container.querySelector(".pub-page-header__actions")).toBeNull();
  });
});
