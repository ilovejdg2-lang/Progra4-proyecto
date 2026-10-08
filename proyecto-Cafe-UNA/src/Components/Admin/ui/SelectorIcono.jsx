import { createElement, useEffect, useRef, useState } from "react";
import { Wand2 } from "lucide-react";

import { useTraducir } from "../../../hooks/useTraducir";
import { ICONOS_CATALOGO, etiquetaIcono } from "../../../lib/iconosCatalogo";
import { t } from "../../../lib/t";

const btnIcono =
  "inline-flex size-[var(--control-height)] shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Botón con el ícono actual que abre la lista de íconos disponibles.
 * `IconoActual` es lo que se ve cuando no hay uno elegido (automático).
 */
export function SelectorIcono({ valor, IconoActual, onElegir, disabled, etiquetaAuto = "Automático" }) {
  const [abierto, setAbierto] = useState(false);
  const [resaltado, setResaltado] = useState("");
  const contenedor = useRef(null);
  const tAuto = useTraducir(etiquetaAuto);
  const tElegir = useTraducir("Elegir ícono");
  const nombreVisible = etiquetaIcono(resaltado || valor);

  useEffect(() => {
    if (!abierto) return undefined;
    const cerrar = (e) => {
      if (contenedor.current && !contenedor.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, [abierto]);

  const elegir = (clave) => {
    onElegir(clave);
    setAbierto(false);
  };

  return (
    <div className="relative" ref={contenedor}>
      <button
        type="button"
        className={`${btnIcono} ${valor ? "border-slate-400 text-slate-900" : ""}`}
        onClick={() => setAbierto((v) => !v)}
        disabled={disabled}
        aria-expanded={abierto}
        aria-label={tElegir}
        title={valor ? t(etiquetaIcono(valor)) : tAuto}
      >
        {IconoActual ? createElement(IconoActual, { className: "size-5", "aria-hidden": true }) : null}
      </button>
      {abierto ? (
        <div className="absolute left-0 top-[calc(100%+0.4rem)] z-30 w-[17.5rem] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <button
            type="button"
            className={`mb-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[length:var(--text-body)] hover:bg-slate-50 ${!valor ? "bg-slate-100 font-semibold" : ""}`}
            onClick={() => elegir("")}
          >
            <Wand2 className="size-4" aria-hidden />
            {tAuto}
          </button>
          <div className="grid max-h-60 grid-cols-5 gap-1.5 overflow-y-auto" onMouseLeave={() => setResaltado("")}>
            {ICONOS_CATALOGO.map(({ clave, etiqueta, Icono }) => (
              <button
                key={clave}
                type="button"
                title={t(etiqueta)}
                aria-label={t(etiqueta)}
                className={`inline-flex aspect-square items-center justify-center rounded-xl border ${
                  valor === clave ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
                onMouseEnter={() => setResaltado(clave)}
                onFocus={() => setResaltado(clave)}
                onClick={() => elegir(clave)}
              >
                <Icono className="size-5" aria-hidden />
              </button>
            ))}
          </div>
          <p className="mt-2 min-h-[1.5em] px-1 text-[length:var(--text-body)] text-slate-500">
            {nombreVisible ? t(nombreVisible) : ""}
          </p>
        </div>
      ) : null}
    </div>
  );
}
