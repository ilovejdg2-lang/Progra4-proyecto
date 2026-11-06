import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAdminPaginacion } from "./useAdminPaginacion";

const lista = (n, desde = 1) => Array.from({ length: n }, (_, i) => ({ id: desde + i }));

describe("useAdminPaginacion", () => {
  it("keeps the page when the caller passes a new array with the same content", () => {
    const { result, rerender } = renderHook(({ items }) => useAdminPaginacion(items, 10), {
      initialProps: { items: lista(35) },
    });
    act(() => result.current.setPage(3));
    rerender({ items: lista(35) });
    expect(result.current.page).toBe(3);
  });

  it("resets to page 1 when the list content changes", () => {
    const { result, rerender } = renderHook(({ items }) => useAdminPaginacion(items, 10), {
      initialProps: { items: lista(35) },
    });
    act(() => result.current.setPage(3));
    rerender({ items: lista(35, 100) });
    expect(result.current.page).toBe(1);
  });

  it("resets to page 1 when the page size changes", () => {
    const items = lista(35);
    const { result, rerender } = renderHook(({ size }) => useAdminPaginacion(items, size), {
      initialProps: { size: 10 },
    });
    act(() => result.current.setPage(3));
    rerender({ size: 5 });
    expect(result.current.page).toBe(1);
  });

  it("clamps the page when the list shrinks without changing first/last identity", () => {
    const { result, rerender } = renderHook(({ items }) => useAdminPaginacion(items, 10), {
      initialProps: { items: lista(35) },
    });
    act(() => result.current.setPage(4));
    rerender({ items: lista(12) });
    expect(result.current.page).toBe(1);
    expect(result.current.pageItems).toHaveLength(10);
  });

  it("clamps an out-of-range setPage to the last page", () => {
    const { result } = renderHook(() => useAdminPaginacion(lista(25), 10));
    act(() => result.current.setPage(9));
    expect(result.current.page).toBe(3);
    expect(result.current.pageItems).toHaveLength(5);
  });
});
