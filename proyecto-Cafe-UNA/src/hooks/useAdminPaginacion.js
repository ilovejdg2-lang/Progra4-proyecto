import { useEffect, useMemo, useState } from "react";

export const ADMIN_PAGE_SIZE = 10;

export function useAdminPaginacion(items = [], pageSize = ADMIN_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const total = Array.isArray(items) ? items.length : 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPage(1);
  }, [items, pageSize]);

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
