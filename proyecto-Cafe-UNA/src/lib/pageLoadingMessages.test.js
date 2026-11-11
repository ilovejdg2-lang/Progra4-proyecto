import { beforeEach, describe, expect, it } from "vitest";

import {
  getLoadingMessageForCacheKey,
  getLoadingMessageForPathname,
} from "./pageLoadingMessages";

describe("pageLoadingMessages", () => {
  beforeEach(() => {
    localStorage.setItem("cafe-una-idioma", "es");
  });

  it("maps destination routes to their own loading copy", () => {
    expect(getLoadingMessageForPathname("/repositorio")).toMatch(/biblioteca digital/i);
    expect(getLoadingMessageForPathname("/AboutUs")).toMatch(/sobre nosotros/i);
    expect(getLoadingMessageForPathname("/AboutUs/historia")).toMatch(/historia/i);
    expect(getLoadingMessageForPathname("/AboutUs/galeria")).toMatch(/galería/i);
    expect(getLoadingMessageForPathname("/productos")).toMatch(/productos/i);
  });

  it("keeps cache-key messages aligned with the destination page", () => {
    expect(getLoadingMessageForCacheKey("repositorio")).toMatch(/biblioteca digital/i);
    expect(getLoadingMessageForCacheKey("about")).toMatch(/sobre nosotros/i);
    expect(getLoadingMessageForCacheKey("historia")).toMatch(/historia/i);
    expect(getLoadingMessageForCacheKey("admin:/admin/puntos-venta")).toMatch(/panel administrativo/i);
  });
});
