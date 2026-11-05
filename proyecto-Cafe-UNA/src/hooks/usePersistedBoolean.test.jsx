import { StrictMode } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePersistedBoolean } from "./usePersistedBoolean";

const KEY = "test_bool";

function renderBool(defaultValue = false) {
  return renderHook(() => usePersistedBoolean(KEY, defaultValue), { wrapper: StrictMode });
}

describe("usePersistedBoolean", () => {
  beforeEach(() => localStorage.removeItem(KEY));
  afterEach(() => vi.restoreAllMocks());

  it("reads the stored value and falls back to the default when nothing is stored", () => {
    expect(renderBool(true).result.current[0]).toBe(true);

    localStorage.setItem(KEY, "false");
    expect(renderBool(true).result.current[0]).toBe(false);

    localStorage.setItem(KEY, "true");
    expect(renderBool(false).result.current[0]).toBe(true);
  });

  it("does not write on mount", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    renderBool(true);
    expect(setItem).not.toHaveBeenCalled();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("applies two updates in the same tick on top of each other and persists the result once", () => {
    const { result } = renderBool(true);
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    act(() => {
      result.current[1](false);
      result.current[1]((value) => !value);
    });

    expect(result.current[0]).toBe(true);
    act(() => {
      result.current[1]((value) => !value);
      result.current[1]((value) => !value);
      result.current[1]((value) => !value);
    });
    expect(result.current[0]).toBe(false);
    expect(localStorage.getItem(KEY)).toBe("false");
    expect(setItem.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it("keeps a stable setter identity", () => {
    const { result } = renderBool();
    const first = result.current[1];
    act(() => result.current[1](true));
    expect(result.current[1]).toBe(first);
  });

  it("keeps working when storage writes fail", () => {
    const { result } = renderBool();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    act(() => result.current[1](true));

    expect(result.current[0]).toBe(true);
    expect(warn).toHaveBeenCalled();
  });
});
