import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import Gallery from "./Gallery";

const items = [
  { id: 1, title: "Uno", image: "/uno.jpg" },
  { id: 2, title: "Dos", image: "/dos.jpg" },
  { id: 3, title: "Tres", image: "/tres.jpg" },
];

describe("Gallery lightbox", () => {
  it("opens a labelled native modal dialog from a photo", async () => {
    render(<Gallery items={items} title="" />);

    await userEvent.click(screen.getByRole("button", { name: "Ver foto: Dos" }));

    const dialog = screen.getByRole("dialog", { name: "Dos", hidden: true });
    expect(dialog.tagName).toBe("DIALOG");
    expect(dialog).toHaveAttribute("open");
  });

  it("navigates with the arrow keys and wraps", async () => {
    render(<Gallery items={items} title="" />);
    await userEvent.click(screen.getByRole("button", { name: "Ver foto: Uno" }));

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByRole("dialog", { name: "Tres", hidden: true })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByRole("dialog", { name: "Uno", hidden: true })).toBeInTheDocument();
  });

  it("closes on Escape, from the close button and from the backdrop", async () => {
    render(<Gallery items={items} title="" />);
    const open = () => userEvent.click(screen.getByRole("button", { name: "Ver foto: Uno" }));

    await open();
    fireEvent.keyDown(document.querySelector("dialog"), { key: "Escape" });
    expect(document.querySelector("dialog")).toBeNull();

    await open();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar", hidden: true }));
    expect(document.querySelector("dialog")).toBeNull();

    await open();
    const dialog = document.querySelector("dialog");
    fireEvent.pointerDown(dialog);
    fireEvent.click(dialog);
    expect(document.querySelector("dialog")).toBeNull();
  });
});
