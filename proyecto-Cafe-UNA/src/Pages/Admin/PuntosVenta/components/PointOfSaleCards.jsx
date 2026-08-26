import { MapPin, Store } from "lucide-react";

export function PointOfSaleCards({ locations, selectedCode, onSelect }) {
  return (
    <section aria-labelledby="puntos-venta-heading" className="grid gap-3 md:grid-cols-3">
      <h2 id="puntos-venta-heading" className="sr-only">Puntos de venta disponibles</h2>
      {locations.map((location) => {
        const selected = location.code === selectedCode;
        return (
          <button
            key={location.code}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(location.code)}
            className={`group rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 ${
              selected
                ? "border-amber-800 bg-amber-900 text-white shadow-md"
                : "border-slate-200 bg-white text-slate-900 hover:border-amber-300 hover:bg-amber-50/50"
            }`}
          >
            <span className="flex items-start justify-between gap-3">
              <span className={`flex size-10 items-center justify-center rounded-xl ${selected ? "bg-white/15" : "bg-amber-50 text-amber-800"}`}>
                <Store className="size-5" aria-hidden="true" />
              </span>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${selected ? "bg-white/15 text-amber-50" : "bg-emerald-50 text-emerald-700"}`}>
                Activo
              </span>
            </span>
            <span className="mt-4 block text-base font-semibold">{location.name}</span>
            <span className={`mt-1 flex items-center gap-1 text-xs ${selected ? "text-amber-100" : "text-slate-500"}`}>
              <MapPin className="size-3.5" aria-hidden="true" />
              {location.code}
            </span>
            <span className={`mt-4 block text-xs font-medium ${selected ? "text-amber-100" : "text-amber-800"}`}>
              {selected ? "Ubicación seleccionada" : "Ver inventario"}
            </span>
          </button>
        );
      })}
    </section>
  );
}
