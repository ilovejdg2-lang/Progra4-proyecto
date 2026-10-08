import { useEffect, useMemo, useState } from "react";
import { ChevronDown, LifeBuoy, Search } from "lucide-react";

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

  const [activa, setActiva] = useState("");
  const [indiceAbierto, setIndiceAbierto] = useState(false);

  const visibles = useMemo(() => {
    const q = claveBusqueda(busqueda.trim());
    if (!q) return secciones;
    return secciones.filter((s) => textoSeccion(s).includes(q));
  }, [secciones, busqueda]);

  useEffect(() => {
    const elementos = visibles.map((s) => document.getElementById(s.id)).filter(Boolean);
    if (!elementos.length) return undefined;
    const observer = new IntersectionObserver(
      (entradas) => {
        const visible = entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiva(visible.target.id);
      },
      { rootMargin: "-128px 0px -60% 0px" },
    );
    elementos.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [visibles]);

  const tituloActiva = visibles.find((s) => s.id === activa)?.titulo;

  const enlaces = (
    <ol className="grid gap-0.5">
      {visibles.map((s) => {
        const esActiva = s.id === activa;
        return (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={esActiva ? "location" : undefined}
              onClick={() => {
                setActiva(s.id);
                setIndiceAbierto(false);
              }}
              className={`block rounded-xl px-2 py-2 text-[length:var(--text-body)] ${
                esActiva
                  ? "bg-slate-900 font-semibold text-white"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <ST>{s.titulo}</ST>
            </a>
          </li>
        );
      })}
    </ol>
  );

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

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <nav
          aria-label={tContenido}
          className="sticky top-[4.25rem] z-[70] min-w-0 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm lg:top-[4.5rem] lg:max-h-[calc(100svh-5.5rem)] lg:overflow-y-auto lg:p-4 lg:shadow-none"
        >
          <button
            type="button"
            onClick={() => setIndiceAbierto((v) => !v)}
            aria-expanded={indiceAbierto}
            className="flex min-h-[var(--control-height)] w-full items-center justify-between gap-2 rounded-2xl px-2 text-left text-[length:var(--text-body)] lg:hidden"
          >
            <span className="min-w-0 truncate">
              <span className="font-semibold text-slate-500">{tContenido}</span>
              {tituloActiva ? (
                <span className="text-slate-900">
                  {" · "}
                  <ST>{tituloActiva}</ST>
                </span>
              ) : null}
            </span>
            <ChevronDown
              className={`size-5 shrink-0 text-slate-500 transition-transform ${indiceAbierto ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
          <div className={`${indiceAbierto ? "block" : "hidden"} mt-1 max-h-[60svh] overflow-y-auto lg:mt-0 lg:block lg:max-h-none lg:overflow-visible`}>
            <p className="mb-2 hidden px-2 text-[length:var(--text-body)] font-semibold text-slate-500 lg:block">{tContenido}</p>
            {enlaces}
          </div>
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
