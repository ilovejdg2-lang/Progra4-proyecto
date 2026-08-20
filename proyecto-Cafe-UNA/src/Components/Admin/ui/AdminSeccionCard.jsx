export function EstadoPublicado() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
      <span className="size-1.5 rounded-full bg-emerald-600" />
      Publicado
    </span>
  );
}

export function AdminSeccionCard({
  etiqueta,
  titulo,
  icono: Icon,
  onEditar,
  borde = "border-amber-700",
  iconoCls = "bg-amber-50 text-amber-700",
  botonCls = "border-amber-300 text-amber-800 hover:bg-amber-50",
}) {
  return (
    <article className="flex aspect-square flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100">
      <div className={`h-1.5 shrink-0 ${borde.replace("border-", "bg-")}`} />

      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
        <p className="shrink-0 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
          {etiqueta}
        </p>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-2 py-3 text-center">
          <span className={`grid size-16 place-items-center rounded-2xl sm:size-20 ${iconoCls}`}>
            <Icon className="size-8 sm:size-9" strokeWidth={1.75} />
          </span>
          <h2 className="line-clamp-3 text-base font-bold leading-snug text-slate-950 sm:text-lg">
            {titulo}
          </h2>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <EstadoPublicado />
          <button
            type="button"
            onClick={onEditar}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${botonCls}`}
          >
            Editar
          </button>
        </div>
      </div>
    </article>
  );
}
