import { createElement } from "react";

import { useIconosSitio } from "../../hooks/useIconosSitio";

/** Ícono fijo del sitio que se puede cambiar en Ajustes → Catálogos → Íconos. */
export function IconoSitio({ lugar, ...props }) {
  const iconoDe = useIconosSitio();
  return createElement(iconoDe(lugar), { "aria-hidden": true, ...props });
}
