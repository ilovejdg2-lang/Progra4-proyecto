import { afterEach, describe, expect, it, vi } from "vitest";
import { nuevoUid } from "./clientUid";

describe("nuevoUid", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns distinct non-empty ids", () => {
    const ids = new Set(Array.from({ length: 50 }, nuevoUid));
    expect(ids.size).toBe(50);
    expect([...ids].every((id) => typeof id === "string" && id.length > 0)).toBe(true);
  });

  it("still works where crypto.randomUUID is unavailable (insecure context)", () => {
    vi.stubGlobal("crypto", {});
    const ids = new Set(Array.from({ length: 50 }, nuevoUid));
    expect(ids.size).toBe(50);
  });
});
