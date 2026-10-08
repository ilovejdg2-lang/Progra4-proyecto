import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Lightbulb } from "lucide-react";

import { ST } from "../T/ST";
import { useTraducir } from "../../hooks/useTraducir";

/** Las fotos viven en `public/manual/<carpeta>/` y las genera `npm run manual:capturas`. */
function rutaFotoManual(carpeta, seccionId, paso = "") {
  return `/manual/${carpeta}/${seccionId}${paso ? `-${paso}` : ""}.png`;
}

function FotoManual({ src, alt, className = "" }) {
  const [rota, setRota] = useState(false);
  if (rota) return null;
  return (
    <a href={src} target="_blank" rel="noreferrer" className={`block overflow-hidden rounded-2xl border border-slate-200 ${className}`}>
      <img src={src} alt={alt} loading="lazy" className="w-full object-cover object-top" onError={() => setRota(true)} />
    </a>
  );
}

function normalizarPaso(paso) {
  return typeof paso === "string" ? { texto: paso, imagen: "" } : { texto: paso?.texto || "", imagen: paso?.imagen || "" };
}

export function SeccionManual({ seccion, carpetaFotos }) {
  const tIr = useTraducir("Ir a la sección");
  const tTitulo = useTraducir(seccion.titulo);

  return (
    <section id={seccion.id} className="scroll-mt-20 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
      <p className="text-[length:var(--text-body)] font-semibold text-slate-500">
        <ST>{seccion.grupo}</ST>
      </p>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-[length:var(--text-subtitle)] font-bold text-slate-950">{tTitulo}</h2>
        {seccion.ruta ? (
          <Link
            to={seccion.ruta}
            className="inline-flex min-h-[var(--control-height)] items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-[length:var(--text-body)] font-semibold text-slate-700 hover:bg-slate-50"
          >
            {tIr}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        ) : null}
      </div>
      <p className="mt-2 text-[length:var(--text-body)] leading-relaxed text-slate-600">
        <ST>{seccion.resumen}</ST>
      </p>

      {carpetaFotos && seccion.ruta ? (
        <FotoManual src={rutaFotoManual(carpetaFotos, seccion.id)} alt={tTitulo} className="mt-4 max-h-[26rem]" />
      ) : null}

      {seccion.pasos?.length ? (
        <ol className="mt-4 grid gap-3">
          {seccion.pasos.map(normalizarPaso).map((paso, i) => (
            <li key={i} className="grid gap-2">
              <div className="flex gap-3 text-[length:var(--text-body)] leading-relaxed text-slate-800">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-900 font-bold text-white">
                  {i + 1}
                </span>
                <span className="pt-0.5">
                  <ST>{paso.texto}</ST>
                </span>
              </div>
              {carpetaFotos && paso.imagen ? (
                <FotoManual
                  src={rutaFotoManual(carpetaFotos, seccion.id, paso.imagen)}
                  alt={paso.texto}
                  className="ml-10 max-h-[22rem]"
                />
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}

      {seccion.consejos?.length ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-[length:var(--text-body)] font-semibold text-amber-900">
            <Lightbulb className="size-4" aria-hidden />
            <ST>Consejos</ST>
          </p>
          <ul className="mt-2 grid list-disc gap-1 pl-5 text-[length:var(--text-body)] leading-relaxed text-amber-900">
            {seccion.consejos.map((consejo, i) => (
              <li key={i}>
                <ST>{consejo}</ST>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
