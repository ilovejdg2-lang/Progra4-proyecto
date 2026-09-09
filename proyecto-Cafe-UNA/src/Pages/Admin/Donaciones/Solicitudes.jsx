import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Calendar,
  Clock,
  Download,
  Eye,
  FileDown,
  FileText,
  Hash,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Truck,
  UserRound,
  X,
} from "lucide-react";

import {
  AdminModal,
  AdminModalBody,
  AdminModalFooter,
  AdminModalHeader,
} from "../../../Components/Admin/ui/AdminModal";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import { AdminPaginacion } from "../../../Components/Admin/ui/AdminPaginacion";
import { AdminLayout } from "../layouts/AdminLayout";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { useAdminListaFiltros } from "../../../hooks/useAdminListaFiltros";
import { useAdminPaginacion } from "../../../hooks/useAdminPaginacion";
import { rolesDeUsuario, tienePermiso } from "../../../lib/permisos";
import {
  actualizarEstadoSolicitudDonacion,
  camposSolicitudDonacion,
  obtenerSolicitudesDonacionAdmin,
} from "../../../services/donacionesService";
import { getActiveSessionUser } from "../../../services/sessionService";
import {
  cargarLogoWebpParaPdf,
  construirPdfFichaDonacion,
  construirPdfReporteDonaciones,
  descargarArchivo,
} from "../../../lib/exportarDonacionesPdf";
import { ST } from "../../../Components/T/ST";
import { ImageLightbox } from "../../../Components/ImageLightbox/ImageLightbox";
import { useTraducir } from "../../../hooks/useTraducir";
import { t } from "../../../lib/t";

const ESTADOS = ["Pendiente", "Aceptada", "Rechazada"];

const accionBtnBase =
  "inline-flex items-center justify-center gap-1 rounded-full border text-[11px] font-semibold leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

const btnCancelarGris =
  "inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60";

function formatFecha(valor) {
  if (!valor) return "";
  const fecha = new Date(`${valor}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleDateString("es-CR");
}

function formatValor(valor) {
  const limpio = String(valor || "").replace(/[^\d.,]/g, "").replace(",", ".");
  const numero = Number(limpio);
  if (!Number.isFinite(numero) || numero <= 0) return "";
  return `CRC ${numero.toLocaleString("es-CR")}`;
}

const colorEstado = {
  Pendiente: "text-amber-600",
  Aceptada: "text-emerald-600",
  Rechazada: "text-rose-600",
};

function claseEstado(estado) {
  return colorEstado[estado] ?? "text-slate-700";
}

function etiquetaModalidadCorta(campos) {
  if (campos.recoleccionSolicitada || campos.metodoEntregaClave === "recoleccion") {
    return "Recolección";
  }
  if (campos.metodoEntregaClave === "entrega") return "Entrega";
  return campos.metodoEntrega || "";
}

function BadgeEstado({ estado }) {
  const etiqueta = useTraducir(estado || "Pendiente");
  return (
    <span className={`admin-chip-estado text-[length:var(--text-body)] font-semibold ${claseEstado(estado)}`}>
      {etiqueta}
    </span>
  );
}

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "DN";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function partirNombreCompleto(completo = "") {
  const parts = String(completo || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { nombre: "", primerApellido: "", segundoApellido: "" };
  if (parts.length === 1) return { nombre: parts[0], primerApellido: "", segundoApellido: "" };
  if (parts.length === 2) return { nombre: parts[0], primerApellido: parts[1], segundoApellido: "" };
  return {
    nombre: parts.slice(0, -2).join(" "),
    primerApellido: parts[parts.length - 2],
    segundoApellido: parts[parts.length - 1],
  };
}

function DetailField({ icon: Icon, label, value, className = "", traducirValor = false }) {
  const tVacio = useTraducir("No indicado");
  const mostrar = value
    ? traducirValor
      ? <ST>{value}</ST>
      : value
    : tVacio;
  return (
    <div className={`grid gap-2 ${className}`}>
      <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
        <Icon className="size-4 text-slate-500" />
        <ST>{label}</ST>
      </span>
      <p className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
        {mostrar}
      </p>
    </div>
  );
}

function AccionesSolicitud({
  onVer,
  onDescargarFicha,
  variant = "table",
}) {
  const esMovil = variant === "mobile";
  const verCls = `${accionBtnBase} border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300`;
  const pdfCls = `${accionBtnBase} border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-300`;

  if (esMovil) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={onVer} className={`${verCls} h-8 px-2.5`}>
          <Eye className="size-3 shrink-0" aria-hidden="true" />
          <span><ST>Ver</ST></span>
        </button>
        <button
          type="button"
          onClick={onDescargarFicha}
          className={`${pdfCls} h-8 px-2.5`}
          title={t("Descargar ficha PDF")}
        >
          <FileDown className="size-3 shrink-0" aria-hidden="true" />
          <span><ST>Ficha PDF</ST></span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={onVer}
        className={`${verCls} h-7 px-2`}
        title={t("Ver solicitud")}
      >
        <Eye className="size-3 shrink-0" aria-hidden="true" />
        <span><ST>Ver</ST></span>
      </button>
      <button
        type="button"
        onClick={onDescargarFicha}
        className={`${pdfCls} h-7 px-2`}
        title={t("Descargar ficha PDF")}
      >
        <FileDown className="size-3 shrink-0" aria-hidden="true" />
        <span><ST>Ficha PDF</ST></span>
      </button>
    </div>
  );
}

function ModalDetalle({ solicitud, puedeResolver, onResolver, onDescargarFicha, onCerrar }) {
  const campos = camposSolicitudDonacion(solicitud);
  const partes = partirNombreCompleto(campos.donanteNombre);
  const [guardando, setGuardando] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");
  const [fotoVista, setFotoVista] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const urlsFotos = campos.fotos
    .map((foto) => String(foto.url || foto.Url || "").trim())
    .filter(Boolean);

  const btnEstadoBase = `${accionBtnBase} px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50`;
  const btnAprobar = `${btnEstadoBase} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-300`;
  const btnRechazar = `${btnEstadoBase} border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-300`;

  async function cambiarEstado(estado) {
    setGuardando(true);
    setErrorAccion("");
    try {
      await onResolver(solicitud.id, estado, estado === "Rechazada" ? motivoRechazo : "");
      onCerrar();
    } catch (accionError) {
      setErrorAccion(
        accionError instanceof Error ? accionError.message : t("No se pudo actualizar el estado."),
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <AdminModal open onClose={onCerrar} maxWidth="max-w-2xl" labelledBy="donacion-detalle-titulo">
        <AdminModalHeader>
          <div className="min-w-0">
            <h2 id="donacion-detalle-titulo" className="text-lg font-semibold text-slate-950">
              <ST>Ver solicitud</ST>
            </h2>
            <p className="text-sm text-slate-500">
              <ST>Solicitud</ST> #{solicitud.id} · <ST>Fecha de la solicitud</ST>{" "}
              {formatFecha(campos.fechaSolicitud) || t("sin fecha")}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label={t("Cerrar")}
          >
            <X className="size-5" />
          </button>
        </AdminModalHeader>

        <AdminModalBody>
          <header className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="grid size-14 shrink-0 place-items-center rounded-full bg-slate-950 text-base font-bold text-white">
              {getInitials(campos.donanteNombre)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold text-slate-950">{campos.donanteNombre || t("Sin nombre")}</h3>
              <div className="mt-2">
                <BadgeEstado estado={campos.estado} />
              </div>
            </div>
          </header>

          <section className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              <ST>Información del donante</ST>
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailField icon={UserRound} label="¿Quién realizará la donación?" value={campos.tipoDonante} traducirValor />
              {campos.esOrganizacion ? (
                <DetailField icon={UserRound} label="Razón social" value={campos.donanteNombre} />
              ) : (
                <>
                  <DetailField icon={UserRound} label="Nombre" value={campos.nombre || partes.nombre} />
                  <DetailField icon={UserRound} label="Primer apellido" value={campos.primerApellido || partes.primerApellido} />
                  <DetailField icon={UserRound} label="Segundo apellido" value={campos.segundoApellido || partes.segundoApellido} />
                </>
              )}
              <DetailField icon={Hash} label="Tipo de identificación" value={campos.tipoIdentificacion} traducirValor />
              <DetailField icon={Hash} label="Identificación" value={campos.numeroIdentificacion} />
              <DetailField icon={Mail} label="Correo electrónico" value={campos.correo} />
              <DetailField icon={Phone} label="Teléfono" value={campos.telefono} />
            </div>
          </section>

          <section className="mt-6 space-y-4 border-t border-slate-100 pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              <ST>Detalles de la donación</ST>
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailField icon={Package} label="Categoría de la donación" value={campos.categoria} traducirValor />
              <DetailField icon={Package} label="Material o artículo" value={campos.material} traducirValor />
              <DetailField icon={Package} label="Cantidad o volumen estimado" value={campos.cantidadEstimada} />
              <DetailField icon={FileText} label="Estado de los artículos" value={campos.estadoArticulos} traducirValor />
              <DetailField icon={Banknote} label="Valor estimado de la donación" value={formatValor(campos.valorEstimado)} />
              <DetailField
                icon={FileText}
                label="Descripción detallada de los artículos"
                value={campos.descripcion}
                className="md:col-span-2"
                traducirValor
              />
              <div className="grid gap-2 md:col-span-2">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Package className="size-4 text-slate-500" />
                  <ST>Fotografías de los artículos</ST>
                </span>
                {campos.fotos.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {campos.fotos.map((foto, index) => (
                      <button
                        key={`${foto.nombre || "foto"}-${index}`}
                        type="button"
                        className="h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 p-0"
                        onClick={() => setFotoVista(index)}
                        aria-label="Ver imagen más grande"
                      >
                        <img
                          src={foto.url || foto.Url}
                          alt=""
                          className="h-full w-full cursor-zoom-in object-cover"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                    <ST>No indicado</ST>
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="mt-6 space-y-4 border-t border-slate-100 pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              <ST>Ubicación</ST>
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailField icon={MapPin} label="Provincia" value={campos.provincia} />
              <DetailField icon={MapPin} label="Cantón" value={campos.canton} />
              <DetailField icon={MapPin} label="Distrito" value={campos.distrito} />
              <DetailField icon={MapPin} label="Dirección" value={campos.direccion} className="md:col-span-2" />
            </div>
          </section>

          <section className="mt-6 space-y-4 border-t border-slate-100 pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              <ST>Logística</ST>
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailField icon={Truck} label="Modalidad" value={campos.metodoEntrega} traducirValor />
              {campos.recoleccionSolicitada ? (
                <p className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                  <ST>Recolección solicitada. Debe evaluarse de forma manual; no se aprueba automáticamente.</ST>
                </p>
              ) : null}
              <DetailField
                icon={Calendar}
                label="Día de entrega o recolección"
                value={formatFecha(campos.fechaEntrega)}
              />
              <DetailField
                icon={Clock}
                label="Hora de entrega o recolección"
                value={campos.horaEntrega}
              />
            </div>
          </section>

          <section className="mt-6 space-y-4 border-t border-slate-100 pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              <ST>Estado de la solicitud</ST>
            </h4>
            <BadgeEstado estado={campos.estado} />
            {campos.motivoRechazo ? (
              <DetailField icon={FileText} label="Motivo de rechazo" value={campos.motivoRechazo} className="md:col-span-2" />
            ) : null}
          </section>

          <section className="mt-6 space-y-4 border-t border-slate-100 pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              <ST>Declaración y confirmación</ST>
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailField icon={Calendar} label="Fecha de la solicitud" value={formatFecha(campos.fechaSolicitud)} />
            </div>
          </section>

          {errorAccion ? <p className="mt-4 text-sm text-rose-700">{errorAccion}</p> : null}
        </AdminModalBody>

        <AdminModalFooter className="justify-between gap-3">
          <button
            type="button"
            onClick={() => onDescargarFicha(solicitud)}
            className={`${btnCancelarGris} gap-2 px-3 py-2 text-xs font-semibold`}
          >
            <FileDown className="size-3.5" />
            <ST>Descargar ficha PDF</ST>
          </button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {puedeResolver && campos.estado === "Pendiente" ? (
              <>
                <button type="button" disabled={guardando} onClick={() => setConfirmacion("Aceptada")} className={btnAprobar}>
                  <ST>Aceptar</ST>
                </button>
                <button type="button" disabled={guardando} onClick={() => setConfirmacion("Rechazada")} className={btnRechazar}>
                  <ST>Rechazar</ST>
                </button>
              </>
            ) : null}
            <button type="button" onClick={onCerrar} className={btnCancelarGris}>
              <ST>Cerrar</ST>
            </button>
          </div>
        </AdminModalFooter>
      </AdminModal>

      <AdminModal
        open={Boolean(confirmacion)}
        elevated
        onClose={() => {
          if (guardando) return;
          setConfirmacion(null);
          setMotivoRechazo("");
        }}
        maxWidth="max-w-md"
        labelledBy="donacion-confirmar-titulo"
      >
        <AdminModalHeader>
          <h2 id="donacion-confirmar-titulo" className="text-lg font-semibold text-slate-950">
            <ST>
              {confirmacion === "Aceptada"
                ? "Aceptar solicitud de donación"
                : "Rechazar solicitud de donación"}
            </ST>
          </h2>
        </AdminModalHeader>
        <AdminModalBody>
          <p className="text-sm text-slate-600">
            <ST>
              {confirmacion === "Aceptada"
                ? "¿Está seguro de que desea aceptar esta solicitud?"
                : "¿Está seguro de que desea rechazar esta solicitud?"}
            </ST>
          </p>
          {confirmacion === "Rechazada" ? (
            <textarea
              value={motivoRechazo}
              onChange={(event) => setMotivoRechazo(event.target.value)}
              className="mt-3 min-h-24 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              placeholder={t("Motivo u observación (opcional)")}
              maxLength={1000}
            />
          ) : null}
          {errorAccion ? <p className="mt-3 text-sm text-rose-700">{errorAccion}</p> : null}
        </AdminModalBody>
        <AdminModalFooter>
          <button
            type="button"
            disabled={guardando}
            onClick={() => cambiarEstado(confirmacion)}
            className={confirmacion === "Aceptada" ? btnAprobar : btnRechazar}
          >
            <ST>{guardando ? "Guardando..." : "Confirmar"}</ST>
          </button>
          <button
            type="button"
            disabled={guardando}
            onClick={() => {
              setConfirmacion(null);
              setMotivoRechazo("");
            }}
            className={btnCancelarGris}
          >
            <ST>Cancelar</ST>
          </button>
        </AdminModalFooter>
      </AdminModal>

      <ImageLightbox
        images={urlsFotos}
        index={fotoVista}
        onClose={() => setFotoVista(null)}
        onIndexChange={setFotoVista}
        alt="Fotografía de la donación"
      />
    </>
  );
}

export default function AdminSolicitudesDonacion() {
  const actor = (() => {
    try {
      return getActiveSessionUser();
    } catch {
      return null;
    }
  })();
  const roles = rolesDeUsuario(actor);
  const puedeVer =
    tienePermiso(roles, "ver_solicitudes_donacion") ||
    tienePermiso(roles, "administrar_solicitudes_donaciones");
  const puedeResolver =
    tienePermiso(roles, "administrar_solicitudes_donaciones") ||
    tienePermiso(roles, "actualizar_solicitud_donaciones");

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState(() => (puedeVer ? "loading" : "idle"));
  const [error, setError] = useState("");
  const [viendo, setViendo] = useState(null);
  const [exportando, setExportando] = useState(false);
  const [recargaTick, setRecargaTick] = useState(0);

  const recargar = () => {
    if (!puedeVer) return;
    setStatus("loading");
    setError("");
    setRecargaTick((prev) => prev + 1);
  };

  useEffect(() => {
    if (!puedeVer) return;

    let cancelado = false;
    obtenerSolicitudesDonacionAdmin()
      .then((data) => {
        if (cancelado) return;
        setItems(Array.isArray(data) ? data : []);
        setStatus("success");
      })
      .catch((loadError) => {
        if (cancelado) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudieron cargar las solicitudes.",
        );
        setStatus("error");
      });

    return () => {
      cancelado = true;
    };
  }, [puedeVer, recargaTick]);

  const { showLoading, loadingMessage } = useAdminPageGate(
    "/admin/donaciones/solicitudes",
    status !== "loading",
  );

  const resumen = useMemo(() => {
    return items.reduce(
      (acc, row) => {
        const campos = camposSolicitudDonacion(row);
        const est = campos.estado || "Pendiente";
        acc[est] = (acc[est] || 0) + 1;
        return acc;
      },
      { Total: items.length, Pendiente: 0, Aceptada: 0, Rechazada: 0 },
    );
  }, [items]);

  const categoriasDisponibles = useMemo(() => {
    const set = new Set();
    items.forEach((item) => {
      const c = camposSolicitudDonacion(item);
      if (c.categoria) set.add(c.categoria);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [items]);

  const materialesDisponibles = useMemo(() => {
    const set = new Set();
    items.forEach((item) => {
      const c = camposSolicitudDonacion(item);
      if (c.material) set.add(c.material);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [items]);

  const filtrosConfig = useMemo(
    () => [
      {
        id: "categoria",
        valorInicial: "todas",
        obtenerValor: (row) => camposSolicitudDonacion(row).categoria,
        valorTodos: "todas",
      },
      {
        id: "material",
        valorInicial: "todos",
        obtenerValor: (row) => camposSolicitudDonacion(row).material,
        valorTodos: "todos",
      },
      {
        id: "estado",
        valorInicial: "todos",
        obtenerValor: (row) => camposSolicitudDonacion(row).estado || "Pendiente",
        valorTodos: "todos",
      },
      {
        id: "modalidad",
        valorInicial: "todas",
        obtenerValor: (row) => camposSolicitudDonacion(row).metodoEntregaClave || "",
        valorTodos: "todas",
      },
      {
        id: "fechaDesde",
        valorInicial: "",
        aplicar: (lista, valor) => {
          if (!valor) return lista;
          return lista.filter((row) => {
            const fecha = camposSolicitudDonacion(row).fechaSolicitud || "";
            return fecha >= valor;
          });
        },
      },
      {
        id: "fechaHasta",
        valorInicial: "",
        aplicar: (lista, valor) => {
          if (!valor) return lista;
          return lista.filter((row) => {
            const fecha = camposSolicitudDonacion(row).fechaSolicitud || "";
            return fecha && fecha <= valor;
          });
        },
      },
    ],
    [],
  );

  const {
    busqueda,
    setBusqueda,
    valoresFiltro,
    setValorFiltro,
    filtrados: solicitudesFiltradas,
    limpiar: limpiarFiltros,
    hayFiltrosActivos,
    total,
    visibles,
  } = useAdminListaFiltros(items, {
    buscarEn: (row) => {
      const c = camposSolicitudDonacion(row);
      return [
        String(row.id || ""),
        c.donanteNombre,
        c.nombre,
        c.primerApellido,
        c.segundoApellido,
        c.correo,
        c.telefono,
        c.numeroIdentificacion,
        c.categoria,
        c.material,
        c.descripcion,
        c.metodoEntrega,
        c.direccion,
        c.estado,
        c.tipoDonante,
      ];
    },
    filtrosConfig,
  });

  const {
    page,
    setPage,
    pageItems: solicitudesPagina,
    totalPages,
  } = useAdminPaginacion(solicitudesFiltradas);

  const toolbarFiltros = [
    {
      id: "categoria",
      label: "Categoría",
      value: valoresFiltro.categoria ?? "todas",
      onChange: (valor) => setValorFiltro("categoria", valor),
      opciones: [
        { value: "todas", label: "Todas las categorías" },
        ...categoriasDisponibles.map((cat) => ({ value: cat, label: cat })),
      ],
    },
    {
      id: "material",
      label: "Material",
      value: valoresFiltro.material ?? "todos",
      onChange: (valor) => setValorFiltro("material", valor),
      opciones: [
        { value: "todos", label: "Todos los materiales" },
        ...materialesDisponibles.map((mat) => ({ value: mat, label: mat })),
      ],
    },
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
      id: "modalidad",
      label: "Entrega / Recolección",
      value: valoresFiltro.modalidad ?? "todas",
      onChange: (valor) => setValorFiltro("modalidad", valor),
      opciones: [
        { value: "todas", label: "Todas" },
        { value: "entrega", label: "Entrega" },
        { value: "recoleccion", label: "Recolección" },
      ],
    },
    {
      id: "fechaDesde",
      label: "Desde",
      tipo: "fecha",
      value: valoresFiltro.fechaDesde ?? "",
      onChange: (valor) => setValorFiltro("fechaDesde", valor),
    },
    {
      id: "fechaHasta",
      label: "Hasta",
      tipo: "fecha",
      value: valoresFiltro.fechaHasta ?? "",
      onChange: (valor) => setValorFiltro("fechaHasta", valor),
    },
  ];

  async function resolverSolicitud(id, estado, motivoRechazo = "") {
    const actualizada = await actualizarEstadoSolicitudDonacion(id, estado, motivoRechazo);
    setItems((prev) =>
      prev.map((row) => (row.id === actualizada.id ? { ...row, ...actualizada } : row)),
    );
    window.dispatchEvent(new Event("donaciones-updated"));
  }

  const handleExportarPdf = async () => {
    if (exportando) return;
    setExportando(true);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      const partesFiltro = [];
      if (busqueda.trim()) partesFiltro.push(`Búsqueda: "${busqueda.trim()}"`);
      if (valoresFiltro.categoria && valoresFiltro.categoria !== "todas") {
        partesFiltro.push(`Categoría: ${valoresFiltro.categoria}`);
      }
      if (valoresFiltro.material && valoresFiltro.material !== "todos") {
        partesFiltro.push(`Material: ${valoresFiltro.material}`);
      }
      if (valoresFiltro.estado && valoresFiltro.estado !== "todos") {
        partesFiltro.push(`Estado: ${valoresFiltro.estado}`);
      }
      if (valoresFiltro.modalidad && valoresFiltro.modalidad !== "todas") {
        partesFiltro.push(`Modalidad: ${valoresFiltro.modalidad}`);
      }
      if (valoresFiltro.fechaDesde) {
        partesFiltro.push(`Desde: ${valoresFiltro.fechaDesde}`);
      }
      if (valoresFiltro.fechaHasta) {
        partesFiltro.push(`Hasta: ${valoresFiltro.fechaHasta}`);
      }

      const ahora = new Date();
      const fechaGeneracion = ahora.toLocaleString("es-CR", {
        dateStyle: "short",
        timeStyle: "short",
      });

      const logoData = await cargarLogoWebpParaPdf("/logo.webp");

      const pdf = construirPdfReporteDonaciones({
        solicitudes: solicitudesFiltradas,
        adminNombre: actor?.name || actor?.username || "Administrador",
        fechaGeneracion,
        filtrosTexto: partesFiltro.join(" | ") || "Ninguno",
        resumenEstados: resumen,
        logoData,
      });

      descargarArchivo(`reporte-donaciones-${stamp}.pdf`, pdf, "application/pdf", {
        binario: true,
      });
    } catch (err) {
      console.error(err);
      alert(t("No se pudo generar el reporte PDF."));
    } finally {
      setExportando(false);
    }
  };

  const handleDescargarFicha = async (solicitud) => {
    try {
      const ahora = new Date();
      const fechaGeneracion = ahora.toLocaleString("es-CR", {
        dateStyle: "short",
        timeStyle: "short",
      });
      const logoData = await cargarLogoWebpParaPdf("/logo.webp");
      const pdf = construirPdfFichaDonacion({
        solicitud,
        adminNombre: actor?.name || actor?.username || "Administrador",
        fechaGeneracion,
        logoData,
      });
      descargarArchivo(
        `ficha-donacion-${solicitud.id}.pdf`,
        pdf,
        "application/pdf",
        { binario: true },
      );
    } catch (err) {
      console.error(err);
      alert(t("No se pudo descargar la ficha de la donación en PDF."));
    }
  };

  if (showLoading) {
    return (
      <AdminLayout>
        <AdminPageGate showLoading message={loadingMessage} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Cabecera con Métricas y Acciones */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                <ST>Solicitudes de donación</ST>
              </h1>
              <p className="mt-1 max-w-2xl text-slate-600">
                <ST>Gestioná el estado y revisá los datos de cada solicitud de donación recibida.</ST>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportarPdf}
                disabled={status === "loading" || items.length === 0 || exportando}
                className={`${btnCancelarGris} gap-2 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50`}
                title={t("Exportar listado a PDF")}
              >
                {exportando ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                <ST>{exportando ? "Generando PDF..." : "Exportar PDF"}</ST>
              </button>

              <button
                type="button"
                onClick={recargar}
                disabled={status === "loading"}
                className={`${btnCancelarGris} gap-2 px-4 py-2 text-sm`}
              >
                <RefreshCw className={`size-4 ${status === "loading" ? "animate-spin" : ""}`} />
                <ST>Actualizar</ST>
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-10 gap-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-600"><ST>Total</ST></p>
              <p className="mt-0.5 text-2xl font-bold text-slate-950">{resumen.Total || 0}</p>
            </div>
            {ESTADOS.map((estado) => (
              <div key={estado}>
                <p className={`text-sm font-semibold ${claseEstado(estado)}`}><ST>{estado}</ST></p>
                <p className="mt-0.5 text-2xl font-bold text-slate-950">{resumen[estado] || 0}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Estado de Carga y Errores */}
        {status === "loading" ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-3 size-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
            <p className="text-sm text-slate-600"><ST>Cargando solicitudes de donación...</ST></p>
          </div>
        ) : null}

        {status !== "loading" && error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-semibold"><ST>{error}</ST></p>
            <button
              type="button"
              onClick={recargar}
              className={`${accionBtnBase} mt-4 border-rose-200 bg-rose-50 px-4 py-2 text-rose-700 hover:bg-rose-100`}
            >
              <ST>Reintentar</ST>
            </button>
          </div>
        ) : null}

        {status !== "loading" && !error && !puedeVer ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-600"><ST>No tiene permiso para ver solicitudes de donación.</ST></p>
          </div>
        ) : null}

        {status !== "loading" && !error && puedeVer && items.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-600"><ST>No hay solicitudes de donación registradas aún.</ST></p>
          </div>
        ) : null}

        {status !== "loading" && !error && puedeVer && items.length > 0 ? (
          <section className="overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm">
            <AdminListaToolbar
              busqueda={busqueda}
              onBusquedaChange={setBusqueda}
              placeholder="Buscar por ID, donante, categoría o material..."
              filtros={toolbarFiltros}
              total={total}
              visibles={visibles}
              hayFiltrosActivos={hayFiltrosActivos}
              onLimpiar={limpiarFiltros}
              filaClassName="mx-auto flex w-full min-w-0 flex-col items-stretch gap-5"
              filtrosContenedorClassName="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
            />

            {solicitudesFiltradas.length === 0 ? (
              <AdminListaVacia onLimpiar={limpiarFiltros} />
            ) : (
              <>
                {/* Tabla para Escritorio */}
                <div className="hidden md:block">
                  <div className="admin-table-shell">
                    <table className="w-full border-collapse text-left text-[length:var(--text-body)]">
                      <thead>
                        <tr>
                          <th><ST>ID</ST></th>
                          <th><ST>Donante</ST></th>
                          <th><ST>Donación</ST></th>
                          <th><ST>Fecha</ST></th>
                          <th><ST>Estado</ST></th>
                          <th className="text-center"><ST>Acciones</ST></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {solicitudesPagina.map((row) => {
                          const campos = camposSolicitudDonacion(row);
                          const modalidad = etiquetaModalidadCorta(campos);
                          return (
                            <tr key={row.id} className="transition hover:bg-slate-50/60">
                              <td className="whitespace-nowrap px-3 py-3 font-semibold text-slate-950">#{row.id}</td>
                              <td className="max-w-[14rem] px-3 py-3">
                                <div className="truncate font-semibold text-slate-950">
                                  {campos.donanteNombre || t("Sin nombre")}
                                </div>
                                <div className="mt-0.5 text-xs text-slate-500">
                                  <ST>{campos.tipoDonante}</ST>
                                </div>
                              </td>
                              <td className="max-w-[16rem] px-3 py-3">
                                <div className="truncate font-medium text-slate-800">
                                  {campos.categoria ? <ST>{campos.categoria}</ST> : t("No indicado")}
                                </div>
                                <div className="mt-0.5 truncate text-xs text-slate-500">
                                  {campos.material ? <ST>{campos.material}</ST> : t("Sin material")}
                                  {modalidad ? (
                                    <>
                                      {" · "}
                                      <ST>{modalidad}</ST>
                                    </>
                                  ) : null}
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-3 text-slate-700">
                                {formatFecha(campos.fechaSolicitud) || t("No indicada")}
                              </td>
                              <td className="px-3 py-3">
                                <BadgeEstado estado={campos.estado} />
                              </td>
                              <td className="px-3 py-3 text-center">
                                <AccionesSolicitud
                                  solicitud={row}
                                  onVer={() => setViendo(row)}
                                  onDescargarFicha={() => handleDescargarFicha(row)}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tarjetas para Móviles */}
                <div className="divide-y divide-slate-100 md:hidden">
                  {solicitudesPagina.map((row) => {
                    const campos = camposSolicitudDonacion(row);
                    return (
                      <article key={row.id} className="space-y-3 px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-950">
                              {campos.donanteNombre || t("Sin nombre")}
                            </h3>
                            <p className="mt-0.5 truncate text-sm text-slate-500">
                              {campos.correo || campos.telefono || t("Sin contacto")}
                            </p>
                          </div>
                          <BadgeEstado estado={campos.estado} />
                        </div>

                        <div className="grid gap-1 text-sm text-slate-600">
                          <p>
                            <span className="font-medium text-slate-800"><ST>ID</ST>:</span> #{row.id}
                          </p>
                          <p>
                            <span className="font-medium text-slate-800"><ST>Tipo</ST>:</span>{" "}
                            <ST>{campos.tipoDonante}</ST>
                          </p>
                          <p>
                            <span className="font-medium text-slate-800"><ST>Categoría</ST>:</span>{" "}
                            {campos.categoria ? <ST>{campos.categoria}</ST> : t("No indicado")}
                          </p>
                          <p>
                            <span className="font-medium text-slate-800"><ST>Material</ST>:</span>{" "}
                            {campos.material ? <ST>{campos.material}</ST> : t("No indicado")}
                          </p>
                          <p>
                            <span className="font-medium text-slate-800"><ST>Modalidad</ST>:</span>{" "}
                            {campos.metodoEntrega ? <ST>{campos.metodoEntrega}</ST> : t("No indicado")}
                          </p>
                          <p>
                            <span className="font-medium text-slate-800"><ST>Fecha</ST>:</span>{" "}
                            {formatFecha(campos.fechaSolicitud) || t("No indicada")}
                          </p>
                        </div>

                        <AccionesSolicitud
                          solicitud={row}
                          onVer={() => setViendo(row)}
                          onDescargarFicha={() => handleDescargarFicha(row)}
                          variant="mobile"
                        />
                      </article>
                    );
                  })}
                </div>

                {/* Paginación */}
                <AdminPaginacion
                  page={page}
                  totalPages={totalPages}
                  total={solicitudesFiltradas.length}
                  onChange={setPage}
                  label="Paginación de solicitudes de donación"
                />
              </>
            )}
          </section>
        ) : null}
      </div>

      {viendo ? (
        <ModalDetalle
          solicitud={viendo}
          puedeResolver={puedeResolver}
          onResolver={resolverSolicitud}
          onDescargarFicha={handleDescargarFicha}
          onCerrar={() => setViendo(null)}
        />
      ) : null}
    </AdminLayout>
  );
}
