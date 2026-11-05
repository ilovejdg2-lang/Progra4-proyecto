import { StrictMode } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { setAdminTheme } from "../lib/adminTheme";
import { useAdminThemeDark } from "./useAdminThemeDark";

describe("useAdminThemeDark", () => {
  afterEach(() => {
    setAdminTheme("light");
    localStorage.clear();
  });

  it("reads the stored theme and follows theme change events", () => {
    const { result } = renderHook(() => useAdminThemeDark(), { wrapper: StrictMode });
    expect(result.current).toBe(false);

    act(() => {
      setAdminTheme("dark");
    });
    expect(result.current).toBe(true);

    act(() => {
      setAdminTheme("light");
    });
    expect(result.current).toBe(false);
  });
});
