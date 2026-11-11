import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ADMIN_WINDOW_NAME,
  SITE_WINDOW_NAME,
  adminPanelHref,
  claimWindowRole,
  leaveAdminTabToSiteHome,
  openOrFocusAdminPanel,
  openOrFocusSiteHome,
  siteHomeHref,
} from "./siteWindows";

describe("siteWindows", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.name = "";
  });

  it("claimWindowRole asigna el nombre de pestaña", () => {
    claimWindowRole("site");
    expect(window.name).toBe(SITE_WINDOW_NAME);
    claimWindowRole("admin");
    expect(window.name).toBe(ADMIN_WINDOW_NAME);
  });

  it("siteHomeHref y adminPanelHref usan el origen actual", () => {
    expect(siteHomeHref()).toBe(`${window.location.origin}/`);
    expect(adminPanelHref("/admin")).toBe(`${window.location.origin}/admin`);
  });

  it("openOrFocusSiteHome abre con el nombre del sitio", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    openOrFocusSiteHome();
    expect(open).toHaveBeenCalledWith(`${window.location.origin}/`, SITE_WINDOW_NAME);
  });

  it("openOrFocusAdminPanel marca el sitio y abre el admin nombrado", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    openOrFocusAdminPanel("/admin");
    expect(window.name).toBe(SITE_WINDOW_NAME);
    expect(open).toHaveBeenCalledWith(`${window.location.origin}/admin`, ADMIN_WINDOW_NAME);
  });

  it("leaveAdminTabToSiteHome enfoca inicio, cierra y si sigue abierta navega in-place", () => {
    vi.useFakeTimers();
    const open = vi.spyOn(window, "open").mockReturnValue({});
    const close = vi.spyOn(window, "close").mockImplementation(() => {});
    const goHomeInPlace = vi.fn();
    const navigate = vi.fn();

    leaveAdminTabToSiteHome({ navigate, pathname: "/admin", goHomeInPlace });

    expect(window.name).toBe(ADMIN_WINDOW_NAME);
    expect(open).toHaveBeenCalledWith(`${window.location.origin}/`, SITE_WINDOW_NAME);
    expect(close).toHaveBeenCalled();

    vi.runAllTimers();
    expect(goHomeInPlace).toHaveBeenCalledWith(navigate, "/admin");
    vi.useRealTimers();
  });
});
