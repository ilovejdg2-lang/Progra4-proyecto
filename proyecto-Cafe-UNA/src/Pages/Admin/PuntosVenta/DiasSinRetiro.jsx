import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarX2, Trash2 } from "lucide-react";

import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { ST } from "../../../Components/T/ST";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { rolesDeUsuario, tienePermiso } from "../../../lib/permisos";
import {
  eliminarCierreCompra,
  guardarCierreCompra,
  listarCierresCompraAdmin,
} from "../../../services/ajustesService";
import { obtenerUbicaciones } from "../../../services/productosService";
import { getActiveSessionUser } from "../../../services/sessionService";
import { AdminLayout } from "../layouts/AdminLayout";

function hoyIso() {
  const hoy = new Date();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  return `${hoy.getFullYear()}-${mm}-${dd}`;
}

function etiquetaFecha(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  const texto = format(new Date(y, m - 1, d), "EEEE d 'de' MMMM", { locale: es });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function mensajeError(err, fallback) {
  const data = err?.response?.data?.message ?? err?.message;
  if (Array.isArray(data)) return data.join(" ");
  return data || fallback;
}

export default function AdminDiasSinRetiro() {
  const actor = getActiveSessionUser();
  const roles = rolesDeUsuario(actor);
  const puede =
    tienePermiso(roles, "actualizar_inventario") ||
    tienePermiso(roles, "ver_inventario") ||
    tienePermiso(roles, "administrar_roles_permisos");

  const [fechas, setFechas] = useState([]);
  const [puntos, setPuntos] = useState([]);
  const [status, setStatus] = useState("idle");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [fecha, setFecha] = useState("");
  const [motivo, setMotivo] = useState("");
  const [ubicacionId, setUbicacionId] = useState("");

  const { showLoading, loadingMessage } = useAdminPageGate(
    "/admin/puntos-venta/dias-sin-retiro",
    status !== "idle",
  );

  const nombres = useMemo(() => {
    const map = new Map();
    for (const punto of puntos) {
      if (punto?.id) map.set(Number(punto.id), punto.name || punto.code);
    }
    return map;
  }, [puntos]);

  const cargar = useCallback(async () => {
    if (!puede) {
      setStatus("success");
      return;
    }
    setError("");
    try {
      const [cierres, ubicaciones] = await Promise.all([
        listarCierresCompraAdmin(),
        obtenerUbicaciones().catch(() => []),
      ]);
      setFechas(Array.isArray(cierres) ? cierres : []);
      setPuntos(
        (Array.isArray(ubicaciones) ? ubicaciones : []).filter(
          (punto) => punto?.activo !== false && String(punto.code || "").startsWith("POS_"),
        ),
      );
      setStatus("success");
    } catch (err) {
      setFechas([]);
      setStatus("error");
      setError(mensajeError(err, "No se pudieron cargar las fechas."));
    }
  }, [puede]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function agregar(event) {
    event.preventDefault();
    setError("");
    setAviso("");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      setError("Elegí una fecha.");
      return;
    }
    if (fecha < hoyIso()) {
      setError("La fecha ya pasó.");
      return;
    }
    setGuardando(true);
    try {
      await guardarCierreCompra({
        fecha,
        nota: motivo.trim(),
        ubicacionId: ubicacionId ? Number(ubicacionId) : null,
      });
      setFecha("");
      setMotivo("");
      setUbicacionId("");
      setAviso("Fecha guardada.");
      await cargar();
    } catch (err) {
      setError(mensajeError(err, "No se pudo guardar la fecha."));
    } finally {
      setGuardando(false);
    }
  }

  async function quitar(id) {
    setError("");
    setAviso("");
    setGuardando(true);
    try {
      await eliminarCierreCompra(id);
      setAviso("Fecha eliminada.");
      await cargar();
    } catch (err) {
      setError(mensajeError(err, "No se pudo eliminar la fecha."));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <AdminLayout>
      <AdminPageGate showLoading={showLoading} loadingMessage={loadingMessage} allowed={puede}>
        <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-4">
          <header className="flex min-w-0 items-start gap-3">
            <CalendarX2 className="mt-0.5 shrink-0 text-slate-500" size={22} aria-hidden="true" />
            <div className="min-w-0">
              <h1 className="break-words text-xl font-bold text-slate-950 sm:text-2xl dark:text-white">
                <ST>Días sin retiro</ST>
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <ST>Registrá feriados u otras fechas en las que no se recogerán pedidos. Si no hay fechas, el checkout no muestra este aviso.</ST>
              </p>
            </div>
          </header>

          <form onSubmit={agregar} className="grid min-w-0 grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 lg:grid-cols-2 dark:border-slate-700 dark:bg-slate-900">
            <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-800 dark:text-slate-100">
              <ST>Fecha</ST>
              <input
                type="date"
                min={hoyIso()}
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
                required
                className="box-border h-11 w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-800 dark:text-slate-100">
              <ST>Aplica a</ST>
              <select
                value={ubicacionId}
                onChange={(event) => setUbicacionId(event.target.value)}
                className="box-border h-11 w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value=""><ST>Todos los puntos de venta</ST></option>
                {puntos.map((punto) => (
                  <option key={punto.id} value={punto.id}>{punto.name}</option>
                ))}
              </select>
            </label>
            <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-slate-800 lg:col-span-2 dark:text-slate-100">
              <ST>Motivo</ST>
              <input
                type="text"
                maxLength={300}
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
                placeholder="Ej. Feriado nacional"
                className="box-border h-11 w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-normal dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>
            <div className="min-w-0 lg:col-span-2">
              <button
                type="submit"
                disabled={guardando}
                className="h-11 w-full rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-60 lg:w-auto dark:bg-white dark:text-slate-950"
              >
                <ST>Agregar fecha</ST>
              </button>
            </div>
          </form>

          {error ? <p className="break-words text-sm text-red-700 dark:text-red-300" role="alert"><ST>{error}</ST></p> : null}
          {aviso ? <p className="break-words text-sm text-emerald-800 dark:text-emerald-300" role="status"><ST>{aviso}</ST></p> : null}

          {fechas.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <ST>No hay fechas registradas.</ST>
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-900">
              {fechas.map((fila) => {
                const alcance = fila.ubicacionId
                  ? nombres.get(Number(fila.ubicacionId)) || `Punto ${fila.ubicacionId}`
                  : "Todos los puntos de venta";
                return (
                  <li key={fila.id} className="flex min-w-0 flex-col gap-3 px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-slate-950 dark:text-white">{etiquetaFecha(fila.fecha)}</p>
                      <p className="mt-0.5 break-words text-sm text-slate-700 dark:text-slate-300">
                        {fila.nota ? fila.nota : <ST>No se recogerán pedidos</ST>}
                      </p>
                      <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-slate-400">
                        {fila.ubicacionId ? alcance : <ST>Todos los puntos de venta</ST>}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => quitar(fila.id)}
                      disabled={guardando}
                      className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 disabled:opacity-60 lg:w-auto dark:border-slate-700 dark:text-slate-200"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      <ST>Eliminar</ST>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </AdminPageGate>
    </AdminLayout>
  );
}
