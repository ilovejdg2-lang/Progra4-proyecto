export const LIMITE_IDENTIFICACION = { cedula: 9, dimex: 12, pasaporte: 20 };

export const TIPOS_IDENTIFICACION = [
  { value: "cedula", label: "Cédula" },
  { value: "dimex", label: "DIMEX" },
  { value: "pasaporte", label: "Pasaporte" },
];

/** Filtra lo que se escribe según el tipo: dígitos para cédula/DIMEX, alfanumérico para pasaporte. */
export function limpiarIdentificacion(tipo, valor) {
  const texto = String(valor ?? "");
  if (tipo === "pasaporte") {
    return texto.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, LIMITE_IDENTIFICACION.pasaporte);
  }
  const max = tipo === "dimex" ? LIMITE_IDENTIFICACION.dimex : LIMITE_IDENTIFICACION.cedula;
  return texto.replace(/\D/g, "").slice(0, max);
}

/** Dígitos consultables en el padrón: cédula (9) o DIMEX (11-12); vacío si no aplica. */
export function digitosConsultables(tipo, valor) {
  const digitos = String(valor ?? "").replace(/\D/g, "");
  if (tipo === "cedula") return digitos.length === 9 ? digitos : "";
  if (tipo === "dimex") return /^\d{11,12}$/.test(digitos) ? digitos : "";
  return "";
}

/** DIMEX admite 11 o 12 dígitos: se espera más para no consultar a medio escribir. */
export function esperaConsultaIdentificacion(tipo) {
  return tipo === "dimex" ? 800 : 350;
}

export function placeholderIdentificacion(tipo) {
  if (tipo === "dimex") return "11 o 12 dígitos";
  if (tipo === "pasaporte") return "Letras y números";
  return "9 dígitos";
}

export function etiquetaIdentificacion(tipo) {
  return TIPOS_IDENTIFICACION.find((item) => item.value === tipo)?.label ?? "Identificación";
}

/** Mensaje de error o "" si es válida. */
export function validarIdentificacion(tipo, valor) {
  const texto = String(valor ?? "").trim();
  if (tipo === "cedula") {
    if (!texto) return "La cédula es obligatoria.";
    return /^\d{9}$/.test(texto) ? "" : "La cédula costarricense debe tener 9 dígitos.";
  }
  if (tipo === "dimex") {
    if (!texto) return "El DIMEX es obligatorio.";
    return /^\d{11,12}$/.test(texto) ? "" : "El DIMEX debe tener 11 o 12 dígitos.";
  }
  if (tipo === "pasaporte") {
    if (!texto) return "El pasaporte es obligatorio.";
    return /^[A-Za-z0-9]{5,20}$/.test(texto) ? "" : "El pasaporte debe tener entre 5 y 20 letras o números.";
  }
  return "Elegí el tipo de identificación.";
}
