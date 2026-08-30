import { useEffect, useMemo, useRef, useState } from "react";

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
  const metaAnterior = useRef({ firma, pageSize });

  useEffect(() => {
    const prev = metaAnterior.current;
    if (prev.firma === firma && prev.pageSize === pageSize) return;
    metaAnterior.current = { firma, pageSize };
    setPage(1);
  }, [firma, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

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
