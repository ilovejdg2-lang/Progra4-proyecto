import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PreviewGaleriaLive } from "./AdminCmsPreview";

const fotos = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, title: `Foto ${i + 1}`, image: `/f${i + 1}.jpg` }));

describe("PreviewGaleriaLive", () => {
  it("keeps the gallery page when the parent re-renders with the same items", () => {
    const { rerender } = render(<PreviewGaleriaLive items={fotos} />);
    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(screen.queryByRole("button", { name: "Ver foto: Foto 1" })).toBeNull();

    rerender(<PreviewGaleriaLive items={fotos} />);

    expect(screen.queryByRole("button", { name: "Ver foto: Foto 1" })).toBeNull();
    expect(screen.getByRole("button", { name: "Ver foto: Foto 11" })).toBeInTheDocument();
  });
});
