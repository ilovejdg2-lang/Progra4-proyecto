import { StrictMode } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { clearSession, saveAuthenticatedUser } from "../services/sessionService";
import { useSessionUser } from "./useSessionUser";

function renderSession() {
  return renderHook(() => useSessionUser(), { wrapper: StrictMode });
}

describe("useSessionUser", () => {
  beforeEach(() => localStorage.clear());
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
});
