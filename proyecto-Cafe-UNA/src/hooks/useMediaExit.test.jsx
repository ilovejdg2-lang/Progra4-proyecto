import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useMediaExit } from "./useMediaExit";

function stubMatchMedia(initial) {
  const listeners = new Set();
  const mql = {
    matches: initial,
    addEventListener: (_, fn) => listeners.add(fn),
    removeEventListener: (_, fn) => listeners.delete(fn),
  };
  vi.stubGlobal("matchMedia", () => mql);
  return {
    set(matches) {
      mql.matches = matches;
      listeners.forEach((fn) => fn({ matches }));
    },
    listenerCount: () => listeners.size,
  };
}

describe("useMediaExit", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("calls onExit when the query stops matching while active", () => {
    const media = stubMatchMedia(true);
    const onExit = vi.fn();
    renderHook(() => useMediaExit("(max-width: 900px)", true, onExit));

    act(() => media.set(false));

    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("does nothing while the query keeps matching, when inactive, and after unmount", () => {
    const media = stubMatchMedia(true);
    const onExit = vi.fn();
    const { rerender, unmount } = renderHook(({ active }) => useMediaExit("(max-width: 900px)", active, onExit), {
      initialProps: { active: false },
    });

    act(() => media.set(false));
    expect(onExit).not.toHaveBeenCalled();
    expect(media.listenerCount()).toBe(0);

    act(() => media.set(true));
    rerender({ active: true });
    act(() => media.set(true));
    expect(onExit).not.toHaveBeenCalled();

    unmount();
    expect(media.listenerCount()).toBe(0);
  });

  it("exits immediately when activated while the query already does not match", () => {
    stubMatchMedia(false);
    const onExit = vi.fn();
    renderHook(() => useMediaExit("(max-width: 900px)", true, onExit));

    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
