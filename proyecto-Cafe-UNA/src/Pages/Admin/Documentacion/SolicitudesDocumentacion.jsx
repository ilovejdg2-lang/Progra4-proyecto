import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eye,
  FileLock2,
  FileText,
  Filter,
  Mail,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  UploadCloud,
  User,
  X,
  XCircle,
} from "lucide-react";

import { AdminLayout } from "../layouts/AdminLayout";
import { createPortal } from "react-dom";
import PageLoading from "../../../Components/PageLoading/PageLoading";
import { UiSelect } from "../../../Components/ui/Select";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import {
  atenderSolicitudDocumentoAdmin,
  obtenerSolicitudesDocumentosAdmin,
  obtenerUrlArchivoSolicitudAdmin,
  obtenerUrlDescargaPorToken,
} from "../../../services/documentosService";
import { ST } from "../../../Components/T/ST";
import { useTraducir } from "../../../hooks/useTraducir";
import "../../Voluntariado/SolicitarVoluntariado.css";
import "./Documentos.css";

export default function SolicitudesDocumentacion() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroBuscar, setFiltroBuscar] = useState("");

  // Modal para atender solicitud
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [tipoAccion, setTipoAccion] = useState("aprobar"); // 'aprobar' | 'rechazar'
  const [respuestaAdmin, setRespuestaAdmin] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [errorModal, setErrorModal] = useState("");

  // Token copiado feedback
  const [copiadoId, setCopiadoId] = useState(null);

  const cargarSolicitudes = useCallback(async () => {
    try {
      setCargando(true);
      setError("");
      const data = await obtenerSolicitudesDocumentosAdmin(filtroEstado);
      setSolicitudes(data);
    } catch (err) {
      console.error("Error al cargar solicitudes de documentos:", err);
      setError("No se pudieron cargar las solicitudes de acceso a documentos.");
    } finally {
      setCargando(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]);

  const abrirModalAtencion = (sol, accion) => {
    setSolicitudSeleccionada(sol);
    setTipoAccion(accion);
    setRespuestaAdmin(sol.RespuestaAdmin || sol.respuestaAdmin || "");
    setErrorModal("");
  };

  const handleResolverSolicitud = async (e) => {
    e.preventDefault();
    if (!solicitudSeleccionada) return;

    try {
      setProcesando(true);
      setErrorModal("");
      const id = solicitudSeleccionada.Id || solicitudSeleccionada.id;
      await atenderSolicitudDocumentoAdmin(id, {
        estado: tipoAccion === "aprobar" ? "Aprobada" : "Rechazada",
        respuestaAdmin: respuestaAdmin.trim(),
      });

      setMensajeExito(
        `Solicitud ${tipoAccion === "aprobar" ? "aprobada" : "rechazada"} exitosamente.`,
      );
      setSolicitudSeleccionada(null);
      await cargarSolicitudes();
    } catch (err) {
      console.error("Error al procesar solicitud:", err);
      setErrorModal(err?.message || "No se pudo procesar la solicitud.");
    } finally {
      setProcesando(false);
    }
  };

  const copiarEnlaceDescarga = (token, id) => {
    const url = obtenerUrlDescargaPorToken(token);
    navigator.clipboard.writeText(url);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 3000);
  };

  // Filtrar localmente por texto de búsqueda
  const solicitudesFiltradas = solicitudes.filter((s) => {
    if (!filtroBuscar.trim()) return true;
    const term = filtroBuscar.toLowerCase();
    const nombre = String(s.NombreSolicitante || s.nombreSolicitante || "").toLowerCase();
    const correo = String(s.CorreoSolicitante || s.correoSolicitante || "").toLowerCase();
    const docTitulo = String(s.DocumentoTitulo || s.documentoTitulo || "").toLowerCase();
    const institucion = String(s.Institucion || s.institucion || "").toLowerCase();
    return (
      nombre.includes(term) ||
      correo.includes(term) ||
      docTitulo.includes(term) ||
      institucion.includes(term)
    );
  });

  const { showLoading, loadingMessage } = useAdminPageGate("/admin/documentacion/solicitudes", !cargando);
  if (showLoading) {
    return (
      <AdminLayout>
        <PageLoading message={loadingMessage || "Cargando solicitudes..."} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-docs-container">
        {/* Header */}
        <div className="admin-docs-header">
          <div>
            <span className="badge--admin-docs">
              <ShieldCheck size={14} className="mr-1.5" />
              <ST>Control de Acceso</ST>
            </span>
            <h1 className="admin-docs-title">
              <ST>Solicitudes de Documentación Privada</ST>
            </h1>
            <p className="admin-docs-subtitle">
              <ST>
                Revise las peticiones de los usuarios para acceder a documentos institucionales restringidos y autorice descargas seguras.
              </ST>
            </p>
          </div>
        </div>

        {mensajeExito ? (
          <div className="admin-docs-alert--success">
            <CheckCircle2 size={18} />
            <span>{mensajeExito}</span>
            <button
              type="button"
              className="ml-auto text-emerald-700 hover:text-emerald-900"
              onClick={() => setMensajeExito("")}
            >
              <X size={16} />
            </button>
          </div>
        ) : null}

        {/* Panel y Filtros */}
        <div className="admin-docs-panel">
          <div className="admin-docs-filter-bar">
            {/* Buscador */}
            <div className="admin-docs-search">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por solicitante, correo o documento..."
                value={filtroBuscar}
                onChange={(e) => setFiltroBuscar(e.target.value)}
              />
              {filtroBuscar ? (
                <button type="button" onClick={() => setFiltroBuscar("")}>
                  <X size={14} />
                </button>
              ) : null}
            </div>

            {/* Selector de Estado */}
            <UiSelect
              ariaLabel="Estado"
              value={filtroEstado}
              onChange={setFiltroEstado}
              options={[
                { value: "todos", label: "Todos los estados" },
                { value: "Pendiente", label: "Pendientes" },
                { value: "Aprobada", label: "Aprobadas" },
                { value: "Rechazada", label: "Rechazadas" },
              ]}
            />
          </div>

          {cargando ? (
            <div className="admin-docs-loading">
              <span className="spinner-sm" />
              <span>Cargando solicitudes...</span>
            </div>
          ) : error ? (
            <div className="repositorio-error-card">
              <AlertCircle size={24} className="text-rose-500" />
              <p>{error}</p>
              <button
                type="button"
                className="btn-primario-admin"
                onClick={cargarSolicitudes}
              >
                Reintentar
              </button>
            </div>
          ) : solicitudesFiltradas.length === 0 ? (
            <div className="admin-docs-empty">
              <FileLock2 size={44} className="text-slate-300" />
              <h4>No hay solicitudes registradas</h4>
              <p>Las solicitudes que envíen los usuarios desde la página pública se listarán aquí.</p>
            </div>
          ) : (
            <div className="admin-docs-table-wrapper">
              <table className="admin-docs-table">
                <thead>
                  <tr>
                    <th>Solicitante</th>
                    <th>Documento Solicitado</th>
                    <th>Justificación / Motivo</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudesFiltradas.map((sol) => {
                    const id = sol.Id || sol.id;
                    const estado = sol.Estado || sol.estado;
                    const token = sol.TokenDescarga || sol.tokenDescarga;
                    const tokenExpira = sol.TokenExpira || sol.tokenExpira;
                    const esPendiente = estado === "Pendiente";
                    const esAprobada = estado === "Aprobada";
                    const esRechazada = estado === "Rechazada";

                    return (
                      <tr key={id}>
                        <td>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {sol.NombreSolicitante || sol.nombreSolicitante}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                              <Mail size={12} />
                              <span>{sol.CorreoSolicitante || sol.correoSolicitante}</span>
                            </div>
                            {(sol.Institucion || sol.institucion) ? (
                              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                                <Building2 size={11} />
                                <span>{sol.Institucion || sol.institucion}</span>
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <div className="font-medium text-slate-900 max-w-xs">
                            {sol.DocumentoTitulo || sol.documentoTitulo || `Doc #${sol.DocumentoId || sol.documentoId}`}
                          </div>
                          {(sol.NombreArchivo || sol.nombreArchivo) ? (
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 mt-1">
                              <UploadCloud size={12} />
                              <span className="truncate max-w-[200px]" title={sol.NombreOriginal || sol.nombreOriginal}>
                                {sol.NombreOriginal || sol.nombreOriginal}
                              </span>
                            </div>
                          ) : null}
                          {(sol.PublicadoDocumentoId || sol.publicadoDocumentoId) ? (
                            <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 ml-1">
                              Publicado en catálogo
                            </span>
                          ) : null}
                        </td>
                        <td>
                          <p className="text-xs text-slate-600 max-w-sm line-clamp-2" title={sol.Motivo || sol.motivo}>
                            {sol.Motivo || sol.motivo}
                          </p>
                          {(sol.RespuestaAdmin || sol.respuestaAdmin) ? (
                            <span className="block text-[11px] text-slate-400 mt-1 italic">
                              Nota: {sol.RespuestaAdmin || sol.respuestaAdmin}
                            </span>
                          ) : null}
                        </td>
                        <td>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {sol.CreatedAt || sol.createdAt
                              ? new Date(sol.CreatedAt || sol.createdAt).toLocaleDateString("es-CR")
                              : "—"}
                          </span>
                        </td>
                        <td>
                          {esPendiente ? (
                            <span className="badge-priv-cell bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock size={12} />
                              <span>Pendiente</span>
                            </span>
                          ) : esAprobada ? (
                            <span className="badge-priv-cell bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check size={12} />
                              <span>Aprobada</span>
                            </span>
                          ) : (
                            <span className="badge-priv-cell bg-rose-50 text-rose-700 border border-rose-200">
                              <X size={12} />
                              <span>Rechazada</span>
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="admin-actions-cell">
                            {(sol.NombreArchivo || sol.nombreArchivo) ? (
                              <>
                                <a
                                  href={obtenerUrlArchivoSolicitudAdmin(id, true)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="action-btn"
                                  title="Previsualizar archivo aportado en línea"
                                >
                                  <Eye size={15} />
                                </a>
                                <a
                                  href={obtenerUrlArchivoSolicitudAdmin(id, false)}
                                  className="action-btn"
                                  title="Descargar archivo aportado"
                                >
                                  <Download size={15} />
                                </a>
                              </>
                            ) : null}

                            {token ? (
                              <button
                                type="button"
                                className="action-btn"
                                title="Copiar enlace de descarga seguro"
                                onClick={() => copiarEnlaceDescarga(token, id)}
                              >
                                {copiadoId === id ? (
                                  <Check size={14} className="text-emerald-600" />
                                ) : (
                                  <Copy size={14} />
                                )}
                              </button>
                            ) : null}

                            {esPendiente ? (
                              <>
                                <button
                                  type="button"
                                  className="action-btn text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200"
                                  title="Aprobar solicitud"
                                  onClick={() => abrirModalAtencion(sol, "aprobar")}
                                >
                                  <Check size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="action-btn text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                                  title="Rechazar solicitud"
                                  onClick={() => abrirModalAtencion(sol, "rechazar")}
                                >
                                  <X size={15} />
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className="action-btn"
                                title="Modificar resolución"
                                onClick={() => abrirModalAtencion(sol, esAprobada ? "aprobar" : "rechazar")}
                              >
                                <FileText size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Resolución */}
      {solicitudSeleccionada ? (
        createPortal(
        <div className="repositorio-modal-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setSolicitudSeleccionada(null); }}>
          <div className="repositorio-modal-container max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="repositorio-modal-header">
              <h3>
                {tipoAccion === "aprobar" ? "Aprobar Solicitud de Acceso" : "Rechazar Solicitud de Acceso"}
              </h3>
              <button
                type="button"
                className="repositorio-modal-close"
                onClick={() => setSolicitudSeleccionada(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleResolverSolicitud} className="repositorio-modal-form">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div>
                  <strong>Solicitante:</strong>{" "}
                  {solicitudSeleccionada.NombreSolicitante || solicitudSeleccionada.nombreSolicitante} (
                  {solicitudSeleccionada.CorreoSolicitante || solicitudSeleccionada.correoSolicitante})
                </div>
                <div>
                  <strong>Documento:</strong>{" "}
                  {solicitudSeleccionada.DocumentoTitulo || solicitudSeleccionada.documentoTitulo}
                </div>
              </div>

              {(solicitudSeleccionada.NombreArchivo || solicitudSeleccionada.nombreArchivo) ? (
                <div className="text-xs text-blue-800 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="font-semibold flex items-center gap-1.5 mb-1">
                    <UploadCloud size={14} />
                    <span>Aporte de archivo adjunto</span>
                  </div>
                  <span>
                    El usuario envió el archivo <strong>{solicitudSeleccionada.NombreOriginal || solicitudSeleccionada.nombreOriginal}</strong>. Al aprobar la solicitud, este archivo se publicará automáticamente en el catálogo y quedará visible para todos los usuarios en la página principal y el repositorio.
                  </span>
                </div>
              ) : tipoAccion === "aprobar" ? (
                <div className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                  Al aprobar esta solicitud se generará un enlace temporal seguro de descarga con vigencia de 48 horas.
                </div>
              ) : (
                <div className="text-xs text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200">
                  La solicitud quedará en estado Rechazada. Puede ingresar una nota aclaratoria para el registro.
                </div>
              )}

              <div className="campo-grupo">
                <label htmlFor="res-admin-nota">
                  Nota o respuesta administrativa (opcional)
                </label>
                <textarea
                  id="res-admin-nota"
                  rows={3}
                  placeholder="Ej. Acceso autorizado para fines académicos..."
                  value={respuestaAdmin}
                  onChange={(e) => setRespuestaAdmin(e.target.value)}
                />
              </div>

              {errorModal ? (
                <div className="aviso-error-banner">
                  <AlertCircle size={16} />
                  <span>{errorModal}</span>
                </div>
              ) : null}

              <div className="repositorio-modal-actions">
                <button
                  type="button"
                  className="btn-secundario-admin"
                  onClick={() => setSolicitudSeleccionada(null)}
                  disabled={procesando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={tipoAccion === "aprobar" ? "btn-primario-admin" : "btn-primario-admin bg-rose-600 hover:bg-rose-700"}
                  disabled={procesando}
                >
                  {procesando ? (
                    <span className="spinner-sm" />
                  ) : tipoAccion === "aprobar" ? (
                    <Check size={16} />
                  ) : (
                    <X size={16} />
                  )}
                  <span>{tipoAccion === "aprobar" ? "Confirmar Aprobación" : "Confirmar Rechazo"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
        )
      ) : null}
    </AdminLayout>
  );
}
