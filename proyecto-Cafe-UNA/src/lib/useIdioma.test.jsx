import { StrictMode } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { guardarIdioma } from "./idioma";
import { useIdioma } from "./useIdioma";

describe("useIdioma", () => {
  afterEach(() => localStorage.clear());

  it("reads the stored language and follows changes made through guardarIdioma", () => {
    const { result } = renderHook(() => useIdioma(), { wrapper: StrictMode });
    expect(result.current.idioma).toBe("es");
    expect(result.current.esEn).toBe(false);

    act(() => {
      guardarIdioma("en");
    });
    expect(result.current.idioma).toBe("en");
    expect(result.current.esEn).toBe(true);

    act(() => {
      result.current.setIdioma("es");
    });
    expect(result.current.idioma).toBe("es");
  });
});
