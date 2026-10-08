import { useEffect, useState } from "react";
import { listarCatalogo } from "../services/catalogosService";

/** Nombres de un catálogo de Ajustes; usa `respaldo` mientras carga o si la API falla. */
export function useCatalogo(tipo, respaldo = []) {
  const [nombres, setNombres] = useState(null);

  useEffect(() => {
    let activo = true;
    listarCatalogo(tipo)
      .then((items) => {
        if (activo) setNombres(items.map((item) => item.nombre));
      })
      .catch(() => {
        if (activo) setNombres(null);
      });
    return () => {
      activo = false;
    };
  }, [tipo]);

  return nombres && nombres.length ? nombres : respaldo;
}
