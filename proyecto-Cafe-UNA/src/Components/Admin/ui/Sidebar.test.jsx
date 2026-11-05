import { StrictMode } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SidebarProvider, useSidebar } from "./Sidebar";

const KEY = "admin-sidebar-desktop-open";

function renderSidebar() {
  return renderHook(() => useSidebar(), {
    wrapper: ({ children }) => (
      <StrictMode>
        <SidebarProvider>{children}</SidebarProvider>
      </StrictMode>
    ),
  });
}

describe("SidebarProvider setOpen persistence", () => {
  beforeEach(() => localStorage.removeItem(KEY));
  afterEach(() => vi.restoreAllMocks());

  it("persists the new value once per update, even for functional updates under StrictMode", () => {
    const { result } = renderSidebar();
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    act(() => result.current.setOpen((value) => !value));

    expect(result.current.open).toBe(false);
    expect(localStorage.getItem(KEY)).toBe("false");
    expect(setItem).toHaveBeenCalledTimes(1);
  });

  it("persists direct values", () => {
    const { result } = renderSidebar();

    act(() => result.current.setOpen(false));
    expect(localStorage.getItem(KEY)).toBe("false");

    act(() => result.current.setOpen(true));
    expect(localStorage.getItem(KEY)).toBe("true");
  });
});
