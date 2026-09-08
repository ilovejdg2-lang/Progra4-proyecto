import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  Globe,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";

import { AdminLayout } from "../layouts/AdminLayout";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import { AdminPaginacion } from "../../../Components/Admin/ui/AdminPaginacion";
import { UiSelect } from "../../../Components/ui/Select";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { useAdminListaFiltros } from "../../../hooks/useAdminListaFiltros";
import { useAdminPaginacion } from "../../../hooks/useAdminPaginacion";
import {
  actualizarSolicitudVisita,
  eliminarSolicitudVisita,
  obtenerSolicitudesVisitas,
} from "../../../services/visitasService";
import { tienePermiso, rolesDeUsuario } from "../../../lib/permisos";
import { getActiveSessionUser } from "../../../services/sessionService";
import { ST } from "../../../Components/T/ST";
import { useTraducir } from "../../../hooks/useTraducir";

const ESTADOS_VISITA = ["Pendiente", "En revisión", "Aprobada", "Rechazada", "Inactiva"];
const TIPOS_VISITANTE = ["Todos", "Nacional", "Internacional"];

const badgeColor = {
  Pendiente: "border border-amber-300 text-amber-800 bg-transparent",
  "En revisión": "border border-indigo-300 text-indigo-700 bg-transparent",
  Aprobada: "border border-emerald-300 text-emerald-700 bg-transparent",
  Aprobado: "border border-emerald-300 text-emerald-700 bg-transparent",
  Rechazada: "border border-rose-300 text-rose-700 bg-transparent",
  Rechazado: "border border-rose-300 text-rose-700 bg-transparent",
  Inactiva: "border border-slate-300 text-slate-500 bg-transparent",
};

function BadgeEstadoVisita({ estado }) {
  const est = String(estado || "Pendiente").trim();
  const cls = badgeColor[est] || "border border-slate-300 text-slate-700 bg-transparent";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      <ST>{est}</ST>
    </span>
  );
}

export function Visitas() {
  const [cargando, setCargando] = useState(true);
  const [solicitudes, setSolicitudes] = useState([]);
  const [errorGlobal, setErrorGlobal] = useState("");
  const [exitoGlobal, setExitoGlobal] = useState("");

  // Modales
  const [solicitudDetalle, setSolicitudDetalle] = useState(null);
  const [solicitudEdicion, setSolicitudEdicion] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Form edicion estado
  const [nuevoEstado, setNuevoEstado] = useState("Pendiente");
  const [observacionesAdmin, setObservacionesAdmin] = useState("");

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const user = getActiveSessionUser();
  const roles = rolesDeUsuario(user);
  const puedeAdministrar =
    tienePermiso(roles, "administrar_solicitudes_visitantes") ||
    tienePermiso(roles, "actualizar_visitas");
  const puedeInactivar =
    tienePermiso(roles, "inactivar_visita") ||
    tienePermiso(roles, "administrar_solicitudes_visitantes");

  const cargarSolicitudes = useCallback(async () => {
    setCargando(true);
    setErrorGlobal("");
    try {
      const data = await obtenerSolicitudesVisitas({
        estado: filtroEstado,
        tipoVisitante: filtroTipo === "Todos" ? "" : filtroTipo,
        fechaDesde,
        fechaHasta,
        busqueda,
      });
      setSolicitudes(data);
    } catch (err) {
      setErrorGlobal(err.message || "Error al cargar las solicitudes de visitas.");
    } finally {
      setCargando(false);
    }
  }, [filtroEstado, filtroTipo, fechaDesde, fechaHasta, busqueda]);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]);

  const abrirEdicion = (item) => {
    setSolicitudEdicion(item);
    setNuevoEstado(item.estado || "Pendiente");
    setObservacionesAdmin(item.observacionesAdmin || "");
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (!solicitudEdicion) return;

    if (nuevoEstado.toLowerCase() === "rechazada" && !observacionesAdmin.trim()) {
      setErrorGlobal("Debe agregar una observación o motivo cuando la solicitud sea rechazada.");
      return;
    }

    setGuardando(true);
    setErrorGlobal("");
    try {
      await actualizarSolicitudVisita(solicitudEdicion.id, {
        Estado: nuevoEstado,
        ObservacionesAdmin: observacionesAdmin,
      });
      setExitoGlobal("Solicitud actualizada correctamente.");
      setSolicitudEdicion(null);
      await cargarSolicitudes();
    } catch (err) {
      setErrorGlobal(err.message || "No se pudo actualizar la solicitud.");
    } finally {
      setGuardando(false);
    }
  };

  const inactivarSolicitud = async (item) => {
    if (!window.confirm(`¿Inactivar la solicitud de visita de ${item.encargadoNombre}?`)) return;

    try {
      await eliminarSolicitudVisita(item.id);
      setExitoGlobal("Solicitud de visita inactivada correctamente.");
      await cargarSolicitudes();
    } catch (err) {
      setErrorGlobal(err.message || "No se pudo inactivar la solicitud.");
    }
  };

  const { showLoading, loadingMessage } = useAdminPageGate("/admin/visitas", !cargando);

  return (
    <AdminPageGate showLoading={showLoading} loadingMessage={loadingMessage}>
      <AdminLayout titulo="Visitas Grupales">
      <div className="space-y-6">
        {/* Banner header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
              <ST>Solicitudes de Visitas Grupales</ST>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              <ST>Gestión y evaluación de visitas programadas en la finca experimental Café-UNA.</ST>
            </p>
          </div>
          <button
            type="button"
            onClick={cargarSolicitudes}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw className="size-3.5" />
            <ST>Actualizar</ST>
          </button>
        </div>

        {errorGlobal && (
          <div className="rounded-xl bg-red-50 p-4 text-xs text-red-700 border border-red-200">
            {errorGlobal}
          </div>
        )}
        {exitoGlobal && (
          <div className="rounded-xl bg-emerald-50 p-4 text-xs text-emerald-800 border border-emerald-200">
            {exitoGlobal}
          </div>
        )}

        {/* Toolbar & Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-3.5 py-2 text-xs text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
                placeholder="Buscar por encargado, cédula, ciudad, país..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <select
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos los Estados</option>
              {ESTADOS_VISITA.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            <select
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-slate-400"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              {TIPOS_VISITANTE.map((tp) => (
                <option key={tp} value={tp}>
                  {tp}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">ID / Fecha Sol.</th>
                  <th className="px-4 py-3">Encargado</th>
                  <th className="px-4 py-3">Grupo / Procedencia</th>
                  <th className="px-4 py-3">Fecha Visita</th>
                  <th className="px-4 py-3 text-center">Cant.</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cargando ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      <ST>Cargando solicitudes de visita...</ST>
                    </td>
                  </tr>
                ) : solicitudes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      <ST>No se encontraron solicitudes de visita grupal.</ST>
                    </td>
                  </tr>
                ) : (
                  solicitudes.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-900">#{item.id}</span>
                        <div className="text-[10px] text-slate-400">{item.fechaSolicitud}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div>{item.encargadoNombre}</div>
                        <div className="text-[10px] text-slate-500">{item.encargadoEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{item.tipoGrupo} {item.tipoGrupoOtro ? `(${item.tipoGrupoOtro})` : ''}</div>
                        <div className="text-[10px] text-slate-500">
                          {item.ciudadProvincia}
                          {item.tipoVisitante === "Internacional" ? `, ${item.paisProcedencia}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{item.fechaVisita}</div>
                        <div className="text-[10px] text-slate-500">{item.horaPreferida}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-900">
                        {item.cantidadVisitantes}
                      </td>
                      <td className="px-4 py-3">
                        <BadgeEstadoVisita estado={item.estado} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSolicitudDetalle(item)}
                            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            title="Ver detalles"
                          >
                            <Eye className="size-4" />
                          </button>

                          {puedeAdministrar && item.estado !== "Inactiva" && (
                            <button
                              type="button"
                              onClick={() => abrirEdicion(item)}
                              className="rounded-full p-1.5 text-indigo-600 hover:bg-indigo-50"
                              title="Cambiar estado"
                            >
                              <Pencil className="size-4" />
                            </button>
                          )}

                          {puedeInactivar && item.estado !== "Inactiva" && (
                            <button
                              type="button"
                              onClick={() => inactivarSolicitud(item)}
                              className="rounded-full p-1.5 text-rose-600 hover:bg-rose-50"
                              title="Inactivar registro"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Detalles */}
        {solicitudDetalle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">
                  <ST>Detalle de Visita Grupal #{solicitudDetalle.id}</ST>
                </h3>
                <button
                  type="button"
                  onClick={() => setSolicitudDetalle(null)}
                  className="rounded-full p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs text-slate-700">
                <div className="grid gap-3 sm:grid-cols-2 rounded-xl bg-slate-50 p-4 border border-slate-200">
                  <div>
                    <span className="font-semibold text-slate-500"><ST>Encargado:</ST></span>
                    <p className="font-bold text-slate-900">{solicitudDetalle.encargadoNombre}</p>
                    <p>{solicitudDetalle.encargadoIdentificacion}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500"><ST>Contacto:</ST></span>
                    <p>{solicitudDetalle.encargadoEmail}</p>
                    <p>{solicitudDetalle.encargadoTelefono}</p>
                    {solicitudDetalle.encargadoInstitucion && (
                      <p className="text-slate-500">{solicitudDetalle.encargadoInstitucion}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className="font-semibold text-slate-500"><ST>Procedencia:</ST></span>
                    <p>{solicitudDetalle.tipoVisitante} ({solicitudDetalle.paisProcedencia || "Costa Rica"})</p>
                    <p>{solicitudDetalle.ciudadProvincia}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500"><ST>Grupo:</ST></span>
                    <p>{solicitudDetalle.tipoGrupo} {solicitudDetalle.tipoGrupoOtro ? `(${solicitudDetalle.tipoGrupoOtro})` : ''}</p>
                    <p><strong><ST>Cantidad:</ST></strong> {solicitudDetalle.cantidadVisitantes} personas</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 rounded-xl border border-slate-200 p-4">
                  <div>
                    <span className="font-semibold text-slate-500"><ST>Fecha & Horario:</ST></span>
                    <p className="font-bold text-slate-900">{solicitudDetalle.fechaVisita}</p>
                    <p>{solicitudDetalle.horaPreferida}</p>
                    {solicitudDetalle.fechaAlternativa && (
                      <p className="text-slate-500">Alt: {solicitudDetalle.fechaAlternativa}</p>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500"><ST>Área & Duración:</ST></span>
                    <p>{solicitudDetalle.areaVisita}</p>
                    <p>{solicitudDetalle.duracionEstimada}</p>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-500"><ST>Motivo:</ST></span>
                  <p className="font-medium text-slate-900">{solicitudDetalle.motivoVisita} {solicitudDetalle.motivoOtro ? `(${solicitudDetalle.motivoOtro})` : ''}</p>
                </div>

                <div className="rounded-xl bg-emerald-50/60 p-3 border border-emerald-200 text-emerald-900 space-y-1">
                  <span className="font-bold text-emerald-950 uppercase tracking-wider text-[10px]"><ST>Requerimientos especiales</ST></span>
                  <p>• Accesibilidad física: {solicitudDetalle.requiereAccesibilidad ? "Sí" : "No"}</p>
                  <p>• Parqueo bus/buseta: {solicitudDetalle.requiereParqueoBus ? "Sí" : "No"}</p>
                  <p>• Guía institucional: {solicitudDetalle.requiereGuia ? "Sí" : "No"}</p>
                </div>

                {solicitudDetalle.observaciones && (
                  <div>
                    <span className="font-semibold text-slate-500"><ST>Observaciones del Encargado:</ST></span>
                    <p className="italic text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-1">{solicitudDetalle.observaciones}</p>
                  </div>
                )}

                {solicitudDetalle.observacionesAdmin && (
                  <div>
                    <span className="font-semibold text-slate-500"><ST>Observaciones del Administrador:</ST></span>
                    <p className="font-medium text-slate-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mt-1">{solicitudDetalle.observacionesAdmin}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSolicitudDetalle(null)}
                  className="rounded-full bg-slate-950 px-5 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                >
                  <ST>Cerrar</ST>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Estado */}
        {solicitudEdicion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  <ST>Actualizar Estado de Visita #{solicitudEdicion.id}</ST>
                </h3>
                <button
                  type="button"
                  onClick={() => setSolicitudEdicion(null)}
                  className="rounded-full p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={guardarEdicion} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    <ST>Estado de la solicitud</ST>
                  </label>
                  <select
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-slate-400"
                    value={nuevoEstado}
                    onChange={(e) => setNuevoEstado(e.target.value)}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En revisión">En revisión</option>
                    <option value="Aprobada">Aprobada</option>
                    <option value="Rechazada">Rechazada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    <ST>Observaciones del Administrador / Motivo</ST>
                  </label>
                  <textarea
                    rows={3}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-400"
                    placeholder="Instrucciones para la visita o motivo si es rechazada..."
                    value={observacionesAdmin}
                    onChange={(e) => setObservacionesAdmin(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    <ST>Este mensaje será enviado por correo electrónico al encargado.</ST>
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSolicitudEdicion(null)}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <ST>Cancelar</ST>
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="rounded-full bg-slate-950 px-5 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    {guardando ? <ST>Guardando...</ST> : <ST>Guardar Cambios</ST>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
    </AdminPageGate>
  );
}

export default Visitas;

