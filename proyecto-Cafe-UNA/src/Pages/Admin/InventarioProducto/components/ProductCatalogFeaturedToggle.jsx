import { Star } from "lucide-react";

export function ProductCatalogFeaturedToggle({ producto, disabled, onToggle, variant = "table" }) {
  const esMovil = variant === "mobile";

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        producto.esDestacado
          ? "bg-amber-50 text-amber-800 hover:bg-amber-100"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
      aria-pressed={producto.esDestacado}
    >
      <Star className={`size-3.5 ${producto.esDestacado ? "fill-current" : ""}`} aria-hidden="true" />
      {esMovil
        ? producto.esDestacado
          ? "Destacado en inicio"
          : "Marcar como destacado"
        : producto.esDestacado
          ? "Si"
          : "No"}
    </button>
  );
}
