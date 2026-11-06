import { StrictMode } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearSession, saveAuthenticatedUser } from "../services/sessionService";
import { useSessionUser } from "./useSessionUser";

function renderSession() {
  return renderHook(() => useSessionUser(), { wrapper: StrictMode });
}

describe("useSessionUser", () => {
  beforeEach(() => {
    // clearSession() leaves the module in logging-out state until a session is saved again.
    saveAuthenticatedUser({ id: 0 });
    localStorage.clear();
  });
  afterEach(() => {
    clearSession();
    localStorage.clear();
  });

  it("returns null without a session", () => {
    expect(renderSession().result.current).toBeNull();
  });

  it("returns the stored user and keeps the same reference between renders", () => {
    saveAuthenticatedUser({ id: 7, name: "Ana" });
    const { result, rerender } = renderSession();
    const first = result.current;
    expect(first.id).toBe(7);

    rerender();
    expect(result.current).toBe(first);
  });

  it("updates when the session is saved or cleared after mount", () => {
    const { result } = renderSession();
    expect(result.current).toBeNull();

    act(() => {
      saveAuthenticatedUser({ id: 9, name: "Luis" });
    });
    expect(result.current.id).toBe(9);

    act(() => {
      clearSession();
    });
    expect(result.current).toBeNull();
  });

  it("reads an expired session as null without console errors and clears it after mount", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem("user", JSON.stringify({ id: 1, expiresAt: Date.now() - 1000 }));

    const { result } = renderSession();

    expect(result.current).toBeNull();
    expect(error).not.toHaveBeenCalled();
    expect(localStorage.getItem("user")).toBeNull();
    error.mockRestore();
  });

  it("follows a storage event coming from another tab", () => {
    saveAuthenticatedUser({ id: 4 });
    const { result } = renderSession();
    expect(result.current.id).toBe(4);

    act(() => {
      localStorage.setItem("user", JSON.stringify({ id: 5, expiresAt: Date.now() + 60000 }));
      window.dispatchEvent(new Event("storage"));
    });
    expect(result.current.id).toBe(5);
  });

  it("keeps the same reference when the stored user is re-read as an equal object", () => {
    saveAuthenticatedUser({ id: 3, name: "Eva" });
    const { result } = renderSession();
    const first = result.current;

    act(() => {
      window.dispatchEvent(new Event("storage"));
    });
    expect(result.current).toBe(first);
  });
});
