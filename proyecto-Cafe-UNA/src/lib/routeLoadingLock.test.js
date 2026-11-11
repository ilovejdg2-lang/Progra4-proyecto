import { beforeEach, describe, expect, it } from "vitest";

import { beginRouteLoading, endRouteLoading, getActiveRouteLoadingKey } from "./routeLoadingLock";

describe("routeLoadingLock messages", () => {
  beforeEach(() => {
    localStorage.setItem("cafe-una-idioma", "es");
    endRouteLoading(null);
    document.body.innerHTML = "";
    document.body.className = "";
    document.documentElement.className = "";
  });

  it("updates the boot loader text to the destination route, not the previous one", () => {
    beginRouteLoading("about", "site", "/AboutUs");
    expect(document.getElementById("site-boot-message")?.textContent).toMatch(/sobre nosotros/i);

    beginRouteLoading("repositorio", "site", "/repositorio");
    expect(getActiveRouteLoadingKey()).toBe("repositorio");
    expect(document.getElementById("site-boot-message")?.textContent).toMatch(/biblioteca digital/i);
  });
});
