import { describe, expect, it } from "vitest";
import {
  encontrarProductoPorSlug,
  slugDeProducto,
  slugifyProductoNombre,
} from "./productoSlug";

describe("productoSlug", () => {
  it("slugifies product names without accents or symbols", () => {
    expect(slugifyProductoNombre("Café molido tueste medio")).toBe(
      "cafe-molido-tueste-medio",
    );
    expect(slugifyProductoNombre("  CAFÉ • 250G  ")).toBe("cafe-250g");
  });

  it("keeps a plain name slug when it is unique in the catalog", () => {
    const catalogo = [
      { id: 4, nombre: "Café molido tueste medio" },
      { id: 5, nombre: "Café en grano" },
    ];
    expect(slugDeProducto(catalogo[0], catalogo)).toBe("cafe-molido-tueste-medio");
  });

  it("appends the id only when two products share the same slug", () => {
    const catalogo = [
      { id: 4, nombre: "Café especial" },
      { id: 9, nombre: "Cafe especial" },
    ];
    expect(slugDeProducto(catalogo[0], catalogo)).toBe("cafe-especial-4");
    expect(slugDeProducto(catalogo[1], catalogo)).toBe("cafe-especial-9");
  });

  it("resolves by slug or legacy numeric id", () => {
    const catalogo = [
      { id: 4, nombre: "Café molido tueste medio", estado: "Habilitado" },
      { id: 5, nombre: "Café en grano", estado: "Habilitado" },
    ];
    expect(encontrarProductoPorSlug(catalogo, "cafe-molido-tueste-medio")?.id).toBe(4);
    expect(encontrarProductoPorSlug(catalogo, "4")?.id).toBe(4);
    expect(encontrarProductoPorSlug(catalogo, "no-existe")).toBeNull();
  });
});
