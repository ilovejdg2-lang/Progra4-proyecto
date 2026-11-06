import { describe, expect, it } from "vitest";

import {
  esImagenSubidaProducto,
  MAX_IMAGEN_PRODUCTO_BYTES,
  parsearImagenesProducto,
  validarArchivoImagenProducto,
} from "./productoImagenes";

describe("parsearImagenesProducto", () => {
  it("removes duplicated URLs keeping the first occurrence order", () => {
    expect(parsearImagenesProducto({ imagenes: ["a.jpg", "b.jpg", "a.jpg"] })).toEqual([
      "a.jpg",
      "b.jpg",
    ]);
    expect(parsearImagenesProducto({ imagen: "a.jpg\nb.jpg\na.jpg" })).toEqual(["a.jpg", "b.jpg"]);
    expect(parsearImagenesProducto({ imagen: '["a.jpg","a.jpg","b.jpg"]' })).toEqual([
      "a.jpg",
      "b.jpg",
    ]);
  });
});

describe("validarArchivoImagenProducto", () => {
  it("accepts jpg/png/webp within the size limit", () => {
    expect(
      validarArchivoImagenProducto(new File(["cafe"], "cafe.png", { type: "image/png" })),
    ).toBeNull();
  });

  it("rejects unsupported types", () => {
    expect(
      validarArchivoImagenProducto(new File(["cafe"], "cafe.pdf", { type: "application/pdf" })),
    ).toBe("La imagen debe ser JPG, PNG o WEBP.");
  });

  it("detects uploaded product image paths", () => {
    expect(esImagenSubidaProducto("/api/productos/imagenes/producto-1.jpg")).toBe(true);
    expect(esImagenSubidaProducto("/api/inventario/ubicaciones/imagenes/punto-1.jpg")).toBe(true);
    expect(esImagenSubidaProducto("https://img.example/1.jpg")).toBe(false);
  });

  it("rejects files larger than 10 MB", () => {
    const file = new File([new Uint8Array(MAX_IMAGEN_PRODUCTO_BYTES + 1)], "cafe.png", {
      type: "image/png",
    });
    expect(validarArchivoImagenProducto(file)).toBe("La imagen debe pesar máximo 10 MB.");
  });
});
