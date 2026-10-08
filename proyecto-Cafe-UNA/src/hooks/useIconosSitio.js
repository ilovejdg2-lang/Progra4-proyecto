import { useCallback, useEffect, useState } from "react";

import { iconoPorClave } from "../lib/iconosCatalogo";
import { iconoOriginalSitio } from "../lib/iconosSitio";
import { listarCatalogo, TIPOS_CATALOGO } from "../services/catalogosService";

let ultimosElegidos = new Map();
const suscriptores = new Set();

function guardarElegidos(items) {
  ultimosElegidos = new Map(items.map((item) => [item.nombre, item.icono]));
  suscriptores.forEach((avisar) => avisar(ultimosElegidos));
}

/** Vuelve a leer los íconos del sitio (después de editarlos en el admin). */
export function recargarIconosSitio() {
  return listarCatalogo(TIPOS_CATALOGO.iconoSitio, { forzar: true }).then((items) => {
    guardarElegidos(items);
    return items;
  });
}

/** Devuelve `(id) => Componente` con el ícono elegido en el admin o el original. */
export function useIconosSitio() {
  const [elegidos, setElegidos] = useState(ultimosElegidos);

  useEffect(() => {
    suscriptores.add(setElegidos);
    listarCatalogo(TIPOS_CATALOGO.iconoSitio)
      .then(guardarElegidos)
      .catch(() => {});
    return () => {
      suscriptores.delete(setElegidos);
    };
  }, []);

  return useCallback(
    (id) => iconoPorClave(elegidos.get(id)) || iconoOriginalSitio(id),
    [elegidos],
  );
}
