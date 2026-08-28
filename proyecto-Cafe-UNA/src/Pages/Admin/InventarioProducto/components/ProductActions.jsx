import { PackageOpen, Pencil, Power } from "lucide-react";

const actionButtonBase =
  "inline-flex items-center justify-center gap-1 rounded-full border text-[length:var(--text-body)] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

export function ProductActions({
  producto,
  puedeEditar,
  puedeInactivar,
  puedeActualizarStock,
  onEditar,
  onToggleEstado,
  onEditarStock,
  variant = "table",
}) {
  const esDeshabilitado = producto.estado === "Deshabilitado";
  const esMovil = variant === "mobile";
  const bloquearInhabilitar = producto.esDestacado && !esDeshabilitado;
  const filaSuperior = puedeEditar && puedeActualizarStock;

  const sizeClass = esMovil
    ? "h-[var(--control-height)] px-2.5"
    : "h-8 px-2";

  const editarClassName = `${actionButtonBase} ${sizeClass} border-slate-950 bg-slate-950 text-white hover:border-neutral-700 hover:bg-neutral-700 focus-visible:ring-slate-400`;
  const toggleClassName = `${actionButtonBase} ${sizeClass} ${
    esDeshabilitado
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-300"
      : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-300"
  }`;
  const stockClassName = `${actionButtonBase} ${sizeClass} border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400`;

  return (
    <div
      className={`grid gap-1 ${esMovil ? "w-full gap-2" : "w-[10.5rem]"} ${
        filaSuperior && !esMovil ? "grid-cols-2" : "grid-cols-1"
      }`}
    >
      {puedeEditar ? (
        <button type="button" onClick={onEditar} className={editarClassName}>
          <Pencil className="size-3 shrink-0" aria-hidden="true" />
          <span>Editar</span>
        </button>
      ) : null}
      {puedeActualizarStock ? (
        <button type="button" onClick={onEditarStock} className={stockClassName}>
          <PackageOpen className="size-3 shrink-0" aria-hidden="true" />
          <span>Stock</span>
        </button>
      ) : null}
      {puedeInactivar ? (
        <button
          type="button"
          onClick={onToggleEstado}
          disabled={bloquearInhabilitar}
          title={bloquearInhabilitar ? "Quita el destacado antes de deshabilitarlo" : undefined}
          className={`${toggleClassName} disabled:cursor-not-allowed disabled:opacity-50 ${filaSuperior && !esMovil ? "col-span-2" : ""}`}
        >
          <Power className="size-3 shrink-0" aria-hidden="true" />
          <span>{esDeshabilitado ? "Habilitar" : "Inhabilitar"}</span>
        </button>
      ) : null}
    </div>
  );
}
