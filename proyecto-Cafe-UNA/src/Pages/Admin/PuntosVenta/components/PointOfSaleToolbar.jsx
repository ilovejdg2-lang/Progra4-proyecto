import { AdminFilterToolbar } from "../../../../Components/Admin/ui/AdminFilterToolbar";

/** Search plus category and status selects; the layout lives in the shared AdminFilterToolbar. */
export function PointOfSaleToolbar({
  busqueda,
  onBusquedaChange,
  categoria,
  onCategoriaChange,
  categorias,
  estado,
  onEstadoChange,
  hayFiltrosActivos,
  total,
  visibles,
  onLimpiar,
}) {
  return (
    <AdminFilterToolbar
      busqueda={busqueda}
      onBusquedaChange={onBusquedaChange}
      placeholder="Buscar producto..."
      searchLabel="Buscar producto"
      hayFiltrosActivos={hayFiltrosActivos}
      total={total}
      visibles={visibles}
      onLimpiar={onLimpiar}
      filtros={[
        {
          id: "categoria",
          ariaLabel: "Categoría",
          value: categoria,
          onChange: onCategoriaChange,
          widthClass: "@2xl:w-44",
          options: [{ value: "todos", label: "Todas las categorías" }, ...categorias.map((value) => ({ value, label: value }))],
        },
        {
          id: "estado",
          ariaLabel: "Estado",
          value: estado,
          onChange: onEstadoChange,
          widthClass: "@2xl:w-40",
          options: [
            { value: "todos", label: "Todos los estados" },
            { value: "Habilitado", label: "Habilitado" },
            { value: "Deshabilitado", label: "Deshabilitado" },
          ],
        },
      ]}
    />
  );
}
