import { useEffect, useId, useState } from "react";
import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { ChevronDown, Clock } from "lucide-react";

import { ST } from "../../Components/T/ST";
import { useTraducir } from "../../hooks/useTraducir";
import { useIdioma } from "../../lib/useIdioma";
import { listarCierresCompra, obtenerReglasHorario } from "../../services/ajustesService";

function fechaLocal(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * En el rastreo de un pedido aceptado: al entrar se ve el horario del punto
 * de retiro y los días en los que no hay disponibilidad.
 */
export function HorarioRetiroPedido({
  ubicacionId = null,
  ubicacionNombre = "",
  horario = "",
}) {
  const panelId = useId();
  const { idioma } = useIdioma();
  const [abierto, setAbierto] = useState(false);
  const [dias, setDias] = useState([]);
  const [horarioBase, setHorarioBase] = useState("");
  const [listo, setListo] = useState(false);
  const tAbrir = useTraducir("Ver horario y días sin disponibilidad");
  const tSinMotivo = useTraducir("No se recogerán pedidos");
  const tSinHorario = useTraducir("Este punto no tiene un horario publicado.");
  const tSinDias = useTraducir("No hay días sin disponibilidad.");
  const horarioPunto = String(horario || "").trim();
  const nombre = String(ubicacionNombre || "").trim();

  useEffect(() => {
    if (!abierto) return undefined;
    let activo = true;
    setListo(false);
    Promise.all([
      listarCierresCompra(ubicacionId).catch(() => []),
      horarioPunto ? Promise.resolve(null) : obtenerReglasHorario().catch(() => null),
    ])
      .then(([lista, reglas]) => {
        if (!activo) return;
        setDias(Array.isArray(lista) ? lista : []);
        setHorarioBase(String(reglas?.mensaje || "").trim());
      })
      .finally(() => {
        if (activo) setListo(true);
      });
    return () => {
      activo = false;
    };
  }, [abierto, ubicacionId, horarioPunto]);

  const locale = idioma === "en" ? enUS : es;
  const capital = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);
  const etiqueta = (fecha) => {
    const dia = format(fecha, "EEEE", { locale });
    const mes = format(fecha, "MMMM", { locale });
    if (idioma === "en") return `${capital(dia)}, ${format(fecha, "MMM d", { locale })}`;
    return `${capital(dia)} ${format(fecha, "d")} de ${capital(mes)}`;
  };
  const textoHorario = horarioPunto || horarioBase || (listo ? tSinHorario : "");

  return (
    <div className="mt-3">
      <button
        type="button"
        className="flex min-h-[var(--control-height)] w-full items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 text-left text-[var(--text-body)] font-semibold text-slate-900"
        aria-expanded={abierto}
        aria-controls={panelId}
        title={tAbrir}
        onClick={() => setAbierto((valor) => !valor)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Clock className="shrink-0" size={16} aria-hidden="true" />
          <ST>Horario</ST>
        </span>
        <ChevronDown
          className={`shrink-0 transition-transform ${abierto ? "rotate-180" : ""}`}
          size={16}
          aria-hidden="true"
        />
      </button>
      {abierto ? (
        <div id={panelId} className="mt-2 rounded-xl bg-slate-50 px-3 py-3 text-[var(--text-body)] text-slate-700">
          <p className="font-semibold text-slate-900">
            <ST>Horario de retiro</ST>
            {nombre ? <span className="font-semibold"> · {nombre}</span> : null}
          </p>
          {textoHorario ? <p className="mt-1 break-words">{textoHorario}</p> : <p className="mt-1"><ST>Cargando...</ST></p>}
          <p className="mt-3 font-semibold text-slate-900">
            <ST>Días sin disponibilidad</ST>
          </p>
          {!listo ? (
            <p className="mt-1">
              <ST>Cargando...</ST>
            </p>
          ) : dias.length === 0 ? (
            <p className="mt-1">{tSinDias}</p>
          ) : (
            <ul className="mt-1 grid gap-2">
              {dias.map((dia) => (
                <li key={`${dia.fecha}-${dia.ubicacionId ?? "general"}`} className="min-w-0">
                  <strong className="break-words text-slate-900">{etiqueta(fechaLocal(dia.fecha))}</strong>
                  <span className="mt-0.5 block break-words">{String(dia.nota || "").trim() || tSinMotivo}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
