import { describe, expect, it } from "vitest";

import { aplicarDeltaCarrito } from "./carritoVenta";

const item = { productoId: 7, productoNombre: "Café", precioUnitario: 1000, cantidad: 1, subtotal: 1000, stockDisponible: 5 };
const stock = new Map([["7", 5]]);

describe("aplicarDeltaCarrito", () => {
  it("compounds when chained, as two updater calls in one tick do", () => {
    const una = aplicarDeltaCarrito([item], "7", 1, stock).carrito;
    const dos = aplicarDeltaCarrito(una, "7", 1, stock).carrito;
    expect(dos[0]).toMatchObject({ cantidad: 3, subtotal: 3000 });
  });

  it("matches ids across String and Number", () => {
    expect(aplicarDeltaCarrito([item], 7, 1, stock).carrito[0].cantidad).toBe(2);
  });

  it("keeps the item and reports an error above available stock", () => {
    const r = aplicarDeltaCarrito([{ ...item, cantidad: 5 }], "7", 1, stock);
    expect(r.carrito[0].cantidad).toBe(5);
    expect(r.error).toContain("Stock máximo alcanzado");
  });

  it("removes the item when quantity reaches zero", () => {
    const r = aplicarDeltaCarrito([item], "7", -1, stock);
    expect(r.carrito).toEqual([]);
    expect(r.error).toBe("");
  });
});
