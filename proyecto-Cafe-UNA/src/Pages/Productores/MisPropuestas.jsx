import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Eye, Pencil, Trash2, XCircle } from "lucide-react";

import {
  AdminModal,
  AdminModalBody,
  AdminModalHeader,
  adminBtnPrimary,
  adminBtnVoluntariadoCancel,
} from "../../Components/Admin/ui/AdminModal";
import { ImageLightbox } from "../../Components/ImageLightbox/ImageLightbox";
import { PerfilClienteLayout } from "../../Components/Perfil/PerfilClienteLayout";
import { ST } from "../../Components/T/ST";
import { UiSelect } from "../../Components/ui/Select";
import { rolesDeUsuario, tienePermiso } from "../../lib/permisos";
import { formatearFechaPropuesta, urlImagenPublica } from "../../lib/propuestaProductor";
import { obtenerFooter } from "../../services/informacionService";
import {
  cancelarSolicitudEdicionMiPropuesta,
  cancelarSolicitudEliminacionMiPropuesta,
  obtenerBlobImagenPropuesta,
  obtenerMiPropuesta,
  obtenerMisPropuestas,
} from "../../services/propuestasProductoresService";
import { getActiveSessionUser, SESSION_UPDATED_EVENT } from "../../services/sessionService";
import { DetallePropuestaSecciones, SeccionRevision } from "./DetallePropuesta";
import { ModalEditarMiPropuesta } from "./ModalEditarMiPropuesta";
import { ModalEliminarMiPropuesta } from "./ModalEliminarMiPropuesta";

export function rutaMisPropuestas(user) {
  const roles = rolesDeUsuario(user);
  if (tienePermiso(roles, "ver_panel_administrativo")) return "/admin/mis-propuestas";
  return "/perfil/propuestas";
}

function colorEstado(estado) {
  const valor = String(estado || "").toLowerCase();
  if (valor.includes("pendiente")) return "text-amber-800";
  if (valor.includes("revisi")) return "text-sky-800";
  if (valor.includes("aprob")) return "text-emerald-800";
  if (valor.includes("rechaz")) return "text-rose-800";
  if (valor.includes("elimin")) return "text-slate-500";
  return "text-slate-700";
}

function ImagenPropuesta({ nombre, imagenUrl, alt }) {
  const [src, setSrc] = useState("");
  const [abierta, setAbierta] = useState(false);
  useEffect(() => {
    const directa = urlImagenPublica(imagenUrl);
    if (/^https?:\/\//i.test(directa)) {
      setSrc(directa);
      return undefined;
    }
    if (!nombre) return undefined;
    let activo = true;
    let objectUrl = "";
    obtenerBlobImagenPropuesta(nombre)
      .then((blob) => {
        if (!(blob instanceof Blob) || !activo) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (activo) setSrc("");
      });
    return () => {
      activo = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [nombre, imagenUrl]);
  if (!src) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        className="h-28 w-28 overflow-hidden rounded-2xl border border-slate-200 p-0"
        aria-label="Ver imagen más grande"
      >
        <img src={src} alt={alt || ""} className="h-full w-full cursor-zoom-in object-cover" />
      </button>
      <ImageLightbox images={[src]} index={abierta ? 0 : -1} onClose={() => setAbierta(false)} alt={alt} />
    </>
  );
}

export function MisPropuestasContent({ variant = "cliente", propuestaId = "" }) {
  const navigate = useNavigate();
  const esAdmin = variant === "admin";
  const perfilVolver = esAdmin ? "/admin/perfil" : "/perfil";
  const [usuario, setUsuario] = useState(() => getActiveSessionUser());
  const [lista, setLista] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [estado, setEstado] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [correoInstitucional, setCorreoInstitucional] = useState("");

  const [modalEditar, setModalEditar] = useState({ open: false, propuesta: null, esSolicitud: false });
  const [modalEliminar, setModalEliminar] = useState({ open: false, propuesta: null, esSolicitudBaja: false });
  const [accionEnCurso, setAccionEnCurso] = useState("");

  useEffect(() => {
    const sync = () => setUsuario(getActiveSessionUser());
    window.addEventListener(SESSION_UPDATED_EVENT, sync);
    return () => window.removeEventListener(SESSION_UPDATED_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!usuario) {
      sessionStorage.setItem("postLoginRedirect", esAdmin ? "/admin/mis-propuestas" : "/perfil/propuestas");
      navigate({ to: "/login" });
    }
  }, [usuario, navigate, esAdmin]);

  useEffect(() => {
    let activo = true;
    obtenerFooter()
      .then((footer) => {
        if (activo) setCorreoInstitucional(String(footer?.correo || "").trim());
      })
      .catch(() => {
        if (activo) setCorreoInstitucional("");
      });
    return () => {
      activo = false;
    };
  }, []);

  const cargarLista = useCallback(async () => {
    if (!usuario) return;
    setCargando(true);
    setError("");
    try {
      const items = await obtenerMisPropuestas();
      setLista(items);
    } catch (err) {
      setError(err?.message || "No se pudieron cargar tus propuestas.");
    } finally {
      setCargando(false);
    }
  }, [usuario]);

  useEffect(() => {
    cargarLista();
  }, [cargarLista]);

  useEffect(() => {
    if (!propuestaId || !usuario) return undefined;
    let activo = true;
    obtenerMiPropuesta(propuestaId)
      .then((item) => {
        if (activo) setDetalle(item);
      })
      .catch((err) => {
        if (activo) setError(err?.message || "No se pudo abrir la propuesta.");
      });
    return () => {
      activo = false;
    };
  }, [propuestaId, usuario]);

  const visibles = estado === "todos" ? lista : lista.filter((item) => item.estado === estado);

  const abrir = async (id) => {
    try {
      setDetalle(await obtenerMiPropuesta(id));
    } catch (err) {
      setError(err?.message || "No se pudo abrir la propuesta.");
    }
  };

  const abrirEdicion = async (id, esSolicitud) => {
    if (accionEnCurso) return;
    setAccionEnCurso(`abrir-edicion-${id}`);
    setError("");
    try {
      const completa = await obtenerMiPropuesta(id);
      setModalEditar({ open: true, propuesta: completa, esSolicitud: Boolean(esSolicitud) });
    } catch (err) {
      setError(err?.message || "No se pudo cargar la propuesta para editar.");
    } finally {
      setAccionEnCurso("");
    }
  };

  const handleCancelarEdicion = async (id) => {
    if (accionEnCurso) return;
    setAccionEnCurso(`cancelar-edicion-${id}`);
    try {
      await cancelarSolicitudEdicionMiPropuesta(id);
      await cargarLista();
      if (detalle && String(detalle.id) === String(id)) {
        setDetalle(await obtenerMiPropuesta(id));
      }
    } catch (err) {
      setError(err?.message || "No se pudo cancelar la solicitud de edición.");
    } finally {
      setAccionEnCurso("");
    }
  };

  const handleCancelarBaja = async (id) => {
    if (accionEnCurso) return;
    setAccionEnCurso(`cancelar-baja-${id}`);
    try {
      await cancelarSolicitudEliminacionMiPropuesta(id);
      await cargarLista();
      if (detalle && String(detalle.id) === String(id)) {
        setDetalle(await obtenerMiPropuesta(id));
      }
    } catch (err) {
      setError(err?.message || "No se pudo cancelar la solicitud de baja.");
    } finally {
      setAccionEnCurso("");
    }
  };

  const onGuardadoExitoso = async (actualizada) => {
    await cargarLista();
    if (actualizada?.id) {
      try {
        setDetalle(await obtenerMiPropuesta(actualizada.id));
      } catch {
        setDetalle(actualizada);
      }
    }
  };

  const onEliminadoExitoso = async () => {
    setDetalle(null);
    await cargarLista();
  };

  return (
    <main className={esAdmin ? "mx-auto max-w-3xl space-y-5" : "mx-auto max-w-3xl space-y-5 px-4 py-8"}>
      <Link
        to={perfilVolver}
        className="inline-flex min-h-[var(--control-height)] items-center gap-2 text-[var(--text-body)] font-semibold text-slate-700"
      >
        <ArrowLeft className="size-4" /> <ST>Volver al perfil</ST>
      </Link>
      <header>
        <h1 className="text-[var(--text-title)] font-semibold text-slate-950"><ST>Mis propuestas</ST></h1>
        <p className="mt-1 text-[var(--text-body)] text-slate-500">
          <ST>Consultá el estado de las propuestas de tu emprendimiento y gestioná sus datos.</ST>
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <label className="grid max-w-sm gap-1 text-[var(--text-body)]">
          <span className="font-medium text-slate-700"><ST>Estado</ST></span>
          <UiSelect
            ariaLabel="Estado"
            value={estado}
            onChange={setEstado}
            options={[
              { value: "todos", label: "Todos" },
              { value: "Pendiente", label: "Pendiente" },
              { value: "En revisión", label: "En revisión" },
              { value: "Aprobada", label: "Aprobada" },
              { value: "Rechazada", label: "Rechazada" },
            ]}
          />
        </label>
      </section>

      {error ? <p className="text-[var(--text-body)] text-rose-700"><ST>{error}</ST></p> : null}
      {cargando ? <p className="text-[var(--text-body)] text-slate-500"><ST>Cargando propuestas...</ST></p> : null}
      {!cargando && visibles.length === 0 ? (
        <p className="text-[var(--text-body)] text-slate-500"><ST>No se encontraron propuestas registradas.</ST></p>
      ) : null}

      <ul className="grid gap-3">
        {visibles.map((item) => (
          <li key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-[var(--text-subtitle)] font-semibold text-slate-950">{item.nombre}</p>
                <p className="text-[var(--text-body)] text-slate-600">
                  #{item.id}
                  {" · "}
                  {formatearFechaPropuesta(item.fechaEnvio) || <ST>Sin fecha</ST>}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`text-[var(--text-body)] font-semibold ${colorEstado(item.estado)}`}>
                    <ST>{item.estado}</ST>
                  </p>
                  {item.solicitudEdicion ? (
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                      <ST>Solicitud de edición en revisión</ST>
                    </span>
                  ) : null}
                  {item.solicitudEliminacion ? (
                    <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
                      <ST>Solicitud de baja en revisión</ST>
                    </span>
                  ) : null}
                </div>
                {item.estado === "Rechazada" && item.motivoRechazo ? (
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-800"><ST>Motivo:</ST> </span>
                    {item.motivoRechazo}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => abrir(item.id)}
                  className="inline-flex min-h-[var(--control-height)] items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  <Eye className="size-3.5" />
                  <ST>Ver detalle</ST>
                </button>

                {item.estado !== "Aprobada" && item.estado !== "Eliminada" ? (
                  <>
                    <button
                      type="button"
                      disabled={Boolean(accionEnCurso)}
                      onClick={() => abrirEdicion(item.id, false)}
                      className="inline-flex min-h-[var(--control-height)] items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      <Pencil className="size-3.5" />
                      <ST>Editar</ST>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalEliminar({ open: true, propuesta: item, esSolicitudBaja: false })}
                      className="inline-flex min-h-[var(--control-height)] items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                      <Trash2 className="size-3.5" />
                      <ST>Eliminar</ST>
                    </button>
                  </>
                ) : null}

                {item.estado === "Aprobada" ? (
                  <>
                    {!item.solicitudEdicion ? (
                      <button
                        type="button"
                        disabled={Boolean(accionEnCurso)}
                        onClick={() => abrirEdicion(item.id, true)}
                        className="inline-flex min-h-[var(--control-height)] items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3.5 text-xs font-semibold text-sky-800 transition hover:bg-sky-100 disabled:opacity-60"
                      >
                        <Pencil className="size-3.5" />
                        <ST>Solicitar edición</ST>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={accionEnCurso === `cancelar-edicion-${item.id}`}
                        onClick={() => handleCancelarEdicion(item.id)}
                        className="inline-flex min-h-[var(--control-height)] items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        <XCircle className="size-3.5" />
                        <ST>Cancelar edición</ST>
                      </button>
                    )}

                    {!item.solicitudEliminacion ? (
                      <button
                        type="button"
                        onClick={() => setModalEliminar({ open: true, propuesta: item, esSolicitudBaja: true })}
                        className="inline-flex min-h-[var(--control-height)] items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 text-xs font-semibold text-rose-800 transition hover:bg-rose-100"
                      >
                        <Trash2 className="size-3.5" />
                        <ST>Solicitar baja</ST>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={accionEnCurso === `cancelar-baja-${item.id}`}
                        onClick={() => handleCancelarBaja(item.id)}
                        className="inline-flex min-h-[var(--control-height)] items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        <XCircle className="size-3.5" />
                        <ST>Cancelar baja</ST>
                      </button>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {detalle ? (
        <AdminModal open onClose={() => setDetalle(null)} maxWidth="max-w-2xl">
          <AdminModalHeader onClose={() => setDetalle(null)}>
            <ST>Detalle de la propuesta</ST>
          </AdminModalHeader>
          <AdminModalBody>
            <header className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold text-slate-950">{detalle.nombre}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  <ST>Propuesta</ST> #{detalle.id}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`text-sm font-semibold ${colorEstado(detalle.estado)}`}>
                    <ST>{detalle.estado}</ST>
                  </span>
                  {detalle.solicitudEdicion ? (
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                      <ST>Solicitud de edición en revisión</ST>
                    </span>
                  ) : null}
                  {detalle.solicitudEliminacion ? (
                    <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
                      <ST>Solicitud de baja en revisión</ST>
                    </span>
                  ) : null}
                </div>
              </div>
            </header>

            {detalle.solicitudEdicion ? (
              <div className="propuesta-aviso">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 propuesta-aviso__titulo">
                    <AlertCircle className="size-4" aria-hidden="true" />
                    <span><ST>Tenés una solicitud de edición en revisión</ST></span>
                  </div>
                  <button
                    type="button"
                    disabled={accionEnCurso === `cancelar-edicion-${detalle.id}`}
                    onClick={() => handleCancelarEdicion(detalle.id)}
                    className="text-[length:var(--text-body)] font-semibold text-rose-700 underline transition hover:text-rose-900"
                  >
                    <ST>Cancelar solicitud</ST>
                  </button>
                </div>
                <p className="propuesta-aviso__texto">
                  <ST>Enviada el</ST> {formatearFechaPropuesta(detalle.solicitudEdicion.fecha)}
                </p>
                <p className="propuesta-aviso__texto">
                  <span className="font-semibold"><ST>Motivo del cambio:</ST></span> {detalle.solicitudEdicion.motivo}
                </p>
              </div>
            ) : null}

            {detalle.solicitudEliminacion ? (
              <div className="mb-6 space-y-2 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-rose-950">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="size-4 text-rose-700" />
                    <span><ST>Tenés una solicitud de baja en revisión</ST></span>
                  </div>
                  <button
                    type="button"
                    disabled={accionEnCurso === `cancelar-baja-${detalle.id}`}
                    onClick={() => handleCancelarBaja(detalle.id)}
                    className="text-xs font-semibold text-rose-700 underline transition hover:text-rose-900"
                  >
                    <ST>Cancelar solicitud</ST>
                  </button>
                </div>
                <p className="text-xs text-rose-800">
                  <ST>Enviada el</ST> {formatearFechaPropuesta(detalle.solicitudEliminacion.fecha)}
                </p>
                <p className="text-xs text-rose-900">
                  <span className="font-semibold"><ST>Motivo de la baja:</ST></span> {detalle.solicitudEliminacion.motivo}
                </p>
              </div>
            ) : null}

            <DetallePropuestaSecciones
              propuesta={detalle}
                imagen={<ImagenPropuesta nombre={detalle.imagenNombre} imagenUrl={detalle.imagenUrl} alt={detalle.nombre} />}
            />

            <SeccionRevision propuesta={detalle}>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  {detalle.estado !== "Aprobada" && detalle.estado !== "Eliminada" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => abrirEdicion(detalle.id, false)}
                        className={adminBtnPrimary}
                      >
                        <Pencil className="mr-1.5 size-4" />
                        <ST>Editar datos de la propuesta</ST>
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalEliminar({ open: true, propuesta: detalle, esSolicitudBaja: false })}
                        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        <Trash2 className="size-4" />
                        <ST>Eliminar propuesta</ST>
                      </button>
                    </>
                  ) : null}

                  {detalle.estado === "Aprobada" ? (
                    <>
                      {!detalle.solicitudEdicion ? (
                        <button
                          type="button"
                          onClick={() => abrirEdicion(detalle.id, true)}
                          className={adminBtnPrimary}
                        >
                          <Pencil className="mr-1.5 size-4" />
                          <ST>Solicitar edición de datos</ST>
                        </button>
                      ) : null}

                      {!detalle.solicitudEliminacion ? (
                        <button
                          type="button"
                          onClick={() => setModalEliminar({ open: true, propuesta: detalle, esSolicitudBaja: true })}
                          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                          <Trash2 className="size-4" />
                          <ST>Solicitar baja del catálogo</ST>
                        </button>
                      ) : null}
                    </>
                  ) : null}
                </div>

                <p className="text-xs text-slate-500">
                  <ST>
                    Cualquier consulta adicional sobre tu propuesta podés coordinarla escribiendo a
                  </ST>{" "}
                  {correoInstitucional ? (
                    <a className="font-semibold text-slate-800" href={`mailto:${correoInstitucional}`}>
                      {correoInstitucional}
                    </a>
                  ) : (
                    <ST>nuestro correo institucional.</ST>
                  )}
                </p>
              </div>
            </SeccionRevision>
          </AdminModalBody>
        </AdminModal>
      ) : null}

      <ModalEditarMiPropuesta
        open={modalEditar.open}
        propuesta={modalEditar.propuesta}
        esSolicitud={modalEditar.esSolicitud}
        onClose={() => setModalEditar({ open: false, propuesta: null, esSolicitud: false })}
        onGuardado={onGuardadoExitoso}
      />

      <ModalEliminarMiPropuesta
        open={modalEliminar.open}
        propuesta={modalEliminar.propuesta}
        esSolicitudBaja={modalEliminar.esSolicitudBaja}
        onClose={() => setModalEliminar({ open: false, propuesta: null, esSolicitudBaja: false })}
        onCompletado={onEliminadoExitoso}
      />
    </main>
  );
}

export default function MisPropuestasCliente() {
  const { propuestaId = "" } = useParams({ strict: false });
  return (
    <PerfilClienteLayout>
      <MisPropuestasContent variant="cliente" propuestaId={propuestaId} />
    </PerfilClienteLayout>
  );
}
