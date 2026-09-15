import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  clearSession: vi.fn(),
  getActiveSessionUser: vi.fn(),
  getStoredUser: vi.fn(),
  isLoggingOut: vi.fn(),
  touchSession: vi.fn(),
  updateSessionUser: vi.fn(),
}));

vi.mock("axios", () => ({ default: vi.fn() }));
vi.mock("../lib/jwt", () => ({ getTokenExpirationMs: () => null }));
vi.mock("../lib/formLimits", () => ({ sanitizeUserFacingError: (message) => message }));
vi.mock("./sessionService", () => ({
  clearSession: (...args) => mocks.clearSession(...args),
  getActiveSessionUser: (...args) => mocks.getActiveSessionUser(...args),
  getStoredUser: (...args) => mocks.getStoredUser(...args),
  isLoggingOut: (...args) => mocks.isLoggingOut(...args),
  touchSession: (...args) => mocks.touchSession(...args),
  updateSessionUser: (...args) => mocks.updateSessionUser(...args),
}));

import axios from "axios";
import { apiRequest } from "./apiClient";

describe("apiRequest session invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getActiveSessionUser.mockReturnValue({ id: "account-a", token: "token-a" });
    mocks.getStoredUser.mockReturnValue({ id: "account-a", token: "token-a" });
    mocks.isLoggingOut.mockReturnValue(false);
  });

  it("does not clear a newer session after an old request receives 401", async () => {
    axios.mockRejectedValue({ response: { status: 401, data: { message: "Unauthorized" } } });
    mocks.getStoredUser.mockReturnValue({ id: "account-b", token: "token-b" });

    await expect(apiRequest("/compras/mias", { skipRefresh: true })).rejects.toThrow("Unauthorized");

    expect(mocks.clearSession).not.toHaveBeenCalled();
  });

  it("clears the session when the failed request token is still active", async () => {
    axios.mockRejectedValue({ response: { status: 401, data: { message: "Unauthorized" } } });

    await expect(apiRequest("/compras/mias", { skipRefresh: true })).rejects.toThrow("Su sesión expiró");

    expect(mocks.clearSession).toHaveBeenCalledTimes(1);
  });
});
