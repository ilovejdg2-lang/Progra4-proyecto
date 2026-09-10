/** Sede fija de visitas, voluntariado y entrega presencial de donaciones. */
export const SEDE_FINCA_NOMBRE = "Finca Experimental Santa Lucía";

/** Fallback si aún no hay link en homeLocation del CMS. */
export const SEDE_FINCA_MAPS_URL_FALLBACK =
  "https://www.google.com/maps/place/Finca+Experimental+Santa+Luc%C3%ADa+-+Universidad+Nacional/@10.0232398,-84.11705,17z/data=!4m14!1m7!3m6!1s0x8fa0faa5f69f073d:0x656b2da8f85723be!2sFinca+Experimental+Santa+Luc%C3%ADa+-+Universidad+Nacional!8m2!3d10.0232346!4d-84.1121791!16s%2Fg%2F1pp2tywc7!3m5!1s0x8fa0faa5f69f073d:0x656b2da8f85723be!8m2!3d10.0232346!4d-84.1121791!16s%2Fg%2F1pp2tywc7?entry=ttu";

/**
 * Preferí el link (y texto) de la sección homeLocation del CMS.
 * El nombre del lugar permanece fijo: Finca Experimental Santa Lucía.
 */
export function sedeDesdeHomeLocation(section) {
  const url = String(section?.linkUrl ?? section?.LinkUrl ?? "").trim();
  const linkText = String(section?.linkText ?? section?.LinkText ?? "").trim();
  return {
    nombre: SEDE_FINCA_NOMBRE,
    url: url || SEDE_FINCA_MAPS_URL_FALLBACK,
    linkText: linkText || "Ver en Google Maps",
  };
}
