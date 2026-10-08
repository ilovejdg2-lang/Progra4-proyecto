import { useMemo, useState } from "react";
import { LifeBuoy, Search } from "lucide-react";

import { ST } from "../T/ST";
import { useTraducir } from "../../hooks/useTraducir";
import { SeccionManual } from "./SeccionManual";

function claveBusqueda(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function textoSeccion(seccion) {
  const pasos = (seccion.pasos || []).map((p) => (typeof p === "string" ? p : p?.texto || ""));
  return claveBusqueda([seccion.titulo, seccion.grupo, seccion.resumen, ...pasos, ...(seccion.consejos || [])].join(" "));
}

/** Encabezado, buscador, índice y secciones de un manual de uso. */
export function ManualContenido({ secciones, carpetaFotos, lead, buscarPlaceholder }) {
  const [busqueda, setBusqueda] = useState("");
  const tTitulo = useTraducir("Ayuda");
  const tLead = useTraducir(lead);
  const tBuscar = useTraducir(buscarPlaceholder || "Buscar en la ayuda");
  const tContenido = useTraducir("Contenido");
  const tSinResultados = useTraducir("No encontramos nada con esa búsqueda.");

  const visibles = useMemo(() => {
    const q = claveBusqueda(busqueda.trim());
    if (!q) return secciones;
    return secciones.filter((s) => textoSeccion(s).includes(q));
  }, [secciones, busqueda]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex items-start gap-3">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
          <LifeBuoy className="size-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-[length:var(--text-title)] font-bold text-slate-950">{tTitulo}</h1>
          <p className="mt-1 text-[length:var(--text-body)] text-slate-600">{tLead}</p>
        </div>
      </header>

      <label className="relative block">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder={tBuscar}
          aria-label={tBuscar}
          className="h-[var(--control-height)] w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-[length:var(--text-body)] text-slate-900 focus:border-slate-500 focus:outline-none"
        />
      </label>

      <div className="grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <nav aria-label={tContenido} className="rounded-3xl border border-slate-200 bg-white p-4 lg:sticky lg:top-20">
          <p className="mb-2 px-2 text-[length:var(--text-body)] font-semibold text-slate-500">{tContenido}</p>
          <ol className="grid gap-0.5">
            {visibles.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block rounded-xl px-2 py-2 text-[length:var(--text-body)] text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                >
                  <ST>{s.titulo}</ST>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="grid min-w-0 gap-4">
          {visibles.length ? (
            visibles.map((s) => <SeccionManual key={s.id} seccion={s} carpetaFotos={carpetaFotos} />)
          ) : (
            <p className="rounded-3xl border border-slate-200 bg-white p-6 text-[length:var(--text-body)] text-slate-600">
              {tSinResultados}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
