import { useCallback, useEffect, useState } from "react";

import {
  crearSolicitudSalidaInventario,
  obtenerSolicitudesSalidaInventario,
  revisarSolicitudSalidaInventario,
} from "../../../services/inventarioSalidasService";
import { SolicitudSalidaInventarioForm } from "./SolicitudSalidaInventarioForm";

function valor(record, ...keys) {
  for (const key of keys) {
    if (record?.[key] !== undefined && record?.[key] !== null) return record[key];
  }
  return "";
}

function formatearFecha(value) {
  if (!value) return "Sin fecha";
  const parsed = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? String(value)
    : new Intl.DateTimeFormat("es-CR", { dateStyle: "long" }).format(parsed);
}

function textoEstado(estado) {
  return ({
    pendiente: "Pendiente de revisión",
    aprobada: "Aprobada",
    rechazada: "Rechazada",
    cancelada: "Cancelada",
  })[String(estado).toLowerCase()] ?? "Estado desconocido";
}

export function SolicitudesSalidaInventarioPanel({ productos = [], puedeSolicitar = false, esSuperAdmin = false, onInventoryChanged }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [comentarios, setComentarios] = useState({});
  const [savingId, setSavingId] = useState("");

  const cargarSolicitudes = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const rows = await obtenerSolicitudesSalidaInventario();
      setSolicitudes(rows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las solicitudes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    obtenerSolicitudesSalidaInventario()
      .then((rows) => {
        if (active) setSolicitudes(rows);
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las solicitudes.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const targetId = window.location.hash.slice(1);
    if (!targetId.startsWith("solicitud-")) return;
    document.getElementById(targetId)?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }, [solicitudes]);

  const enviarSolicitud = async (payload) => {
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      await crearSolicitudSalidaInventario(payload);
      await cargarSolicitudes();
      await onInventoryChanged?.();
      setSuccess("La solicitud quedó pendiente de revisión. El stock se reserva, pero no se descuenta hasta su aprobación.");
    } finally {
      setIsSaving(false);
    }
  };

  const revisarSolicitud = async (solicitud, accion) => {
    const id = String(valor(solicitud, "Id", "id"));
    const comentario = String(comentarios[id] ?? "").trim();
    if (accion !== "aprobar" && !comentario) {
      setError("Ingresá un comentario para rechazar o cancelar la solicitud.");
      return;
    }
    setSavingId(id);
    setError("");
    setSuccess("");
    try {
      await revisarSolicitudSalidaInventario(id, accion, comentario);
      await cargarSolicitudes();
      await onInventoryChanged?.();
      setSuccess(`La solicitud fue ${accion === "aprobar" ? "aprobada" : accion === "rechazar" ? "rechazada" : "cancelada"}.`);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "No se pudo actualizar la solicitud.");
    } finally {
      setSavingId("");
    }
  };

  return (
    <div className="space-y-6">
      {puedeSolicitar ? (
        <section aria-labelledby="solicitud-salida-title" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-5 border-b border-slate-100 pb-4 dark:border-slate-800">
            <h2 id="solicitud-salida-title" className="text-lg font-semibold text-slate-950 dark:text-white">Solicitar donación o regalía</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">La solicitud reserva las cantidades mientras SuperAdmin la revisa. El inventario físico solo cambia al aprobarla.</p>
          </div>
          <SolicitudSalidaInventarioForm productos={productos} onSubmit={enviarSolicitud} isSubmitting={isSaving} />
        </section>
      ) : null}

      <section aria-labelledby="solicitudes-salida-list-title" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 id="solicitudes-salida-list-title" className="text-lg font-semibold text-slate-950 dark:text-white">Solicitudes de salidas no comerciales</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Historial y estado de revisión de donaciones y regalías.</p>
          </div>
          <button type="button" onClick={cargarSolicitudes} disabled={isLoading} className="min-h-10 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900">Actualizar</button>
        </div>

        {error ? <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">{error}</p> : null}
        {success ? <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">{success}</p> : null}
        {isLoading ? <p role="status" className="py-6 text-center text-sm text-slate-500">Cargando solicitudes…</p> : null}
        {!isLoading && !error && solicitudes.length === 0 ? <p role="status" className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">Todavía no hay solicitudes de donación o regalía.</p> : null}

        <div className="space-y-4">
          {solicitudes.map((solicitud) => {
            const id = String(valor(solicitud, "Id", "id"));
            const estado = String(valor(solicitud, "Estado", "estado"));
            const items = valor(solicitud, "Items", "items") || [];
            const historial = valor(solicitud, "Historial", "historial") || [];
            const pendiente = estado.toLowerCase() === "pendiente";
            return (
              <article id={`solicitud-${id}`} key={id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950 dark:text-white">{String(valor(solicitud, "Tipo", "tipo")).toLowerCase() === "regalia" ? "Regalía" : "Donación"} · {String(valor(solicitud, "Destinatario", "destinatario"))}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Fecha de salida: {formatearFecha(valor(solicitud, "FechaSalida", "fechaSalida"))} · Responsable: {String(valor(solicitud, "ResponsableNombre", "responsableNombre", "responsable"))}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-100">{textoEstado(estado)}</span>
                </div>

                <ul className="mt-3 space-y-1 text-sm text-slate-700 dark:text-slate-200">
                  {items.map((item) => {
                    const producto = valor(item, "Producto", "producto") || {};
                    const nombre = valor(producto, "Nombre", "nombre") || `Producto ${valor(item, "ProductoId", "productoId")}`;
                    return <li key={String(valor(item, "Id", "id", "ProductoId", "productoId"))}>{String(nombre)} · {String(valor(item, "Cantidad", "cantidad"))} unidades</li>;
                  })}
                </ul>

                {historial.length ? (
                  <details className="mt-4 text-sm">
                    <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200">Trazabilidad ({historial.length} eventos)</summary>
                    <ol className="mt-2 space-y-2 border-l border-slate-300 pl-4 dark:border-slate-700">
                      {historial.map((evento, index) => (
                        <li key={String(valor(evento, "Id", "id") || `${id}-${index}`)} className="text-slate-600 dark:text-slate-300">
                          {String(valor(evento, "Accion", "accion"))} · actor {String(valor(evento, "ActorId", "actorId"))} · {formatearFecha(valor(evento, "CreadaEn", "creadaEn"))}
                          {valor(evento, "Comentario", "comentario") ? ` · ${String(valor(evento, "Comentario", "comentario"))}` : ""}
                        </li>
                      ))}
                    </ol>
                  </details>
                ) : null}

                {esSuperAdmin && pendiente ? (
                  <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Comentario de revisión
                      <textarea aria-label="Comentario de revisión" value={comentarios[id] ?? ""} onChange={(event) => setComentarios((current) => ({ ...current, [id]: event.target.value }))} maxLength={500} rows={2} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={savingId === id} onClick={() => revisarSolicitud(solicitud, "aprobar")} className="min-h-10 rounded-full bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">Aprobar</button>
                      <button type="button" disabled={savingId === id} onClick={() => revisarSolicitud(solicitud, "rechazar")} className="min-h-10 rounded-full bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-60">Rechazar</button>
                      <button type="button" disabled={savingId === id} onClick={() => revisarSolicitud(solicitud, "cancelar")} className="min-h-10 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">Cancelar</button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
