import { Link } from "@tanstack/react-router";
import { History, MapPin, Pencil, Power, Store } from "lucide-react";

import { ST } from "../../../../Components/T/ST";

export function PointOfSaleCards({
  locations,
  selectedCode,
  onSelect,
  canManage = false,
  onEdit,
  onToggleActivo,
  togglingCode = "",
}) {
  return (
    <section aria-labelledby="puntos-venta-heading" className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <h2 id="puntos-venta-heading" className="sr-only"><ST>Puntos de venta disponibles</ST></h2>
      {locations.map((location) => {
        const selected = location.code === selectedCode;
        const activo = location.activo !== false;
        const toggling = togglingCode === location.code;
        return (
          <article
            key={location.code}
            className={`group min-w-0 !rounded-2xl border p-4 text-left transition ${
              selected ? "admin-role-selected" : "admin-role-surface"
            }`}
          >
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(location.code)}
              className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-focus-ring)]"
            >
              <span className="flex items-start justify-between gap-3">
                <span className={`flex size-10 items-center justify-center rounded-xl bg-[var(--admin-surface-hover)] text-[color:var(--admin-accent-coffee)]`}>
                  <Store className="size-5" aria-hidden="true" />
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    activo
                      ? "admin-status-success"
                      : "admin-status-neutral"
                  }`}
                >
                  {activo ? <ST>Activo</ST> : <ST>Inactivo</ST>}
                </span>
              </span>
              <span className="mt-4 block break-words text-base font-semibold"><ST>{location.name}</ST></span>
              <span className={`mt-1 flex min-w-0 items-center gap-1 text-xs text-[color:var(--admin-text-muted)]`}>
                <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-all">{location.code}</span>
              </span>
              <span className={`mt-4 block text-xs font-medium ${selected ? "text-[color:var(--admin-text-primary)]" : "text-[color:var(--admin-text-muted)]"}`}>
                {selected ? <ST>Ubicación seleccionada</ST> : activo ? <ST>Ver inventario</ST> : <ST>Punto inactivo</ST>}
              </span>
            </button>
            <Link
              to="/admin/puntos-venta/$locationCode/ventas"
              params={{ locationCode: location.code }}
              className={`mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border px-3 text-sm font-semibold no-underline admin-role-quiet`}
            >
              <History className="size-4 shrink-0" aria-hidden="true" />
              <ST>Historial de ventas</ST>
            </Link>
            {canManage ? (
              <div className={`mt-3 grid grid-cols-2 gap-2 border-t border-[var(--admin-border)] pt-3`}>
                <button
                  type="button"
                  onClick={() => onEdit?.(location)}
                  className={`inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full border px-3 text-sm font-semibold leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 admin-role-quiet`}
                >
                  <Pencil className="size-4 shrink-0" aria-hidden="true" />
                  <span><ST>Editar</ST></span>
                </button>
                <button
                  type="button"
                  disabled={toggling}
                  onClick={() => onToggleActivo?.(location)}
                  className={`inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full border px-3 text-sm font-semibold leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${activo ? "admin-role-danger" : "admin-role-positive"}`}
                >
                  <Power className="size-4 shrink-0" aria-hidden="true" />
                  <span>{toggling ? "..." : activo ? <ST>Inactivar</ST> : <ST>Activar</ST>}</span>
                </button>
              </div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
