import { useCallback, useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { Eye, RefreshCw } from "lucide-react";

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
import { MOTIVO_MAX, MOTIVO_MIN, formatearFechaPropuesta } from "../../../lib/propuestaProductor";
import { DetallePropuestaSecciones, SeccionRevision } from "../../Productores/DetallePropuesta";
import {
  aprobarPropuesta,
  obtenerBlobImagenPropuesta,
  obtenerPropuestaAdmin,
  obtenerPropuestasAdmin,
  rechazarPropuesta,
} from "../../../services/propuestasProductoresService";
import { getActiveSessionUser } from "../../../services/sessionService";
import { AdminLayout } from "../layouts/AdminLayout";

const ESTADOS = ["Pendiente", "Aprobada", "Rechazada"];
const btnCancelarGris =
  "inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60";
const accionBtnBase =
  "inline-flex items-center justify-center gap-1 rounded-full border text-[11px] font-semibold leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";
const colorEstado = {
  Pendiente: "text-amber-600",
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
      <button
        type="button"
        onClick={() => setAbierta(true)}
        className="h-36 w-36 overflow-hidden rounded-2xl border border-slate-200 p-0"
        aria-label="Ver imagen más grande"
      >
        <img src={src} alt={alt || ""} className="h-full w-full cursor-zoom-in object-cover" />
      </button>
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
  const [confirmar, setConfirmar] = useState("");
  const [aviso, setAviso] = useState("");

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
    setConfirmar("");
    try {
      setDetalle(await obtenerPropuestaAdmin(id));
    } catch (err) {
      setError(err?.message || "No se pudo abrir la propuesta.");
    }
  }, []);

  useEffect(() => {
    if (propuestaId) abrir(propuestaId);
  }, [propuestaId, abrir]);

  const filtrosConfig = [
    {
      id: "estado",
      label: "Estado",
      obtenerValor: (item) => item.estado,
    },
    {
      id: "fecha",
      label: "Fecha",
      tipo: "fecha",
      valorInicial: "",
      aplicar: (lista, valor) => {
        if (!valor) return lista;
        return lista.filter((item) => {
          const fecha = new Date(item.fechaEnvio);
          if (Number.isNaN(fecha.getTime())) return false;
          const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
          return clave === valor;
        });
      },
    },
  ];

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
    buscarEn: (item) => [item.id, item.nombre, item.correo],
    filtrosConfig,
  });
  const { page, setPage, pageItems, totalPages } = useAdminPaginacion(filtrados);

  const resumen = items.reduce((acc, item) => {
    const estado = ESTADOS.includes(item.estado) ? item.estado : "Pendiente";
    acc[estado] = (acc[estado] || 0) + 1;
    return acc;
  }, { Pendiente: 0, Aprobada: 0, Rechazada: 0 });

  const ejecutar = async () => {
    if (!detalle || accion) return;
    if (confirmar === "rechazar" && motivo.trim().length < MOTIVO_MIN) return;
    setAccion(confirmar);
    setError("");
    const id = detalle.id;
    try {
      const respuesta = confirmar === "aprobar"
        ? await aprobarPropuesta(id)
        : await rechazarPropuesta(id, motivo.trim());
      aplicarDecision(respuesta);
    } catch (err) {
      try {
        const actual = await obtenerPropuestaAdmin(id);
        if (actual?.estado && actual.estado !== "Pendiente") {
          aplicarDecision(actual);
          return;
        }
      } catch {
        /* si no se puede confirmar, se muestra el error original */
      }
      setError(err?.message || "No se pudo completar la revisión.");
    } finally {
      setAccion("");
    }
  };

  const aplicarDecision = (respuesta) => {
    setDetalle(respuesta);
    setItems((prev) => prev.map((item) => (String(item.id) === String(respuesta.id) ? { ...item, ...respuesta } : item)));
    setConfirmar("");
    setMotivo("");
    setAviso("La decisión quedó registrada. El correo se enviará aunque esta pantalla ya haya mostrado el resultado.");
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
      id: "fecha",
      label: "Fecha",
      tipo: "fecha",
      value: valoresFiltro.fecha ?? "",
      onChange: (valor) => setValorFiltro("fecha", valor),
    },
  ];

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
            placeholder="Buscar por identificador, nombre o correo..."
            filtros={toolbarFiltros}
            total={total}
            visibles={visibles}
            hayFiltrosActivos={hayFiltrosActivos}
            onLimpiar={limpiar}
            compacto
          />
          {filtrados.length === 0 ? (
            <AdminListaVacia onLimpiar={limpiar} />
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
                              <span><ST>Ver</ST></span>
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
                      <span><ST>Ver</ST></span>
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
        <AdminModal open onClose={() => setDetalle(null)} maxWidth="max-w-2xl">
          <AdminModalHeader>
            <ST>Detalle de la propuesta</ST>
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
            <DetallePropuestaSecciones
              propuesta={detalle}
              imagen={<ImagenAdmin nombre={detalle.imagenNombre} alt={detalle.nombre} />}
            />
            <SeccionRevision propuesta={detalle}>
              {detalle.estado === "Pendiente" ? (
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={adminBtnPrimary} disabled={Boolean(accion)} onClick={() => setConfirmar("aprobar")}>
                    <ST>Aprobar</ST>
                  </button>
                  <button type="button" className={adminBtnVoluntariadoCancel} disabled={Boolean(accion)} onClick={() => setConfirmar("rechazar")}>
                    <ST>Rechazar</ST>
                  </button>
                </div>
              ) : null}
            </SeccionRevision>
          </AdminModalBody>
        </AdminModal>
      ) : null}

      <AdminModal open={Boolean(confirmar)} onClose={() => !accion && setConfirmar("")}>
        <AdminModalHeader>
          <ST>{confirmar === "aprobar" ? "Confirmar aprobación" : "Confirmar rechazo"}</ST>
        </AdminModalHeader>
        <AdminModalBody>
          <p className="text-slate-700">
            <ST>
              {confirmar === "aprobar"
                ? "La propuesta pasará a Aprobada y se publicará."
                : "Indicá el motivo. La propuesta pasará a Rechazada."}
            </ST>
          </p>
          {confirmar === "rechazar" ? (
            <label className="mt-4 grid gap-1 text-sm">
              <span className="font-medium text-slate-700"><ST>Motivo del rechazo</ST></span>
              <textarea
                rows={3}
                maxLength={MOTIVO_MAX}
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
              />
            </label>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className={adminBtnPrimary}
              disabled={Boolean(accion) || (confirmar === "rechazar" && motivo.trim().length < MOTIVO_MIN)}
              onClick={ejecutar}
            >
              {accion ? <ST>Guardando...</ST> : <ST>{confirmar === "aprobar" ? "Aceptar" : "Rechazar"}</ST>}
            </button>
            <button type="button" className={adminBtnVoluntariadoCancel} disabled={Boolean(accion)} onClick={() => { setConfirmar(""); setMotivo(""); }}>
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
