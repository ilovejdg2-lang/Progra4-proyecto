import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

import {
  AdminModal,
  AdminModalBody,
  AdminModalHeader,
  adminBtnVoluntariadoCancel,
} from "../../Components/Admin/ui/AdminModal";
import { ST } from "../../Components/T/ST";
import {
  eliminarMiPropuesta,
  solicitarEliminacionMiPropuesta,
} from "../../services/propuestasProductoresService";

const btnPeligro =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60";

export function ModalEliminarMiPropuesta({
  open,
  onClose,
  propuesta,
  esSolicitudBaja = false,
  onCompletado,
}) {
  const [motivo, setMotivo] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  if (!open || !propuesta) return null;

  const ejecutar = async (e) => {
    e.preventDefault();
    setError("");

    if (esSolicitudBaja) {
      const mot = motivo.trim();
      if (!mot) {
        setError("Por favor describe el motivo de la baja.");
        return;
      }
      if (mot.length < 5) {
        setError("Escribe al menos 5 caracteres para explicar la razón de la baja.");
        return;
      }
    }

    setProcesando(true);
    try {
      if (esSolicitudBaja) {
        await solicitarEliminacionMiPropuesta(propuesta.id, motivo.trim());
      } else {
        await eliminarMiPropuesta(propuesta.id);
      }
      if (onCompletado) onCompletado();
      onClose();
    } catch (err) {
      setError(err?.message || "No se pudo procesar la solicitud.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <AdminModal open={open} onClose={() => !procesando && onClose()} maxWidth="max-w-lg">
      <AdminModalHeader>
        <ST>
          {esSolicitudBaja
            ? "Solicitar baja de emprendimiento"
            : "Eliminar propuesta de productor"}
        </ST>
      </AdminModalHeader>
      <AdminModalBody>
        <form onSubmit={ejecutar} className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-rose-950">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-600" />
            <div className="text-sm">
              <p className="font-semibold">{propuesta.nombre}</p>
              <p className="mt-1 text-slate-700">
                {esSolicitudBaja ? (
                  <ST>
                    Tu emprendimiento está publicado en el catálogo público. Al solicitar la baja,
                    el equipo administrativo revisará tu solicitud para retirar el registro de la
                    página web.
                  </ST>
                ) : (
                  <ST>
                    Esta acción cancelará y eliminará tu propuesta de forma permanente.
                  </ST>
                )}
              </p>
            </div>
          </div>

          {esSolicitudBaja ? (
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-slate-800">
                <ST>Motivo de la baja (Obligatorio)</ST>
                <span className="ml-0.5 text-rose-600">*</span>
              </span>
              <textarea
                rows={3}
                maxLength={500}
                placeholder="Por ejemplo: el emprendimiento cerró temporalmente o cambió de giro de negocio."
                value={motivo}
                onChange={(e) => {
                  setMotivo(e.target.value);
                  setError("");
                }}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </label>
          ) : null}

          {error ? (
            <p className="text-sm font-medium text-rose-700" role="alert">
              <ST>{error}</ST>
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              className={btnPeligro}
              disabled={procesando || (esSolicitudBaja && !motivo.trim())}
            >
              <Trash2 className="size-4" />
              {procesando ? (
                <ST>Procesando...</ST>
              ) : (
                <ST>{esSolicitudBaja ? "Enviar solicitud de baja" : "Eliminar propuesta"}</ST>
              )}
            </button>
            <button
              type="button"
              className={adminBtnVoluntariadoCancel}
              disabled={procesando}
              onClick={onClose}
            >
              <ST>Cancelar</ST>
            </button>
          </div>
        </form>
      </AdminModalBody>
    </AdminModal>
  );
}
