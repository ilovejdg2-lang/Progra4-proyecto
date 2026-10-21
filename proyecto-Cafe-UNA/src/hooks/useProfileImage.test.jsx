import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useProfileImage } from "./useProfileImage";
import { beginLogout, clearSession, saveAuthenticatedUser, SESSION_UPDATED_EVENT } from "../services/sessionService";
import { obtenerImagenPerfil } from "../services/perfilService";

vi.mock("../services/perfilService", async (original) => ({ ...(await original()), obtenerImagenPerfil: vi.fn() }));

const path = "/api/perfil/imagenes/00000000-0000-4000-8000-000000000000.webp";
const nextPath = path.replace("000000000000.webp", "000000000001.webp");
const blob = new Blob(["image"], { type: "image/webp" });
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

describe("useProfileImage private lifecycle", () => {
  beforeEach(() => {
    clearSession();
    saveAuthenticatedUser({ id: 7, token: "local-test" });
    obtenerImagenPerfil.mockReset();
    URL.createObjectURL = vi.fn(() => "blob:private-image");
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => vi.useRealTimers());

  it("never exposes a raw private URL while loading or after failure", async () => {
    const pending = deferred();
    obtenerImagenPerfil.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useProfileImage(path));
    expect(result.current).toBe("");
    await act(async () => pending.reject(new Error("Unavailable")));
    expect(result.current).toBe("");
  });

  it("creates a private Blob URL and revokes it on unmount", async () => {
    obtenerImagenPerfil.mockResolvedValue(blob);
    const { result, unmount } = renderHook(() => useProfileImage(path));
    await waitFor(() => expect(result.current).toBe("blob:private-image"));
    expect(obtenerImagenPerfil).toHaveBeenCalledWith(path, expect.any(AbortSignal));
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:private-image");
  });

  it("revokes immediately when logout begins, before the session is removed", async () => {
    obtenerImagenPerfil.mockResolvedValue(blob);
    const { result } = renderHook(() => useProfileImage(path));
    await waitFor(() => expect(result.current).toBe("blob:private-image"));
    act(() => beginLogout());
    expect(result.current).toBe("");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:private-image");
    expect(localStorage.getItem("user")).not.toBeNull();
  });

  it("does not fetch for an absent session or a private-looking foreign origin", () => {
    clearSession();
    const { result, rerender } = renderHook(({ source }) => useProfileImage(source), { initialProps: { source: path } });
    expect(result.current).toBe("");
    rerender({ source: `https://evil.test${path}` });
    expect(result.current).toBe("");
    expect(obtenerImagenPerfil).not.toHaveBeenCalled();
  });

  it("keeps legacy external URLs without fetching authenticated blobs", () => {
    const { result } = renderHook(() => useProfileImage("https://example.test/manual.png"));
    expect(result.current).toBe("https://example.test/manual.png");
    expect(obtenerImagenPerfil).not.toHaveBeenCalled();
  });

  it("aborts replacement requests and ignores their stale completions", async () => {
    const first = deferred();
    const second = deferred();
    obtenerImagenPerfil.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result, rerender } = renderHook(({ source }) => useProfileImage(source), { initialProps: { source: path } });
    const firstSignal = obtenerImagenPerfil.mock.calls[0][1];
    rerender({ source: nextPath });
    expect(firstSignal.aborted).toBe(true);
    await act(async () => first.resolve(blob));
    expect(result.current).toBe("");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    await act(async () => second.resolve(blob));
    expect(result.current).toBe("blob:private-image");
  });

  it.each(["token", "user", "storage"])("revokes old images across %s changes", async (kind) => {
    obtenerImagenPerfil.mockResolvedValue(blob);
    const { result } = renderHook(() => useProfileImage(path));
    await waitFor(() => expect(result.current).toBe("blob:private-image"));
    act(() => {
      if (kind === "storage") { localStorage.removeItem("user"); window.dispatchEvent(new Event("storage")); }
      else saveAuthenticatedUser({ id: kind === "user" ? 8 : 7, token: "next-token" });
    });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:private-image");
    if (kind === "storage") expect(result.current).toBe("");
  });

  it("does not refetch on unrelated stable session notifications", async () => {
    obtenerImagenPerfil.mockResolvedValue(blob);
    renderHook(() => useProfileImage(path));
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledOnce());
    act(() => window.dispatchEvent(new Event(SESSION_UPDATED_EVENT)));
    expect(obtenerImagenPerfil).toHaveBeenCalledOnce();
  });

  it("revokes on the session expiry deadline without waiting for activity", async () => {
    vi.useFakeTimers();
    const user = JSON.parse(localStorage.getItem("user"));
    localStorage.setItem("user", JSON.stringify({ ...user, expiresAt: Date.now() + 100 }));
    obtenerImagenPerfil.mockResolvedValue(blob);
    const { result } = renderHook(() => useProfileImage(path));
    await act(async () => {});
    expect(result.current).toBe("blob:private-image");
    act(() => vi.advanceTimersByTime(101));
    expect(result.current).toBe("");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:private-image");
  });

  it("honors JWT expiry even when the stored session has more time remaining", async () => {
    vi.useFakeTimers();
    const token = `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 1 }))}.signature`;
    saveAuthenticatedUser({ id: 7, token });
    obtenerImagenPerfil.mockResolvedValue(blob);
    const { result } = renderHook(() => useProfileImage(path));
    await act(async () => {});
    expect(result.current).toBe("blob:private-image");
    act(() => vi.advanceTimersByTime(1001));
    expect(result.current).toBe("");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:private-image");
  });
});
