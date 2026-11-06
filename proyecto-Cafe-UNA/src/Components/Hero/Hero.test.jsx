import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Hero from "./Hero";

const data = { backgroundImage: "https://example.com/hero.jpg", title: "Hola" };

describe("Hero background readiness", () => {
  it("stays ready when the parent passes a new onBackgroundReady callback", async () => {
    const { container, rerender } = render(<Hero data={data} onBackgroundReady={() => {}} />);
    const section = container.querySelector("#hero");
    expect(section).not.toHaveClass("hero--bg-ready");

    fireEvent.error(container.querySelector("img"));
    expect(section).toHaveClass("hero--bg-ready");

    rerender(<Hero data={data} onBackgroundReady={() => {}} />);
    expect(section).toHaveClass("hero--bg-ready");
  });

  it("is ready immediately without a background and notifies the parent", () => {
    const onReady = vi.fn();
    const { container } = render(<Hero data={{ title: "Hola" }} onBackgroundReady={onReady} />);
    expect(container.querySelector("#hero")).toHaveClass("hero--bg-ready");
    expect(onReady).toHaveBeenCalled();
  });

  it("resets readiness when the background image changes", () => {
    const { container, rerender } = render(<Hero data={data} />);
    fireEvent.error(container.querySelector("img"));
    expect(container.querySelector("#hero")).toHaveClass("hero--bg-ready");

    rerender(<Hero data={{ ...data, backgroundImage: "https://example.com/other.jpg" }} />);
    expect(container.querySelector("#hero")).not.toHaveClass("hero--bg-ready");
  });
});
