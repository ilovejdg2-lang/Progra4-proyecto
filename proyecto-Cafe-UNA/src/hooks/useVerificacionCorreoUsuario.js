import { useState } from "react";

/**
 * Email verification state for the user form. Resets when the edited user (by id)
 * or the "email changed" status changes; a new `inicial` object for the same user
 * (e.g. after toggling a vendor assignment) keeps the verification.
 */
export function useVerificacionCorreoUsuario(inicial, correoCambio) {
  const editando = Boolean(inicial);
  const id = inicial?.id ?? null;
  const [correoVerificado, setCorreoVerificado] = useState(editando);
  const [passwordCorreoUsuario, setPasswordCorreoUsuario] = useState("");
  const [errorPasswordCorreo, setErrorPasswordCorreo] = useState("");
  const [previo, setPrevio] = useState({ correoCambio, editando, id });

  if (previo.correoCambio !== correoCambio || previo.editando !== editando || previo.id !== id) {
    setPrevio({ correoCambio, editando, id });
    setCorreoVerificado(editando && !correoCambio);
    if (editando && !correoCambio) {
      setPasswordCorreoUsuario("");
      setErrorPasswordCorreo("");
    }
  }

  return {
    correoVerificado,
    setCorreoVerificado,
    passwordCorreoUsuario,
    setPasswordCorreoUsuario,
    errorPasswordCorreo,
    setErrorPasswordCorreo,
  };
}
