import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useVerificacionCorreoUsuario } from "./useVerificacionCorreoUsuario";

const render = (inicial, correoCambio = false) =>
  renderHook((props) => useVerificacionCorreoUsuario(props.inicial, props.correoCambio), {
    initialProps: { inicial, correoCambio },
  });

describe("useVerificacionCorreoUsuario", () => {
  it("starts verified in edit mode and unverified in create mode", () => {
    expect(render({ id: 1 }).result.current.correoVerificado).toBe(true);
    expect(render(null).result.current.correoVerificado).toBe(false);
  });

  it("marks the email unverified when it changes and clears the password when it reverts", () => {
    const { result, rerender } = render({ id: 1 });
    act(() => result.current.setPasswordCorreoUsuario("secret"));

    rerender({ inicial: { id: 1 }, correoCambio: true });
    expect(result.current.correoVerificado).toBe(false);
    expect(result.current.passwordCorreoUsuario).toBe("secret");

    rerender({ inicial: { id: 1 }, correoCambio: false });
    expect(result.current.correoVerificado).toBe(true);
    expect(result.current.passwordCorreoUsuario).toBe("");
  });

  it("keeps verification and password when inicial is a new object with the same id", () => {
    const { result, rerender } = render({ id: 1, asignaciones: [] }, true);
    act(() => {
      result.current.setCorreoVerificado(true);
      result.current.setPasswordCorreoUsuario("secret");
    });

    rerender({ inicial: { id: 1, asignaciones: [{ x: 1 }] }, correoCambio: true });

    expect(result.current.correoVerificado).toBe(true);
    expect(result.current.passwordCorreoUsuario).toBe("secret");
  });

  it("resets when a different user is edited", () => {
    const { result, rerender } = render({ id: 1 }, true);
    act(() => {
      result.current.setCorreoVerificado(true);
      result.current.setPasswordCorreoUsuario("secret");
    });

    rerender({ inicial: { id: 2 }, correoCambio: false });

    expect(result.current.correoVerificado).toBe(true);
    expect(result.current.passwordCorreoUsuario).toBe("");
    rerender({ inicial: { id: 3 }, correoCambio: true });
    expect(result.current.correoVerificado).toBe(false);
  });

  it("resets password state when only the user id changes", () => {
    const { result, rerender } = render({ id: 1 }, false);
    act(() => result.current.setPasswordCorreoUsuario("secret"));

    rerender({ inicial: { id: 2 }, correoCambio: false });

    expect(result.current.passwordCorreoUsuario).toBe("");
  });
});
