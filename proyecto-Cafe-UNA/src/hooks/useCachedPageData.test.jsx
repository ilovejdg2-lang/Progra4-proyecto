import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { guardarIdioma, IDIOMA_CHANGED_EVENT } from "../lib/idioma";
import {
  invalidateAllPageCaches,
  writePageCache,
} from "../lib/pageDataCache";
import { useCachedPageData } from "./useCachedPageData";

describe("useCachedPageData", () => {
  afterEach(() => {
    localStorage.clear();
    invalidateAllPageCaches();
    vi.restoreAllMocks();
  });

  it("does not refetch when the language changes", async () => {
    writePageCache("home-test", { ok: true });
    const fetcher = vi.fn().mockResolvedValue({ ok: true, fresh: 1 });

    const { result } = renderHook(() => useCachedPageData("home-test", fetcher));

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });

    const callsAfterMount = fetcher.mock.calls.length;

    act(() => {
      guardarIdioma("en");
      window.dispatchEvent(
        new CustomEvent(IDIOMA_CHANGED_EVENT, { detail: { idioma: "en" } }),
      );
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetcher.mock.calls.length).toBe(callsAfterMount);
    expect(result.current.status).toBe("ready");
    expect(result.current.error).toBe("");
  });
});
