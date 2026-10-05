import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ADMIN_THEME_STORAGE_KEY,
  applyAdminDocumentTheme,
  readAdminTheme,
  setAdminTheme,
  transitionAdminTheme,
} from "./adminTheme";

describe("adminTheme", () => {
  afterEach(() => {
    window.localStorage.removeItem(ADMIN_THEME_STORAGE_KEY);
    document.documentElement.classList.remove(
      "dark",
      "admin-theme-dark",
      "admin-theme-vt",
      "admin-theme-animating",
    );
    document.documentElement.style.removeProperty("--admin-theme-x");
    document.documentElement.style.removeProperty("--admin-theme-y");
    document.documentElement.style.removeProperty("--admin-theme-r");
    delete document.startViewTransition;
    vi.useRealTimers();
  });

  it("defaults to light", () => {
    expect(readAdminTheme()).toBe("light");
  });

  it("applies dark class only on admin routes", () => {
    setAdminTheme("dark");
    applyAdminDocumentTheme(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    applyAdminDocumentTheme(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("admin-theme-dark")).toBe(true);
  });

  it("reveals the new theme from the toggle instead of swapping at once", async () => {
    const finished = Promise.resolve();
    document.startViewTransition = vi.fn((update) => {
      update();
      return { finished };
    });

    transitionAdminTheme(() => setAdminTheme("dark"), { x: 120, y: 24 });

    expect(document.startViewTransition).toHaveBeenCalledTimes(1);
    expect(document.documentElement.classList.contains("admin-theme-dark")).toBe(true);
    expect(document.documentElement.classList.contains("admin-theme-vt")).toBe(true);
    expect(document.documentElement.style.getPropertyValue("--admin-theme-x")).toBe("120px");
    expect(document.documentElement.style.getPropertyValue("--admin-theme-y")).toBe("24px");
    expect(document.documentElement.style.getPropertyValue("--admin-theme-r")).not.toBe("");

    await finished;
    expect(document.documentElement.classList.contains("admin-theme-vt")).toBe(false);
  });

  it("fades colors when the browser cannot reveal the theme", () => {
    vi.useFakeTimers();

    transitionAdminTheme(() => setAdminTheme("dark"));

    expect(document.documentElement.classList.contains("admin-theme-dark")).toBe(true);
    expect(document.documentElement.classList.contains("admin-theme-animating")).toBe(true);

    vi.advanceTimersByTime(800);
    expect(document.documentElement.classList.contains("admin-theme-animating")).toBe(false);
  });

  it("skips the reveal when reduced motion is preferred", () => {
    const original = window.matchMedia;
    window.matchMedia = vi.fn(() => ({ matches: true }));
    document.startViewTransition = vi.fn();

    transitionAdminTheme(() => setAdminTheme("dark"), { x: 10, y: 10 });

    expect(document.startViewTransition).not.toHaveBeenCalled();
    expect(document.documentElement.classList.contains("admin-theme-dark")).toBe(true);
    expect(document.documentElement.classList.contains("admin-theme-vt")).toBe(false);
    window.matchMedia = original;
  });
});
