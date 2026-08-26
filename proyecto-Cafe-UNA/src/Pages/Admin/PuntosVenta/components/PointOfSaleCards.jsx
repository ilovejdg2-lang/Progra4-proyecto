import { MapPin, Pencil, Power, Store } from "lucide-react";

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
    <section aria-labelledby="puntos-venta-heading" className="grid gap-3 md:grid-cols-3">
      <h2 id="puntos-venta-heading" className="sr-only">Puntos de venta disponibles</h2>
      {locations.map((location) => {
        const selected = location.code === selectedCode;
        const activo = location.activo !== false;
        const toggling = togglingCode === location.code;
        return (
          <article
            key={location.code}
            className={`group !rounded-2xl border p-4 text-left transition ${
              selected
                ? "border-slate-950 bg-slate-950 text-white shadow-md"
                : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(location.code)}
              className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <span className="flex items-start justify-between gap-3">
                <span className={`flex size-10 items-center justify-center rounded-xl ${selected ? "bg-white/15" : "bg-slate-100 text-slate-800"}`}>
                  <Store className="size-5" aria-hidden="true" />
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    selected
                      ? activo
                        ? "bg-white/15 text-slate-50"
                        : "bg-white/10 text-slate-200"
                      : activo
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {activo ? "Activo" : "Inactivo"}
                </span>
              </span>
              <span className="mt-4 block text-base font-semibold">{location.name}</span>
              <span className={`mt-1 flex items-center gap-1 text-xs ${selected ? "text-slate-200" : "text-slate-500"}`}>
                <MapPin className="size-3.5" aria-hidden="true" />
                {location.code}
              </span>
              <span className={`mt-4 block text-xs font-medium ${selected ? "text-slate-200" : "text-slate-600"}`}>
                {selected ? "Ubicación seleccionada" : activo ? "Ver inventario" : "Punto inactivo"}
              </span>
            </button>
            {canManage ? (
              <div className={`mt-4 flex flex-wrap gap-1 border-t pt-3 ${selected ? "border-white/15" : "border-slate-100"}`}>
                <button
                  type="button"
                  onClick={() => onEdit?.(location)}
                  className={`inline-flex h-7 items-center justify-center gap-1 rounded-full border px-2 text-[11px] font-semibold leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                    selected
                      ? "border-white bg-white text-slate-950 hover:bg-slate-100 focus-visible:ring-white"
                      : "border-slate-950 bg-slate-950 text-white hover:border-neutral-700 hover:bg-neutral-700 focus-visible:ring-slate-400"
                  }`}
                >
                  <Pencil className="size-3 shrink-0" aria-hidden="true" />
                  <span>Editar</span>
                </button>
                <button
                  type="button"
                  disabled={toggling}
                  onClick={() => onToggleActivo?.(location)}
                  className={`inline-flex h-7 items-center justify-center gap-1 rounded-full border px-2 text-[11px] font-semibold leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
                    selected
                      ? activo
                        ? "border-rose-300/80 bg-rose-500/20 text-rose-100 hover:bg-rose-500/30 focus-visible:ring-rose-300"
                        : "border-emerald-300/80 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30 focus-visible:ring-emerald-300"
                      : activo
                        ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-300"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-300"
                  }`}
                >
                  <Power className="size-3 shrink-0" aria-hidden="true" />
                  <span>{toggling ? "..." : activo ? "Inactivar" : "Activar"}</span>
                </button>
              </div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
