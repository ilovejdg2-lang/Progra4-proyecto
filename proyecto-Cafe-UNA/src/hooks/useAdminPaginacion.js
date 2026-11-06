import { useMemo, useState } from "react";

export const ADMIN_PAGE_SIZE = 10;

/**
 * Firma estable del listado para no resetear la página en cada render
 * cuando el caller pasa un array nuevo con el mismo contenido.
 */
function firmaItems(items) {
  if (!Array.isArray(items) || items.length === 0) return "0";
  const primero = items[0];
  const ultimo = items[items.length - 1];
  const idDe = (item) =>
    item == null
      ? ""
      : typeof item === "object"
        ? String(item.id ?? item.Id ?? item.codigo ?? item.clave ?? item.numero ?? "")
        : String(item);
  return `${items.length}:${idDe(primero)}:${idDe(ultimo)}`;
}

export function useAdminPaginacion(items = [], pageSize = ADMIN_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const total = Array.isArray(items) ? items.length : 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firma = useMemo(() => firmaItems(items), [items]);
  const [meta, setMeta] = useState({ firma, pageSize });

  // Ajuste durante el render (sin efectos): evita un render intermedio con la
  // pagina anterior y que la correccion de rango pise el reinicio a la pagina 1.
  if (meta.firma !== firma || meta.pageSize !== pageSize) {
    setMeta({ firma, pageSize });
    setPage(1);
  } else if (page > totalPages) {
    setPage(totalPages);
  }

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return (items || []).slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return {
    page,
    setPage,
    pageItems,
    total,
    totalPages,
    showPagination: total > pageSize,
  };
}
