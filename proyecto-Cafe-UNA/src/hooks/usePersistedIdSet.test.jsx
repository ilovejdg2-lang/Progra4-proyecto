import { StrictMode } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePersistedIdSet } from "./usePersistedIdSet";

const KEY = "test_ids";

function renderIds() {
  return renderHook(() => usePersistedIdSet(KEY), { wrapper: StrictMode });
}

describe("usePersistedIdSet", () => {
  beforeEach(() => localStorage.removeItem(KEY));
  afterEach(() => vi.restoreAllMocks());

  it("starts from the stored ids and falls back to an empty set on corrupt data", () => {
    localStorage.setItem(KEY, JSON.stringify(["1", "2"]));
    expect([...renderIds().result.current.ids]).toEqual(["1", "2"]);

    localStorage.setItem(KEY, "{not json");
    expect(renderIds().result.current.ids.size).toBe(0);
  });

  it("toggles ids and persists each change exactly once", () => {
    const { result } = renderIds();
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    setItem.mockClear();

    act(() => result.current.toggle(7));
    expect(result.current.ids.has("7")).toBe(true);
    expect(JSON.parse(localStorage.getItem(KEY))).toEqual(["7"]);
    expect(setItem).toHaveBeenCalledTimes(1);

    act(() => result.current.toggle("7"));
    expect(result.current.ids.size).toBe(0);
    expect(JSON.parse(localStorage.getItem(KEY))).toEqual([]);
  });

  it("add is idempotent", () => {
    const { result } = renderIds();

    act(() => result.current.add(3));
    act(() => result.current.add(3));

    expect(JSON.parse(localStorage.getItem(KEY))).toEqual(["3"]);
  });

  it("keeps working when storage writes fail", () => {
    const { result } = renderIds();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    act(() => result.current.toggle(1));

    expect(result.current.ids.has("1")).toBe(true);
    expect(warn).toHaveBeenCalled();
  });
});
