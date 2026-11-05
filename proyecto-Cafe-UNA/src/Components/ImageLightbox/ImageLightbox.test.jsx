import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ImageLightbox } from "./ImageLightbox";

function renderLightbox(props = {}) {
  const onClose = vi.fn();
  const onIndexChange = vi.fn();
  render(
    <ImageLightbox
      images={["/a.jpg", "/b.jpg", "/c.jpg"]}
      index={1}
      onClose={onClose}
      onIndexChange={onIndexChange}
      {...props}
    />,
  );
  return { onClose, onIndexChange };
}

describe("ImageLightbox", () => {
  it("renders nothing when closed", () => {
    renderLightbox({ index: -1 });
    expect(document.querySelector("dialog")).toBeNull();
  });

  it("is a native modal dialog showing the current image", () => {
    renderLightbox();

    const dialog = screen.getByRole("dialog", { name: "Vista ampliada", hidden: true });
    expect(dialog.tagName).toBe("DIALOG");
    expect(screen.getByRole("img", { hidden: true })).toHaveAttribute("src", "/b.jpg");
  });

  it("closes on Escape and from its close controls", () => {
    const { onClose } = renderLightbox();

    fireEvent.keyDown(document.querySelector("dialog"), { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Cerrar", hidden: true }));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar vista ampliada", hidden: true }));

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("navigates with arrow keys and wraps around", () => {
    const { onIndexChange } = renderLightbox({ index: 0 });

    fireEvent.keyDown(document, { key: "ArrowLeft" });
    fireEvent.keyDown(document, { key: "ArrowRight" });

    expect(onIndexChange).toHaveBeenNthCalledWith(1, 2);
    expect(onIndexChange).toHaveBeenNthCalledWith(2, 1);
  });
});
