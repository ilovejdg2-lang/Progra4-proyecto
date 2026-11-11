import { afterEach, describe, expect, it } from "vitest";
import { guardarIdioma, obtenerIdioma } from "./idioma";
import {
  invalidateAllPageCaches,
  readPageCache,
  writePageCache,
} from "./pageDataCache";

describe("guardarIdioma", () => {
  afterEach(() => {
    localStorage.clear();
    invalidateAllPageCaches();
  });

  it("persists the language without wiping page caches", () => {
    writePageCache("home", { titulo: "Café UNA" });
    expect(readPageCache("home")).toEqual({ titulo: "Café UNA" });

    expect(guardarIdioma("en")).toBe("en");
    expect(obtenerIdioma()).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    expect(readPageCache("home")).toEqual({ titulo: "Café UNA" });

    expect(guardarIdioma("es")).toBe("es");
    expect(document.documentElement.lang).toBe("es-CR");
    expect(readPageCache("home")).toEqual({ titulo: "Café UNA" });
  });
});
