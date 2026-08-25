export function AdminSeccionCard({
  etiqueta,
  titulo,
  icono: Icon,
  onEditar,
  borde = "border-amber-700",
  iconoCls = "text-amber-700",
  botonCls = "border-slate-950 bg-slate-950 text-white hover:border-neutral-700 hover:bg-neutral-700 active:border-neutral-700 active:bg-neutral-700",
}) {
  const iconoSinFondo = iconoCls.split(" ").filter((clase) => !clase.startsWith("bg-")).join(" ");

  return (
    <article className="flex min-h-56 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100">
      <div className={`h-1.5 shrink-0 ${borde.replace("border-", "bg-")}`} />

      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
        <p className="shrink-0 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
          {etiqueta}
        </p>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-2 py-2 text-center">
          <span className={`grid size-14 place-items-center sm:size-16 ${iconoSinFondo}`}>
            <Icon className="size-8 sm:size-9" strokeWidth={1.75} />
          </span>
          <h2 className="line-clamp-3 text-base font-bold leading-snug text-slate-950 sm:text-lg">
            {titulo}
          </h2>
        </div>

        <div className="mt-auto flex justify-end border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onEditar}
            className={`inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-xs font-bold transition ${botonCls}`}
          >
            <Pencil className="mr-1 size-3" aria-hidden="true" />
            Editar
          </button>
        </div>
      </div>
    </article>
  );
}
import { Pencil } from "lucide-react";
