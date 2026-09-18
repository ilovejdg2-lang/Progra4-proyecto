import { afterEach, describe, expect, it } from "vitest";

import {
  ADMIN_THEME_STORAGE_KEY,
  applyAdminDocumentTheme,
  readAdminTheme,
  setAdminTheme,
} from "./adminTheme";

describe("adminTheme", () => {
  afterEach(() => {
    window.localStorage.removeItem(ADMIN_THEME_STORAGE_KEY);
    document.documentElement.classList.remove("dark", "admin-theme-dark");
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
});
