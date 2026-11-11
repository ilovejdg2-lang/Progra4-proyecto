import { beforeEach, describe, expect, it, vi } from "vitest";
import { beginLogout, clearSession, getActiveSessionUser, saveAuthenticatedUser, SESSION_UPDATED_EVENT } from "./sessionService";

describe("private image session lifecycle", () => {
  beforeEach(() => {
    clearSession();
    saveAuthenticatedUser({ id: 7, token: "local-test" });
  });

  it("announces logout immediately before asynchronous cart release", () => {
    const states = [];
    const listener = vi.fn(() => states.push(getActiveSessionUser()));
    window.addEventListener(SESSION_UPDATED_EVENT, listener);
    beginLogout();
    window.removeEventListener(SESSION_UPDATED_EVENT, listener);
    expect(listener).toHaveBeenCalledOnce();
    expect(states).toEqual([null]);
    expect(JSON.parse(localStorage.getItem("user")).id).toBe(7);
  });

  it("announces final session removal", () => {
    const listener = vi.fn();
    window.addEventListener(SESSION_UPDATED_EVENT, listener);
    clearSession();
    window.removeEventListener(SESSION_UPDATED_EVENT, listener);
    expect(listener).toHaveBeenCalledOnce();
    expect(getActiveSessionUser()).toBeNull();
  });

  it("clears leftover checkout redirects so the next account is not sent to checkout or client form", () => {
    sessionStorage.setItem("postLoginRedirect", "/checkout");
    sessionStorage.setItem("registroClienteDesdeCheckout", "1");
    sessionStorage.setItem("registroClienteCorreo", "otra@cuenta.test");
    clearSession();
    expect(sessionStorage.getItem("postLoginRedirect")).toBeNull();
    expect(sessionStorage.getItem("registroClienteDesdeCheckout")).toBeNull();
    expect(sessionStorage.getItem("registroClienteCorreo")).toBeNull();
  });
});
