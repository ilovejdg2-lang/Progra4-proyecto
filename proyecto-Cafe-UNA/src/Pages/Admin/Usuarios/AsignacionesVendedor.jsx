import { useEffect, useState } from "react";
import { ST } from "../../../Components/T/ST";
import { SelectFiltro } from "../../../Components/ui/SelectFiltro";
import {
  asignarPuntosVendedor,
  cambiarEstadoAsignacionPunto,
  cambiarPuntoAsignado,
  obtenerAsignacionesPunto,
  obtenerPuntosAsignables,
} from "../../../services/usuariosService";

function normalizarAsignacion(raw) {
  return {
    id: raw?.id ?? raw?.Id,
    ubicacionId: Number(raw?.ubicacionId ?? raw?.UbicacionId),
    codigo: String(raw?.codigo ?? raw?.Codigo ?? ""),
    nombre: String(raw?.nombre ?? raw?.Nombre ?? ""),
    asignacionActiva: Boolean(raw?.asignacionActiva ?? raw?.AsignacionActiva),
    puntoActivo: Boolean(raw?.puntoActivo ?? raw?.PuntoActivo),
  };
}

function normalizarPunto(raw) {
  return {
    id: Number(raw?.id ?? raw?.Id),
    code: String(raw?.code ?? raw?.Codigo ?? ""),
    name: String(raw?.name ?? raw?.Nombre ?? ""),
    activo: raw?.activo ?? raw?.Activo !== false,
  };
}

export function AsignacionesVendedor({ usuarioId }) {
  const [asignaciones, setAsignaciones] = useState([]);
  const [elegibles, setElegibles] = useState([]);
  const [seleccion, setSeleccion] = useState([]);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const cargar = async () => {
    const [actuales, puntos] = await Promise.all([
      obtenerAsignacionesPunto(usuarioId),
      obtenerPuntosAsignables(),
    ]);
    setAsignaciones((Array.isArray(actuales) ? actuales : []).map(normalizarAsignacion));
    setElegibles((Array.isArray(puntos) ? puntos : []).map(normalizarPunto));
  };

  useEffect(() => {
    let activo = true;
    cargar()
      .catch(() => {
        if (activo) setError("No se pudieron cargar las asignaciones.");
      });
    return () => {
      activo = false;
    };
  }, [usuarioId]);

  const ejecutar = async (accion) => {
    setOcupado(true);
    setError("");
    try {
      await accion();
      await cargar();
    } catch (err) {
      setError(err?.message || "No se pudo actualizar la asignación.");
    } finally {
      setOcupado(false);
    }
  };

  const activos = new Set(
    asignaciones.filter((item) => item.asignacionActiva).map((item) => item.ubicacionId),
  );
  const disponibles = elegibles.filter((punto) => !activos.has(punto.id));

  return (
    <section className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <h3 className="text-[13px] font-semibold text-slate-900">
        <ST>Puntos de venta asignados</ST>
      </h3>
      <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
        <ST>Desactivar la asignación no desactiva el punto para los demás vendedores.</ST>
      </p>
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      <ul className="mt-2 space-y-1.5">
        {error ? null : asignaciones.length === 0 ? (
          <li className="text-xs text-slate-500">
            <ST>Este vendedor no tiene puntos asignados.</ST>
          </li>
        ) : (
          asignaciones.map((item) => (
            <li
              key={item.id || item.ubicacionId}
              className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-900">{item.nombre || item.codigo}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.puntoActivo ? "bg-emerald-50 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
                    {item.puntoActivo ? <ST>Punto activo</ST> : <ST>Punto inactivo</ST>}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.asignacionActiva ? "bg-sky-50 text-sky-800" : "bg-amber-50 text-amber-900"}`}>
                    {item.asignacionActiva ? <ST>Asignación activa</ST> : <ST>Asignación inactiva</ST>}
                  </span>
                </div>
              </div>
              <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-auto sm:flex-row sm:items-center">
                <button
                  type="button"
                  disabled={ocupado}
                  className="h-[var(--control-height)] w-full rounded-full border border-slate-300 px-4 text-[length:var(--text-body)] font-semibold text-slate-700 sm:w-auto"
                  onClick={() =>
                    ejecutar(() =>
                      cambiarEstadoAsignacionPunto(usuarioId, item.ubicacionId, !item.asignacionActiva),
                    )
                  }
                >
                  {item.asignacionActiva ? <ST>Desactivar asignación</ST> : <ST>Reactivar asignación</ST>}
                </button>
                {item.asignacionActiva ? (
                  <div className="w-full min-w-0 sm:w-56">
                  <SelectFiltro
                    value=""
                    disabled={ocupado}
                    aria-label="Cambiar punto"
                    onChange={(event) => {
                      const hacia = Number(event.target.value);
                      if (!hacia) return;
                      ejecutar(() => cambiarPuntoAsignado(usuarioId, item.ubicacionId, hacia));
                    }}
                  >
                    <option value=""><ST>Cambiar por...</ST></option>
                    {disponibles.map((punto) => (
                      <option key={punto.id} value={punto.id}>{punto.name}</option>
                    ))}
                  </SelectFiltro>
                  </div>
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>
      {disponibles.length > 0 ? (
        <div className="mt-2">
          <p className="mb-1.5 text-[11px] font-medium text-slate-600"><ST>Agregar puntos</ST></p>
          <div className="flex flex-wrap gap-1.5">
            {disponibles.map((punto) => {
              const marcado = seleccion.includes(punto.id);
              return (
                <button
                  key={punto.id}
                  type="button"
                  className={`max-w-full rounded-full border px-2.5 py-1 text-[11px] font-semibold ${marcado ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-700"}`}
                  onClick={() =>
                    setSeleccion((actual) =>
                      actual.includes(punto.id)
                        ? actual.filter((id) => id !== punto.id)
                        : [...actual, punto.id],
                    )
                  }
                >
                  {punto.name}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            disabled={ocupado || seleccion.length === 0}
            className="mt-2 w-full rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50 sm:w-auto"
            onClick={() =>
              ejecutar(async () => {
                await asignarPuntosVendedor(usuarioId, seleccion);
                setSeleccion([]);
              })
            }
          >
            <ST>Asignar seleccionados</ST>
          </button>
        </div>
      ) : null}
    </section>
  );
}
