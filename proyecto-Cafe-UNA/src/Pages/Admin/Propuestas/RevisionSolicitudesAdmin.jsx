import { useState } from "react";
import { AlertTriangle, Check, Image as ImageIcon, Trash2, X } from "lucide-react";

import {
  AdminModal,
  AdminModalBody,
  AdminModalHeader,
  adminBtnPrimary,
  adminBtnVoluntariadoCancel,
} from "../../../Components/Admin/ui/AdminModal";
import { ST } from "../../../Components/T/ST";
import { formatearFechaPropuesta } from "../../../lib/propuestaProductor";
import {
  eliminarPropuestaAdmin,
  resolverSolicitudEdicionAdmin,
  resolverSolicitudEliminacionAdmin,
} from "../../../services/propuestasProductoresService";

const ETIQUETAS_CAMPOS = {
  nombre: "Nombre del emprendimiento",
  descripcion: "Descripción",
  provincia: "Provincia",
  canton: "Cantón",
  distrito: "Distrito",
  direccion: "Dirección o señas",
  enlaceUbicacion: "Enlace de ubicación",
  telefono: "Teléfono",
  correo: "Correo",
  facebook: "Facebook",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  sitioWeb: "Sitio web",
};

export function RevisionSolicitudEdicion({ propuesta, onResuelto }) {
  const [comentario, setComentario] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  const sol = propuesta?.solicitudEdicion;
  if (!sol) return null;

  const cambios = sol.cambios || {};
  const camposConCambio = Object.entries(ETIQUETAS_CAMPOS).filter(([campo]) => {
    const actual = String(propuesta[campo] || "").trim();
    const solicitado = String(cambios[campo] || "").trim();
    return solicitado && actual !== solicitado;
  });

  const resolver = async (accion) => {
    setProcesando(true);
    setError("");
    try {
      const res = await resolverSolicitudEdicionAdmin(propuesta.id, {
        accion,
        comentarioAdmin: comentario.trim(),
      });
      if (onResuelto) onResuelto(res);
    } catch (err) {
      setError(err?.message || "No se pudo resolver la solicitud de edición.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <section className="mt-6 space-y-4 rounded-2xl border border-sky-300 bg-sky-50/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200 pb-3">
        <div>
          <h4 className="text-base font-bold text-sky-950">
            <ST>Solicitud de edición del productor</ST>
          </h4>
          <p className="text-xs text-sky-800">
            <ST>Recibida el</ST> {formatearFechaPropuesta(sol.fecha)}
          </p>
        </div>
        <span className="rounded-full bg-sky-200/80 px-2.5 py-1 text-xs font-bold text-sky-900">
          <ST>Pendiente de decisión</ST>
        </span>
      </div>

      <div className="rounded-xl border border-sky-200 bg-white p-3.5 text-sm">
        <p className="font-semibold text-slate-800"><ST>Motivo del cambio indicado por el productor:</ST></p>
        <p className="mt-1 text-slate-700 italic">"{sol.motivo}"</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-sky-900">
          <ST>Comparación de datos solicitados:</ST>
        </p>

        {camposConCambio.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-sky-200 bg-white">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 font-semibold text-slate-700">
                  <th className="p-2.5"><ST>Campo</ST></th>
                  <th className="p-2.5"><ST>Valor actual</ST></th>
                  <th className="p-2.5"><ST>Nuevo valor propuesto</ST></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {camposConCambio.map(([campo, etiqueta]) => (
                  <tr key={campo}>
                    <td className="p-2.5 font-medium text-slate-800"><ST>{etiqueta}</ST></td>
                    <td className="p-2.5 text-slate-500 line-through">{propuesta[campo] || "-"}</td>
                    <td className="p-2.5 font-semibold text-sky-900 bg-sky-50/40">{cambios[campo] || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-600">
            <ST>No hay diferencias de texto directo (o solo se actualizó la imagen).</ST>
          </p>
        )}

        {sol.imagenUrl ? (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-sky-200 bg-white p-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200">
              <img src={sol.imagenUrl} alt="Nueva imagen" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                <ST>Nueva imagen propuesta</ST>
              </p>
              <p className="text-xs text-slate-500">
                <ST>Reemplazará la imagen actual si se aprueba la edición.</ST>
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-1.5 pt-2">
        <label htmlFor="admin-comentario-edicion" className="text-xs font-semibold text-slate-700">
          <ST>Comentario para el historial (opcional):</ST>
        </label>
        <textarea
          id="admin-comentario-edicion"
          rows={2}
          maxLength={500}
          placeholder="Razón de la decisión o instrucciones adicionales..."
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-sky-400"
        />
      </div>

      {error ? <p className="text-xs font-semibold text-rose-700"><ST>{error}</ST></p> : null}

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <button
          type="button"
          disabled={procesando}
          onClick={() => resolver("aprobar")}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          <Check className="size-3.5" />
          <ST>{procesando ? "Procesando..." : "Aprobar cambios y actualizar catálogo"}</ST>
        </button>
        <button
          type="button"
          disabled={procesando}
          onClick={() => resolver("rechazar")}
          className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-white px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
        >
          <X className="size-3.5" />
          <ST>Rechazar cambios</ST>
        </button>
      </div>
    </section>
  );
}

export function RevisionSolicitudEliminacion({ propuesta, onResuelto }) {
  const [comentario, setComentario] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  const sol = propuesta?.solicitudEliminacion;
  if (!sol) return null;

  const resolver = async (accion) => {
    setProcesando(true);
    setError("");
    try {
      const res = await resolverSolicitudEliminacionAdmin(propuesta.id, {
        accion,
        comentarioAdmin: comentario.trim(),
      });
      if (onResuelto) onResuelto(res);
    } catch (err) {
      setError(err?.message || "No se pudo resolver la solicitud de baja.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <section className="mt-6 space-y-4 rounded-2xl border border-rose-300 bg-rose-50/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200 pb-3">
        <div>
          <h4 className="text-base font-bold text-rose-950">
            <ST>Solicitud de baja / retiro del catálogo</ST>
          </h4>
          <p className="text-xs text-rose-800">
            <ST>Recibida el</ST> {formatearFechaPropuesta(sol.fecha)}
          </p>
        </div>
        <span className="rounded-full bg-rose-200/80 px-2.5 py-1 text-xs font-bold text-rose-900">
          <ST>Pendiente de decisión</ST>
        </span>
      </div>

      <div className="rounded-xl border border-rose-200 bg-white p-3.5 text-sm">
        <p className="font-semibold text-slate-800"><ST>Motivo indicado por el productor:</ST></p>
        <p className="mt-1 text-slate-700 italic">"{sol.motivo}"</p>
      </div>

      <p className="text-xs text-rose-900">
        <ST>
          Si aprobás la solicitud, el emprendimiento se retirará inmediatamente del directorio
          público de productores y la propuesta cambiará a estado "Eliminada".
        </ST>
      </p>

      <div className="space-y-1.5 pt-2">
        <label htmlFor="admin-comentario-baja" className="text-xs font-semibold text-slate-700">
          <ST>Comentario para el historial (opcional):</ST>
        </label>
        <textarea
          id="admin-comentario-baja"
          rows={2}
          maxLength={500}
          placeholder="Comentario sobre la aprobación o rechazo de la baja..."
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-rose-400"
        />
      </div>

      {error ? <p className="text-xs font-semibold text-rose-700"><ST>{error}</ST></p> : null}

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <button
          type="button"
          disabled={procesando}
          onClick={() => resolver("aprobar")}
          className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-60"
        >
          <Check className="size-3.5" />
          <ST>{procesando ? "Procesando..." : "Aprobar baja y retirar del catálogo"}</ST>
        </button>
        <button
          type="button"
          disabled={procesando}
          onClick={() => resolver("rechazar")}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <X className="size-3.5" />
          <ST>Rechazar solicitud de baja</ST>
        </button>
      </div>
    </section>
  );
}

export function ModalEliminarPropuestaAdmin({ open, propuesta, onClose, onEliminado }) {
  const [motivo, setMotivo] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  if (!open || !propuesta) return null;

  const ejecutar = async (e) => {
    e.preventDefault();
    setProcesando(true);
    setError("");
    try {
      const res = await eliminarPropuestaAdmin(propuesta.id, motivo.trim());
      if (onEliminado) onEliminado(res);
      onClose();
    } catch (err) {
      setError(err?.message || "No se pudo eliminar la propuesta.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <AdminModal open={open} onClose={() => !procesando && onClose()} maxWidth="max-w-md">
      <AdminModalHeader>
        <ST>Eliminar propuesta / emprendimiento</ST>
      </AdminModalHeader>
      <AdminModalBody>
        <form onSubmit={ejecutar} className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-rose-950">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-600" />
            <div className="text-sm">
              <p className="font-semibold">{propuesta.nombre}</p>
              <p className="mt-1 text-slate-700">
                <ST>
                  ¿Confirmás la eliminación definitiva? Si la propuesta está aprobada o activa, se
                  retirará de inmediato del catálogo de productores.
                </ST>
              </p>
            </div>
          </div>

          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-slate-800">
              <ST>Motivo administrativo (opcional)</ST>
            </span>
            <textarea
              rows={2}
              maxLength={500}
              placeholder="Razón de la eliminación por parte del administrador..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </label>

          {error ? <p className="text-sm font-semibold text-rose-700"><ST>{error}</ST></p> : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={procesando}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
            >
              <Trash2 className="size-4" />
              <ST>{procesando ? "Eliminando..." : "Eliminar definitivamente"}</ST>
            </button>
            <button
              type="button"
              disabled={procesando}
              onClick={onClose}
              className={adminBtnVoluntariadoCancel}
            >
              <ST>Cancelar</ST>
            </button>
          </div>
        </form>
      </AdminModalBody>
    </AdminModal>
  );
}
