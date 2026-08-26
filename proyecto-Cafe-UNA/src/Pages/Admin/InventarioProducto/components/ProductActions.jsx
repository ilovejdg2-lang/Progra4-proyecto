import { PackageOpen, Pencil, Power } from "lucide-react";

const actionButtonBase =
  "inline-flex items-center justify-center gap-1.5 rounded-full border text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

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
  const mostrarDosAcciones = puedeEditar && puedeInactivar;

  const editarClassName = `${actionButtonBase} border-slate-950 bg-slate-950 text-white hover:border-neutral-700 hover:bg-neutral-700 focus-visible:ring-slate-400`;
  const toggleClassName = `${actionButtonBase} ${
    esDeshabilitado
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-300"
      : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-300"
  }`;

  return (
    <div
      className={`grid gap-1.5 ${esMovil ? "gap-2" : "w-[11.5rem]"} ${
        mostrarDosAcciones ? "grid-cols-2" : "grid-cols-1"
      }`}
    >
      {puedeEditar ? (
        <button
          type="button"
          onClick={onEditar}
          className={`${editarClassName} ${esMovil ? "min-h-10 px-2 py-2" : "h-9 px-2.5"}`}
        >
          <Pencil className="size-3.5 shrink-0" aria-hidden="true" />
          <span className={esMovil ? "truncate" : ""}>Editar</span>
        </button>
      ) : null}
      {puedeInactivar ? (
        <button
          type="button"
          onClick={onToggleEstado}
          disabled={bloquearInhabilitar}
          title={bloquearInhabilitar ? "Quita el destacado antes de deshabilitarlo" : undefined}
          className={`${toggleClassName} ${esMovil ? "min-h-10 px-2 py-2" : "h-9 px-2.5"} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <Power className="size-3.5 shrink-0" aria-hidden="true" />
          <span className={esMovil ? "truncate" : ""}>{esDeshabilitado ? "Habilitar" : "Inhabilitar"}</span>
        </button>
      ) : null}
      {puedeActualizarStock ? (
        <button
          type="button"
          onClick={onEditarStock}
          className={`${actionButtonBase} border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400 ${esMovil ? "min-h-10 px-2 py-2" : "h-9 px-2.5"}`}
        >
          <PackageOpen className="size-3.5 shrink-0" aria-hidden="true" />
          <span className={esMovil ? "truncate" : ""}>Stock</span>
        </button>
      ) : null}
    </div>
  );
}
