import { describe, expect, it } from "vitest";

import {
  esImagenSubidaProducto,
  MAX_IMAGEN_PRODUCTO_BYTES,
  validarArchivoImagenProducto,
} from "./productoImagenes";

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
    expect(esImagenSubidaProducto("https://img.example/1.jpg")).toBe(false);
  });

  it("rejects files larger than 10 MB", () => {
    const file = new File([new Uint8Array(MAX_IMAGEN_PRODUCTO_BYTES + 1)], "cafe.png", {
      type: "image/png",
    });
    expect(validarArchivoImagenProducto(file)).toBe("La imagen debe pesar máximo 10 MB.");
  });
});
