export const ESTILOS_INICIATIVA = {
  donaciones: {
    accentColor: "#a7532d",
    accentBg: "#fff6f0",
    borderColor: "#efc4ad",
  },
  visitas: {
    accentColor: "#286f54",
    accentBg: "#f0fbf6",
    borderColor: "#a9dec8",
  },
  voluntariado: {
    accentColor: "#67521d",
    accentBg: "#fff9eb",
    borderColor: "#dfc98d",
  },
};

export const ICONOS_INICIATIVA = {
  donaciones: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  visitas: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  voluntariado: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

export function buildIniciativasCards(tarjetas = []) {
  return tarjetas.map((tarjeta) => {
    const clave = (tarjeta.clave || "").toLowerCase();
    const estilo = ESTILOS_INICIATIVA[clave] || {};

    return {
      id: clave || tarjeta.clave,
      etiqueta: tarjeta.etiqueta,
      titulo: tarjeta.titulo,
      descripcion: tarjeta.descripcion,
      ruta: tarjeta.ruta || "",
      textoBoton: tarjeta.textoBoton || "",
      icono: ICONOS_INICIATIVA[clave] ?? null,
      accentColor: estilo.accentColor,
      accentBg: estilo.accentBg,
      borderColor: estilo.borderColor,
    };
  });
}
