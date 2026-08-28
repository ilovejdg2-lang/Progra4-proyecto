import { Pencil } from "lucide-react";

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
    <article className="flex min-h-40 min-w-0 w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100">
      <div className={`h-1 shrink-0 ${borde.replace("border-", "bg-")}`} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-3 sm:p-3.5">
        <p className="shrink-0 truncate text-center text-[length:var(--text-body)] font-bold uppercase tracking-wide text-slate-400">
          {etiqueta}
        </p>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-2 overflow-hidden px-1 py-1.5 text-center">
          <span className={`grid size-10 shrink-0 place-items-center sm:size-11 ${iconoSinFondo}`}>
            <Icon className="size-6 sm:size-7" strokeWidth={1.75} />
          </span>
          <h2 className="max-w-full break-words text-[length:var(--text-subtitle)] font-bold leading-snug text-[#2a1612]">
            {titulo}
          </h2>
        </div>

        <div className="mt-auto flex shrink-0 justify-end border-t border-slate-100 pt-2.5">
          <button
            type="button"
            onClick={onEditar}
            className={`inline-flex h-[var(--control-height)] items-center justify-center rounded-full border px-3.5 text-[length:var(--text-body)] font-bold transition ${botonCls}`}
          >
            <Pencil className="mr-1 size-3.5" aria-hidden="true" />
            Editar
          </button>
        </div>
      </div>
    </article>
  );
}
