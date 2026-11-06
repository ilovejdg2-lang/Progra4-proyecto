import { StrictMode } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { guardarIdioma, IDIOMA_CHANGED_EVENT } from "./idioma";
import { useIdioma } from "./useIdioma";

describe("useIdioma", () => {
  afterEach(() => localStorage.clear());

  it("reads the stored language and follows changes made through guardarIdioma", () => {
    const { result } = renderHook(() => useIdioma(), { wrapper: StrictMode });
    expect(result.current.idioma).toBe("es");
    expect(result.current.esEn).toBe(false);

    act(() => {
      guardarIdioma("en");
    });
    expect(result.current.idioma).toBe("en");
    expect(result.current.esEn).toBe(true);

    act(() => {
      result.current.setIdioma("es");
    });
    expect(result.current.idioma).toBe("es");
  });
});

describe("useIdioma subscriptions", () => {
  it("shares a single window listener per event across many consumers", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const relevant = (spy) => spy.mock.calls.filter(([type]) => type === "storage" || type === IDIOMA_CHANGED_EVENT);

    const views = Array.from({ length: 60 }, () => renderHook(() => useIdioma()));
    // Many listeners would each flush their own render when the browser dispatches a
    // native storage event (microtasks run between listeners), tripping React's
    // nested update guard. One shared listener keeps the notification in one callback.
    expect(relevant(add)).toHaveLength(2);

    views.forEach((view) => view.unmount());
    expect(relevant(remove)).toHaveLength(2);
    add.mockRestore();
    remove.mockRestore();
  });
});
