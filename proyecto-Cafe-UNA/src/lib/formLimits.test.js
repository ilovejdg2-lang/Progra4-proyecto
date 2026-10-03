import { describe, expect, it } from "vitest";
import { limitarPalabras } from "./formLimits";

describe("limitarPalabras", () => {
  it("conserva el espacio final mientras se escribe", () => {
    expect(limitarPalabras("María ", 15)).toBe("María ");
    expect(limitarPalabras("María Rodríguez", 15)).toBe("María Rodríguez");
  });

  it("recorta cuando se pasa del máximo", () => {
    expect(limitarPalabras("uno dos tres", 2)).toBe("uno dos");
    expect(limitarPalabras("uno dos ", 2)).toBe("uno dos ");
  });
});
