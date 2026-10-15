import { useCallback, useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { ArrowUpRight, Eye, Pencil, RefreshCw } from "lucide-react";

import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminPaginacion } from "../../../Components/Admin/ui/AdminPaginacion";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import {
  AdminModal,
  AdminModalBody,
  AdminModalHeader,
  adminBtnPrimary,
  adminBtnVoluntariadoCancel,
} from "../../../Components/Admin/ui/AdminModal";
import { ImageLightbox } from "../../../Components/ImageLightbox/ImageLightbox";
import { ST } from "../../../Components/T/ST";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { useAdminListaFiltros } from "../../../hooks/useAdminListaFiltros";
import { useAdminPaginacion } from "../../../hooks/useAdminPaginacion";
import { useTraducir } from "../../../hooks/useTraducir";
import { t } from "../../../lib/t";
import { rolesDeUsuario, tienePermiso } from "../../../lib/permisos";
import {
  COMENTARIO_MAX,
  ESTADOS_PROPUESTA,
  MOTIVO_MAX,
  MOTIVO_MIN,
  SUGERENCIAS_MAX,
  esPropuestaAbierta,
  formatearFechaPropuesta,
} from "../../../lib/propuestaProductor";
import { DetallePropuestaSecciones, SeccionRevision } from "../../Productores/DetallePropuesta";
import {
  aprobarPropuesta,
  cambiarEstadoPropuesta,
  obtenerBlobImagenPropuesta,
  obtenerPropuestaAdmin,
  obtenerPropuestasAdmin,
  rechazarPropuesta,
} from "../../../services/propuestasProductoresService";
import { getActiveSessionUser } from "../../../services/sessionService";
import { AdminLayout } from "../layouts/AdminLayout";
import { EditarPropuestaForm, HistorialPropuesta, NotaInternaPropuesta } from "./RevisionPropuesta";

const ESTADOS = ESTADOS_PROPUESTA;
const CONFIRMACIONES = {
  aprobar: {
    titulo: "Confirmar aprobación",
    texto: "La propuesta pasará a Aprobada, se publicará en la sección de productores y se enviará un correo de aprobación al productor con el enlace a su perfil.",
    boton: "Aprobar y publicar",
  },
  rechazar: {
    titulo: "Confirmar rechazo",
    texto: "La propuesta pasará a Rechazada y se enviará un correo al productor con el motivo, las sugerencias y la invitación a enviar una nueva propuesta.",
    boton: "Rechazar",
  },
  revision: {
    titulo: "Marcar En revisión",
    texto: "La propuesta pasará a En revisión. El productor no recibe correo por este cambio.",
    boton: "Marcar En revisión",
  },
  pendiente: {
    titulo: "Volver a Pendiente",
    texto: "La propuesta vuelve a Pendiente. El productor no recibe correo por este cambio.",
    boton: "Volver a Pendiente",
  },
};

function claveFecha(valor) {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "";
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

const FILTROS_CONFIG = [
  { id: "estado", label: "Estado", obtenerValor: (item) => item.estado },
  {
    id: "desde",
    label: "Desde",
    tipo: "fecha",
    valorInicial: "",
    aplicar: (lista, valor) => (valor ? lista.filter((item) => claveFecha(item.fechaEnvio) >= valor) : lista),
  },
  {
    id: "hasta",
    label: "Hasta",
    tipo: "fecha",
    valorInicial: "",
    aplicar: (lista, valor) => (valor ? lista.filter((item) => {
      const clave = claveFecha(item.fechaEnvio);
      return Boolean(clave) && clave <= valor;
    }) : lista),
  },
];
const btnCancelarGris =
  "inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60";
const accionBtnBase =
  "inline-flex items-center justify-center gap-1 rounded-full border text-[11px] font-semibold leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";
const colorEstado = {
  Pendiente: "text-amber-600",
  "En revisión": "text-sky-600",
  Aprobada: "text-emerald-600",
  Rechazada: "text-rose-600",
};

function BadgeEstado({ estado }) {
  const etiqueta = useTraducir(estado || "Pendiente");
  return (
    <span className={`admin-chip-estado text-[length:var(--text-body)] font-semibold ${colorEstado[estado] || "text-slate-700"}`}>
      {etiqueta}
    </span>
  );
}

function ImagenAdmin({ nombre, alt }) {
  const [src, setSrc] = useState("");
  const [abierta, setAbierta] = useState(false);
  useEffect(() => {
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
  }, [nombre]);
  if (!src) return null;
  return (
    <>
      <div className="aspect-[4/3] w-full max-w-[16rem] overflow-hidden rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setAbierta(true)}
          className="block h-full w-full p-0"
          aria-label="Ver imagen más grande"
        >
          <img src={src} alt={alt || ""} className="h-full w-full cursor-zoom-in object-cover" />
        </button>
      </div>
      <ImageLightbox
        images={[src]}
        index={abierta ? 0 : -1}
        onClose={() => setAbierta(false)}
        alt={alt}
      />
    </>
  );
}

function puedeAdministrar() {
  return tienePermiso(rolesDeUsuario(getActiveSessionUser()), "administrar_solicitudes_productores");
}

export function PropuestasAdminContent({ propuestaId = "" }) {
  const [items, setItems] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [accion, setAccion] = useState("");
  const [motivo, setMotivo] = useState("");
  const [sugerencias, setSugerencias] = useState("");
  const [comentario, setComentario] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [aviso, setAviso] = useState("");
  const [editando, setEditando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const respuesta = await obtenerPropuestasAdmin({ page: 1, pageSize: 50 });
      setItems(Array.isArray(respuesta?.data) ? respuesta.data : []);
    } catch (err) {
      setItems([]);
      setError(err?.message || "No se pudieron cargar las propuestas.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!puedeAdministrar()) return undefined;
    const id = window.setTimeout(() => {
      cargar();
    }, 0);
    return () => window.clearTimeout(id);
  }, [cargar]);

  const abrir = useCallback(async (id) => {
    setAviso("");
    setMotivo("");
    setSugerencias("");
    setComentario("");
    setConfirmar("");
    setEditando(false);
    try {
      setDetalle(await obtenerPropuestaAdmin(id));
    } catch (err) {
      setError(err?.message || "No se pudo abrir la propuesta.");
    }
  }, []);

  useEffect(() => {
    if (propuestaId) abrir(propuestaId);
  }, [propuestaId, abrir]);

  const {
    busqueda,
    setBusqueda,
    valoresFiltro,
    setValorFiltro,
    filtrados,
    limpiar,
    hayFiltrosActivos,
    total,
    visibles,
  } = useAdminListaFiltros(items, {
    buscarEn: (item) => [item.id, `#${item.id}`, item.nombre, item.correo],
    filtrosConfig: FILTROS_CONFIG,
  });
  const { page, setPage, pageItems, totalPages } = useAdminPaginacion(filtrados);

  const resumen = items.reduce((acc, item) => {
    const estado = ESTADOS.includes(item.estado) ? item.estado : "Pendiente";
    acc[estado] = (acc[estado] || 0) + 1;
    return acc;
  }, { Pendiente: 0, "En revisión": 0, Aprobada: 0, Rechazada: 0 });

  const actualizarDetalle = useCallback((respuesta) => {
    if (!respuesta?.id) return;
    setDetalle(respuesta);
    setItems((prev) => prev.map((item) => (String(item.id) === String(respuesta.id) ? { ...item, ...respuesta } : item)));
  }, []);

  const cerrarConfirmacion = () => {
    setConfirmar("");
    setMotivo("");
    setSugerencias("");
    setComentario("");
  };

  const ejecutar = async () => {
    if (!detalle || accion) return;
    if (confirmar === "rechazar" && motivo.trim().length < MOTIVO_MIN) return;
    const tipo = confirmar;
    const esResolucion = tipo === "aprobar" || tipo === "rechazar";
    setAccion(tipo);
    setError("");
    const id = detalle.id;
    try {
      let respuesta;
      if (tipo === "aprobar") respuesta = await aprobarPropuesta(id, comentario.trim());
      else if (tipo === "rechazar") respuesta = await rechazarPropuesta(id, motivo.trim(), sugerencias.trim());
      else respuesta = await cambiarEstadoPropuesta(id, tipo === "revision" ? "En revisión" : "Pendiente", comentario.trim());
      aplicarDecision(respuesta, esResolucion);
    } catch (err) {
      if (esResolucion) {
        try {
          const actual = await obtenerPropuestaAdmin(id);
          if (actual?.estado && !esPropuestaAbierta(actual.estado)) {
            aplicarDecision(actual, true);
            return;
          }
        } catch {
          /* si no se puede confirmar, se muestra el error original */
        }
      }
      setError(err?.message || "No se pudo completar la revisión.");
    } finally {
      setAccion("");
    }
  };

  const aplicarDecision = (respuesta, esResolucion) => {
    actualizarDetalle(respuesta);
    cerrarConfirmacion();
    setAviso(
      esResolucion
        ? "La decisión quedó registrada. El correo se enviará aunque esta pantalla ya haya mostrado el resultado."
        : "Estado actualizado.",
    );
  };

  if (!puedeAdministrar()) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-slate-600"><ST>No tenés permiso para revisar propuestas de productores.</ST></p>
      </div>
    );
  }

  const toolbarFiltros = [
    {
      id: "estado",
      label: "Estado",
      value: valoresFiltro.estado ?? "todos",
      onChange: (valor) => setValorFiltro("estado", valor),
      opciones: [
        { value: "todos", label: "Todos los estados" },
        ...ESTADOS.map((estado) => ({ value: estado, label: estado })),
      ],
    },
    {
      id: "desde",
      label: "Desde",
      tipo: "fecha",
      value: valoresFiltro.desde ?? "",
      onChange: (valor) => setValorFiltro("desde", valor),
    },
    {
      id: "hasta",
      label: "Hasta",
      tipo: "fecha",
      value: valoresFiltro.hasta ?? "",
      onChange: (valor) => setValorFiltro("hasta", valor),
    },
  ];
  const abierta = detalle ? esPropuestaAbierta(detalle.estado) : false;
  const confirmacion = CONFIRMACIONES[confirmar] || null;

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              <ST>Propuestas de productores</ST>
            </h1>
            <p className="mt-1 max-w-2xl text-slate-600">
              <ST>Revisá cada emprendimiento y aprobá o rechazá la publicación.</ST>
            </p>
          </div>
          <button type="button" onClick={cargar} disabled={cargando} className={`${btnCancelarGris} gap-2 px-4 py-2 text-sm`}>
            <RefreshCw className={`size-4 ${cargando ? "animate-spin" : ""}`} />
            <ST>Actualizar</ST>
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-10 gap-y-3">
          {ESTADOS.map((estado) => (
            <div key={estado}>
              <p className={`text-sm font-semibold ${colorEstado[estado]}`}><ST>{estado}</ST></p>
              <p className="mt-0.5 text-2xl font-bold text-slate-950">{resumen[estado] || 0}</p>
            </div>
          ))}
        </div>
      </div>

      {cargando ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 size-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
          <p className="text-sm text-slate-600"><ST>Cargando propuestas...</ST></p>
        </div>
      ) : null}

      {!cargando && error && !detalle ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-semibold"><ST>{error}</ST></p>
          <button type="button" onClick={cargar} className={`${btnCancelarGris} mt-4`}>
            <ST>Reintentar</ST>
          </button>
        </div>
      ) : null}

      {!cargando && !error && items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-slate-600"><ST>No hay propuestas registradas aún.</ST></p>
        </div>
      ) : null}

      {!cargando && items.length > 0 ? (
        <div className="overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm">
          <AdminListaToolbar
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            placeholder="Buscar por número de propuesta, nombre o correo..."
            filtros={toolbarFiltros}
            total={total}
            visibles={visibles}
            hayFiltrosActivos={hayFiltrosActivos}
            onLimpiar={limpiar}
            compacto
          />
          {filtrados.length === 0 ? (
            <AdminListaVacia
              mensaje="No se encontraron propuestas con los criterios utilizados."
              onLimpiar={limpiar}
            />
          ) : (
            <>
              <div className="hidden overflow-hidden md:block">
                <div className="admin-table-shell">
                  <table className="w-full border-collapse text-left text-[length:var(--text-body)]">
                    <thead>
                      <tr>
                        <th><ST>Emprendimiento</ST></th>
                        <th><ST>Correo</ST></th>
                        <th><ST>Fecha</ST></th>
                        <th><ST>Estado</ST></th>
                        <th><ST>Acciones</ST></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pageItems.map((item) => (
                        <tr key={item.id} className="transition hover:bg-slate-50/60">
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-950">{item.nombre}</div>
                            <div className="mt-1 text-slate-500">#{item.id}</div>
                          </td>
                          <td className="px-5 py-4 text-slate-700">{item.correo}</td>
                          <td className="px-5 py-4 text-slate-700">{formatearFechaPropuesta(item.fechaEnvio) || t("Sin fecha")}</td>
                          <td className="px-5 py-4"><BadgeEstado estado={item.estado} /></td>
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => abrir(item.id)}
                              className={`${accionBtnBase} h-8 border-slate-300 bg-white px-2.5 text-slate-700 hover:bg-slate-50`}
                            >
                              <Eye className="size-3" aria-hidden="true" />
                              <span><ST>Ver detalle</ST></span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="divide-y divide-slate-100 md:hidden">
                {pageItems.map((item) => (
                  <article key={item.id} className="space-y-3 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-950">{item.nombre}</h3>
                        <p className="mt-0.5 text-sm text-slate-500">{item.correo}</p>
                      </div>
                      <BadgeEstado estado={item.estado} />
                    </div>
                    <p className="text-sm text-slate-600">#{item.id} · {formatearFechaPropuesta(item.fechaEnvio)}</p>
                    <button
                      type="button"
                      onClick={() => abrir(item.id)}
                      className={`${accionBtnBase} h-8 border-slate-300 bg-white px-2.5 text-slate-700`}
                    >
                      <Eye className="size-3" aria-hidden="true" />
                      <span><ST>Ver detalle</ST></span>
                    </button>
                  </article>
                ))}
              </div>
              <AdminPaginacion
                page={page}
                totalPages={totalPages}
                total={filtrados.length}
                onChange={setPage}
                label="Paginación de propuestas"
              />
            </>
          )}
        </div>
      ) : null}

      {detalle ? (
        <AdminModal open onClose={() => { setDetalle(null); setEditando(false); }} maxWidth="max-w-xl">
          <AdminModalHeader>
            <ST>{editando ? "Editar propuesta antes de aprobar" : "Detalle de la propuesta"}</ST>
          </AdminModalHeader>
          <AdminModalBody>
            <header className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold text-slate-950">{detalle.nombre}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  <ST>Propuesta</ST> #{detalle.id}
                </p>
                <div className="mt-2">
                  <BadgeEstado estado={detalle.estado} />
                </div>
              </div>
            </header>
            {aviso ? <p className="mb-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700"><ST>{aviso}</ST></p> : null}
            {error ? <p className="mb-4 text-sm text-rose-700"><ST>{error}</ST></p> : null}
            {editando ? (
              <EditarPropuestaForm
                propuesta={detalle}
                onGuardado={(actualizada) => {
                  actualizarDetalle(actualizada);
                  setEditando(false);
                  setAviso("Los cambios se guardaron.");
                }}
                onCancelar={() => setEditando(false)}
              />
            ) : (
              <>
                <DetallePropuestaSecciones
                  propuesta={detalle}
                  imagen={<ImagenAdmin nombre={detalle.imagenNombre} alt={detalle.nombre} />}
                />
                <SeccionRevision propuesta={detalle}>
                  {abierta ? (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className={adminBtnPrimary} disabled={Boolean(accion)} onClick={() => setConfirmar("aprobar")}>
                        <ST>Aprobar</ST>
                      </button>
                      <button type="button" className={adminBtnVoluntariadoCancel} disabled={Boolean(accion)} onClick={() => setConfirmar("rechazar")}>
                        <ST>Rechazar</ST>
                      </button>
                      <button
                        type="button"
                        className={adminBtnVoluntariadoCancel}
                        disabled={Boolean(accion)}
                        onClick={() => {
                          setAviso("");
                          setEditando(true);
                        }}
                      >
                        <Pencil className="mr-1.5 size-4" aria-hidden="true" />
                        <ST>Editar datos</ST>
                      </button>
                      <button
                        type="button"
                        className={adminBtnVoluntariadoCancel}
                        disabled={Boolean(accion)}
                        onClick={() => setConfirmar(detalle.estado === "En revisión" ? "pendiente" : "revision")}
                      >
                        <ST>{detalle.estado === "En revisión" ? "Volver a Pendiente" : "Marcar En revisión"}</ST>
                      </button>
                    </div>
                  ) : null}
                  {detalle.estado === "Aprobada" && detalle.enlacePerfilPublico ? (
                    <a
                      href={detalle.enlacePerfilPublico}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${adminBtnVoluntariadoCancel} gap-1.5`}
                    >
                      <ST>Ver perfil publicado</ST>
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </a>
                  ) : null}
                </SeccionRevision>
              </>
            )}
            <NotaInternaPropuesta key={detalle.id} propuesta={detalle} onGuardado={actualizarDetalle} />
            <HistorialPropuesta historial={detalle.historial} />
          </AdminModalBody>
        </AdminModal>
      ) : null}

      <AdminModal open={Boolean(confirmacion)} onClose={() => !accion && cerrarConfirmacion()}>
        <AdminModalHeader>
          <ST>{confirmacion?.titulo || ""}</ST>
        </AdminModalHeader>
        <AdminModalBody>
          <p className="text-[length:var(--text-body)] text-slate-700">
            <ST>{confirmacion?.texto || ""}</ST>
          </p>
          {confirmar === "rechazar" ? (
            <>
              <label className="mt-4 grid gap-1 text-[length:var(--text-body)]">
                <span className="font-medium text-slate-700">
                  <ST>Motivo del rechazo (obligatorio)</ST>
                </span>
                <textarea
                  rows={3}
                  maxLength={MOTIVO_MAX}
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
                />
                <span className={motivo.trim().length < MOTIVO_MIN ? "text-amber-700" : "text-slate-500"}>
                  {motivo.trim().length < MOTIVO_MIN
                    ? t(`Escribí al menos ${MOTIVO_MIN} caracteres para orientar al productor.`)
                    : `${motivo.trim().length}/${MOTIVO_MAX}`}
                </span>
              </label>
              <label className="mt-4 grid gap-1 text-[length:var(--text-body)]">
                <span className="font-medium text-slate-700">
                  <ST>Sugerencias para el productor (opcional)</ST>
                </span>
                <textarea
                  rows={3}
                  maxLength={SUGERENCIAS_MAX}
                  value={sugerencias}
                  onChange={(event) => setSugerencias(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
                />
              </label>
            </>
          ) : (
            <label className="mt-4 grid gap-1 text-[length:var(--text-body)]">
              <span className="font-medium text-slate-700">
                <ST>Comentario interno (opcional, solo administradores)</ST>
              </span>
              <textarea
                rows={2}
                maxLength={COMENTARIO_MAX}
                value={comentario}
                onChange={(event) => setComentario(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
              />
            </label>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className={adminBtnPrimary}
              disabled={Boolean(accion) || (confirmar === "rechazar" && motivo.trim().length < MOTIVO_MIN)}
              onClick={ejecutar}
            >
              {accion ? <ST>Guardando...</ST> : <ST>{confirmacion?.boton || "Aceptar"}</ST>}
            </button>
            <button type="button" className={adminBtnVoluntariadoCancel} disabled={Boolean(accion)} onClick={cerrarConfirmacion}>
              <ST>Cancelar</ST>
            </button>
          </div>
        </AdminModalBody>
      </AdminModal>
    </section>
  );
}

export default function PropuestasAdmin() {
  const { propuestaId = "" } = useParams({ strict: false });
  const { showLoading, loadingMessage } = useAdminPageGate(
    propuestaId ? `/admin/propuestas/${propuestaId}` : "/admin/propuestas",
    true,
  );
  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
      <AdminLayout>
        <PropuestasAdminContent propuestaId={propuestaId} />
      </AdminLayout>
    </AdminPageGate>
  );
}
