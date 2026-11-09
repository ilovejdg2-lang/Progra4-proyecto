import { PackageOpen, Pencil, Power, PowerOff } from "lucide-react";

import { AdminOverflowMenu } from "../../../../Components/Admin/ui/AdminOverflowMenu";
import { ST } from "../../../../Components/T/ST";
import { useTraducir } from "../../../../hooks/useTraducir";

/**
 * Per-row actions. `compact` (small containers) folds "Ajustar stock" into the overflow menu so a
 * row never shows more than the star and the menu. Destructive text lives only inside the menu.
 */
export function ProductRowActions({
  producto,
  puedeEditar,
  puedeInactivar,
  puedeActualizarStock,
  compact = false,
  onEditar,
  onEditarStock,
  onToggleEstado,
}) {
  const tMenu = useTraducir("Más acciones de");
  const tAjustar = useTraducir("Ajustar stock de");
  const tAjustarCorto = useTraducir("Ajustar stock");
  const deshabilitado = producto.estado === "Deshabilitado";
  const bloquearInactivar = Boolean(producto.esDestacado) && !deshabilitado;
  const stockEnLinea = puedeActualizarStock && !compact;

  const items = [];
  if (compact && puedeActualizarStock) {
    items.push({ key: "stock", label: "Ajustar stock", icon: PackageOpen, onSelect: () => onEditarStock(producto) });
  }
  if (puedeEditar) {
    items.push({ key: "edit", label: "Editar", icon: Pencil, onSelect: () => onEditar(producto) });
  }
  if (puedeInactivar) {
    items.push(
      deshabilitado
        ? { key: "toggle", label: "Activar", icon: Power, onSelect: () => onToggleEstado(producto) }
        : {
            key: "toggle",
            label: "Desactivar",
            icon: PowerOff,
            tone: "danger",
            disabled: bloquearInactivar,
            hint: bloquearInactivar ? "Quita el destacado antes de desactivarlo" : undefined,
            onSelect: () => onToggleEstado(producto),
          },
    );
  }

  return (
    <div className="flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}>
      {stockEnLinea ? (
        <button
          type="button"
          onClick={() => onEditarStock(producto)}
          aria-label={`${tAjustar} ${producto.nombre}`}
          title={tAjustarCorto}
          className="inline-flex min-h-[var(--control-height)] min-w-[var(--control-height)] shrink-0 items-center justify-center gap-2 rounded-full! px-3 text-[length:var(--text-body)] font-semibold text-[color:var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-surface-hover)] hover:text-[color:var(--admin-text-primary)] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[color:var(--admin-focus-ring)]"
        >
          <PackageOpen className="size-4 shrink-0" aria-hidden="true" />
          <span className="hidden @4xl:inline"><ST>Ajustar stock</ST></span>
        </button>
      ) : null}
      {items.length > 0 ? <AdminOverflowMenu label={`${tMenu} ${producto.nombre}`} items={items} /> : null}
    </div>
  );
}
