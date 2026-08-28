import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Clock,
  Eye,
  GraduationCap,
  Hash,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { AdminLayout } from "../layouts/AdminLayout";
import { AdminModalActions, adminBtnCancel } from "../../../Components/Admin/ui/AdminModal";
import { useAdminModalLock } from "../../../hooks/useBodyScrollLock";
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminListaToolbar, AdminListaVacia } from "../../../Components/Admin/ui/AdminListaToolbar";
import { AdminPaginacion } from "../../../Components/Admin/ui/AdminPaginacion";
import { UiSelect } from "../../../Components/ui/Select";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { useAdminListaFiltros } from "../../../hooks/useAdminListaFiltros";
import { useAdminPaginacion } from "../../../hooks/useAdminPaginacion";
import {
  actualizarSolicitud,
  eliminarSolicitud,
  obtenerSolicitudes,
} from "../../../services/voluntariadoService";
import { getActiveSessionUser } from "../../../services/sessionService";
import { tienePermiso } from "../../../lib/permisos";

const ESTADOS = ["Pendiente", "En revisi\u00f3n", "Aprobado", "Rechazado"];

const TIPOS_VOLUNTARIADO = [
  "Apoyo General",
  "Capacitaciones",
  "Investigaci\u00f3n Acad\u00e9mica",
  "Actividades de limpieza y mantenimiento",
  "Otro",
];

const accionBtnBase =
  "inline-flex items-center justify-center gap-1 rounded-full border text-[11px] font-semibold leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

const btnNegro =
  "inline-flex items-center justify-center rounded-full border border-slate-950 bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:border-neutral-700 hover:bg-neutral-700 active:border-neutral-700 active:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60";

const btnCancelarGris =
  "inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60";

const inputModalCls =
  "rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-0";

const colorEstado = {
  Pendiente: "text-amber-600",
  "En revisi\u00f3n": "text-blue-600",
  Aprobado: "text-green-600",
  Rechazado: "text-red-600",
};

function normalizarEstado(estado) {
  const normalized = String(estado || "Pendiente")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalized === "aprobada" || normalized === "aprobado") return "Aprobado";
  if (normalized === "rechazada" || normalized === "rechazado") return "Rechazado";
  if (normalized === "en revision" || normalized === "revision") return "En revisi\u00f3n";
  return "Pendiente";
}

function normalizarSolicitud(solicitud) {
  return {
    ...solicitud,
    estado: normalizarEstado(solicitud?.estado),
    observacionesAdmin:
      solicitud?.observacionesAdmin ?? solicitud?.ObservacionesAdmin ?? "",
  };
}

function claseEstado(estado) {
  return colorEstado[normalizarEstado(estado)] ?? "text-slate-700";
}

function BadgeEstado({ estado }) {
  const estadoNormalizado = normalizarEstado(estado);
  return (
    <span className={`text-xs font-semibold ${claseEstado(estadoNormalizado)}`}>
      {estadoNormalizado}
    </span>
  );
}

const CAMPOS_EDITABLES = [
  { name: "nombre", label: "Nombre completo" },
  { name: "email", label: "Correo electr\u00f3nico", type: "email" },
  { name: "telefono", label: "Tel\u00e9fono" },
  { name: "identificacion", label: "Identificaci\u00f3n" },
  { name: "institucion", label: "Instituci\u00f3n educativa" },
  { name: "pais", label: "Pa\u00eds de residencia" },
  { name: "tipoVoluntariado", label: "Tipo de voluntariado" },
  { name: "dias", label: "Per\u00edodo de voluntariado" },
  { name: "horario", label: "Horario y disponibilidad" },
];

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SV";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
};

function DetailField({ icon: Icon, label, value, className = "" }) {
  return (
    <div className={`grid gap-2 ${className}`}>
      <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
        <Icon className="size-4 text-slate-500" />
        {label}
      </span>
      <p className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
        {value || "No indicado"}
      </p>
    </div>
  );
}

function AccionesSolicitud({
  solicitud,
  eliminando,
  esSuperAdmin,
  onVer,
  onEditar,
  onEliminar,
  variant = "table",
}) {
  const esMovil = variant === "mobile";
  const verCls = `${accionBtnBase} border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300`;
  const editarCls = `${accionBtnBase} border-slate-950 bg-slate-950 text-white hover:border-neutral-700 hover:bg-neutral-700 active:border-neutral-700 active:bg-neutral-700 focus-visible:ring-slate-400`;
  const eliminarCls = `${accionBtnBase} border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-300`;

  if (esMovil) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={onVer} className={`${verCls} h-8 px-2.5`}>
          <Eye className="size-3 shrink-0" aria-hidden="true" />
          <span>Ver</span>
        </button>
        <button type="button" onClick={onEditar} className={`${editarCls} h-8 px-2.5`}>
          <Pencil className="size-3 shrink-0" aria-hidden="true" />
          <span>Editar</span>
        </button>
        {esSuperAdmin ? (
          <button
            type="button"
            onClick={onEliminar}
            disabled={eliminando === solicitud.id}
            className={`${eliminarCls} h-8 px-2.5 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {eliminando === solicitud.id ? (
              <RefreshCw className="size-3 shrink-0 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="size-3 shrink-0" aria-hidden="true" />
            )}
            <span>Eliminar</span>
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <button type="button" onClick={onVer} className={`${verCls} h-7 px-2`} title="Ver solicitud">
        <Eye className="size-3 shrink-0" aria-hidden="true" />
        <span>Ver</span>
      </button>
      <button type="button" onClick={onEditar} className={`${editarCls} h-7 px-2`} title="Editar solicitud">
        <Pencil className="size-3 shrink-0" aria-hidden="true" />
        <span>Editar</span>
      </button>
      {esSuperAdmin ? (
        <button
          type="button"
          onClick={onEliminar}
          disabled={eliminando === solicitud.id}
          className={`${eliminarCls} h-7 px-2 disabled:cursor-not-allowed disabled:opacity-50`}
          title="Eliminar solicitud"
        >
          {eliminando === solicitud.id ? (
            <RefreshCw className="size-3 shrink-0 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="size-3 shrink-0" aria-hidden="true" />
          )}
          <span>Eliminar</span>
        </button>
      ) : null}
    </div>
  );
}

function ModalDetalle({ solicitud, onGuardar, onCerrar }) {
  useAdminModalLock(true);
  const [estado, setEstado] = useState(normalizarEstado(solicitud.estado));
  const [observacionesAdmin, setObservacionesAdmin] = useState(solicitud.observacionesAdmin || "");
  const [guardando, setGuardando] = useState(false);
  const esGrupal = solicitud.modalidad === "grupal";

  const btnEstadoBase = `${accionBtnBase} px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50`;
  const btnRevision = `${btnEstadoBase} border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300`;
  const btnAprobar = `${btnEstadoBase} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-300`;
  const btnRechazar = `${btnEstadoBase} border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-300`;

  const guardarCambios = async (nuevoEstado = estado) => {
    setGuardando(true);
    try {
      await onGuardar(solicitud.id, {
        estado: nuevoEstado,
        observacionesAdmin,
      });
      onCerrar();
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (nuevoEstado) => {
    setEstado(nuevoEstado);
    await guardarCambios(nuevoEstado);
  };

  return createPortal(
    <div className="admin-modal-root">
      <div
        className="admin-modal-backdrop"
        aria-hidden="true"
        onClick={onCerrar}
        onWheel={(event) => event.preventDefault()}
        onTouchMove={(event) => event.preventDefault()}
      />
      <div className="relative z-10 max-h-[92dvh] w-full max-w-3xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Ver solicitud</h2>
            <p className="text-sm text-slate-500">
              Solicitud #{solicitud.id} · Recibida el {solicitud.fechaSolicitud || "sin fecha"}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="max-h-[68vh] overflow-y-auto px-6 py-5">
          <header className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="grid size-14 shrink-0 place-items-center rounded-full bg-slate-950 text-base font-bold text-white">
              {getInitials(solicitud.nombre)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold text-slate-950">{solicitud.nombre || "Sin nombre"}</h3>
              <div className="mt-2">
                <BadgeEstado estado={estado} />
              </div>
            </div>
          </header>

          <section className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Datos de la solicitud</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailField icon={UserRound} label="Nombre completo" value={solicitud.nombre} />
              <DetailField icon={Mail} label={"Correo electr\u00f3nico"} value={solicitud.email} />
              <DetailField icon={Phone} label={"Tel\u00e9fono"} value={solicitud.telefono} />
              <DetailField icon={Hash} label={"Identificaci\u00f3n"} value={solicitud.identificacion} />
              <DetailField icon={GraduationCap} label={"Instituci\u00f3n educativa"} value={solicitud.institucion} />
              <DetailField icon={MapPin} label={"Pa\u00eds de residencia"} value={solicitud.pais} />
              <DetailField
                icon={Users}
                label="Modalidad"
                value={esGrupal ? "Grupal" : "Individual"}
              />
              {esGrupal ? (
                <DetailField
                  icon={Users}
                  label="Cantidad de participantes"
                  value={String(solicitud.cantidadParticipantes || "No indicado")}
                />
              ) : null}
              <DetailField icon={GraduationCap} label="Tipo de voluntariado" value={solicitud.tipoVoluntariado} />
              <DetailField icon={Calendar} label="Fecha de solicitud" value={solicitud.fechaSolicitud} />
              <DetailField icon={Calendar} label={"Per\u00edodo de voluntariado"} value={solicitud.dias} className="md:col-span-2" />
              <DetailField icon={Clock} label="Horario y disponibilidad" value={solicitud.horario} className="md:col-span-2" />
            </div>
          </section>

          <section className="mt-6 space-y-4 border-t border-slate-100 pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">{"Panel de administraci\u00f3n"}</h4>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Observaciones / motivo de rechazo
              <textarea
                value={observacionesAdmin}
                onChange={(event) => setObservacionesAdmin(event.target.value)}
                rows={3}
                className={`${inputModalCls} min-h-[6rem] resize-none rounded-2xl`}
                placeholder="Indique observaciones internas o el motivo si la solicitud es rechazada..."
              />
            </label>
          </section>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={guardando} onClick={() => cambiarEstado("En revisi\u00f3n")} className={btnRevision}>
              {"Marcar en revisi\u00f3n"}
            </button>
            <button type="button" disabled={guardando} onClick={() => cambiarEstado("Aprobado")} className={btnAprobar}>
              Aprobar
            </button>
            <button type="button" disabled={guardando} onClick={() => cambiarEstado("Rechazado")} className={btnRechazar}>
              Rechazar
            </button>
          </div>
          <div className="flex flex-row flex-wrap justify-end gap-2">
            <button type="button" disabled={guardando} onClick={() => guardarCambios()} className={btnNegro}>
              {guardando ? "Guardando..." : "Guardar observaciones"}
            </button>
            <button type="button" onClick={onCerrar} className={btnCancelarGris}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ModalEditar({ solicitud, onGuardar, onCerrar }) {
  useAdminModalLock(true);
  const [form, setForm] = useState(() => ({
    estado: normalizarEstado(solicitud.estado),
    nombre: solicitud.nombre || "",
    email: solicitud.email || "",
    telefono: solicitud.telefono || "",
    tipoVoluntariado: solicitud.tipoVoluntariado || "",
    identificacion: solicitud.identificacion || "",
    institucion: solicitud.institucion || "",
    pais: solicitud.pais || "",
    horario: solicitud.horario || "",
    dias: solicitud.dias || "",
    modalidad: solicitud.modalidad || "individual",
    cantidadParticipantes: solicitud.cantidadParticipantes || 1,
    observacionesAdmin: solicitud.observacionesAdmin || "",
  }));
  const [guardando, setGuardando] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setGuardando(true);
    await onGuardar(solicitud.id, form);
    setGuardando(false);
  };

  return createPortal(
    <div className="admin-modal-root">
      <div
        className="admin-modal-backdrop"
        aria-hidden="true"
        onClick={onCerrar}
        onWheel={(event) => event.preventDefault()}
        onTouchMove={(event) => event.preventDefault()}
      />
      <form onSubmit={handleSubmit} className="relative z-10 max-h-[92dvh] w-full max-w-3xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Editar solicitud</h2>
            <p className="text-sm text-slate-500">{"Actualiz\u00e1 los datos o el estado del voluntariado."}</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="max-h-[68vh] overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2 text-sm font-medium text-slate-700">
              Estado
              <UiSelect
                ariaLabel="Estado"
                value={form.estado}
                onChange={(valor) => handleChange({ target: { name: "estado", value: valor } })}
                options={ESTADOS.map((estado) => ({ value: estado, label: estado }))}
              />
            </div>

            <div className="grid gap-2 text-sm font-medium text-slate-700">
              Modalidad
              <UiSelect
                ariaLabel="Modalidad"
                value={form.modalidad}
                onChange={(valor) => handleChange({ target: { name: "modalidad", value: valor } })}
                options={[
                  { value: "individual", label: "Individual" },
                  { value: "grupal", label: "Grupal" },
                ]}
              />
            </div>

            {CAMPOS_EDITABLES.map((campo) => (
              <label key={campo.name} className={`grid gap-2 text-sm font-medium text-slate-700 ${campo.name === "horario" || campo.name === "dias" ? "md:col-span-2" : ""}`}>
                {campo.label}
                <input
                  type={campo.type || "text"}
                  name={campo.name}
                  value={form[campo.name]}
                  onChange={handleChange}
                  className={inputModalCls}
                />
              </label>
            ))}

            {form.modalidad === "grupal" ? (
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Cantidad de participantes
                <input
                  type="number"
                  name="cantidadParticipantes"
                  min="2"
                  value={form.cantidadParticipantes}
                  onChange={handleChange}
                  className={inputModalCls}
                />
              </label>
            ) : null}

            <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
              Observaciones / motivo de rechazo
              <textarea
                name="observacionesAdmin"
                value={form.observacionesAdmin}
                onChange={handleChange}
                rows={3}
                className={`${inputModalCls} min-h-[6rem] resize-none rounded-2xl`}
              />
            </label>
          </div>
        </div>

        <div className="flex flex-row flex-wrap justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <AdminModalActions
            onCancel={onCerrar}
            primaryLabel={guardando ? "Guardando..." : "Guardar cambios"}
            primaryDisabled={guardando}
            primaryClassName={btnNegro}
            cancelClassName={btnCancelarGris}
          />
        </div>
      </form>
    </div>,
    document.body,
  );
}

const AdminVoluntariado = () => {
  const actor = (() => {
    try {
      return getActiveSessionUser();
    } catch {
      return null;
    }
  })();
  const actorRoles = Array.isArray(actor?.roles) ? actor.roles : [];
  const esSuperAdmin = tienePermiso(actorRoles, "inactivar_voluntariado");

  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [viendo, setViendo] = useState(null);
  const [editando, setEditando] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  const filtrosConfig = useMemo(
    () => [
      {
        id: "tipo",
        valorInicial: "todos",
        obtenerValor: (solicitud) => solicitud.tipoVoluntariado,
      },
      {
        id: "estado",
        valorInicial: "todos",
        obtenerValor: (solicitud) => normalizarEstado(solicitud.estado),
      },
      {
        id: "fecha",
        valorInicial: "",
        aplicar: (items, valor) => {
          if (!valor) return items;
          return items.filter((solicitud) => solicitud.fechaSolicitud === valor);
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
  } = useAdminListaFiltros(solicitudes, {
    buscarEn: (solicitud) => [
      solicitud.nombre,
      solicitud.email,
      solicitud.telefono,
      solicitud.identificacion,
      solicitud.institucion,
      solicitud.tipoVoluntariado,
      solicitud.pais,
      normalizarEstado(solicitud.estado),
    ],
    filtrosConfig,
  });

  const {
    page,
    setPage,
    pageItems: solicitudesPagina,
    totalPages,
  } = useAdminPaginacion(solicitudesFiltradas);

  const { showLoading, loadingMessage } = useAdminPageGate("/admin/voluntariado", !cargando);

  const cargarSolicitudes = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerSolicitudes();
      setSolicitudes(Array.isArray(data) ? data.map(normalizarSolicitud) : []);
    } catch (err) {
      setError("No se pudieron cargar las solicitudes de voluntariado.");
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]);

  const resumen = useMemo(() => {
    return solicitudes.reduce((acc, solicitud) => {
      const estado = normalizarEstado(solicitud.estado);
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, Object.fromEntries(ESTADOS.map((estado) => [estado, 0])));
  }, [solicitudes]);

  const handleActualizar = async (id, cambios) => {
    try {
      const actualizada = await actualizarSolicitud(id, cambios);
      const normalizada = normalizarSolicitud({ ...(actualizada || cambios), id });
      setSolicitudes((prev) => prev.map((solicitud) => (solicitud.id === id ? { ...solicitud, ...normalizada } : solicitud)));
      setEditando(null);
      setViendo(null);
      window.dispatchEvent(new Event("voluntariado-updated"));
    } catch (err) {
      alert("Error al actualizar la solicitud. Intent\u00e1 de nuevo.");
      console.error(err);
    }
  };

  const handleEliminar = async (solicitud) => {
    if (!esSuperAdmin) {
      alert("Solo SuperAdmin puede eliminar solicitudes de voluntariado.");
      return;
    }

    const confirmar = window.confirm(`\u00bfDese\u00e1s eliminar la solicitud de ${solicitud.nombre || "esta persona"}?`);
    if (!confirmar) return;

    setEliminando(solicitud.id);
    try {
      await eliminarSolicitud(solicitud.id);
      setSolicitudes((prev) => prev.filter((item) => item.id !== solicitud.id));
      window.dispatchEvent(new Event("voluntariado-updated"));
    } catch (err) {
      alert("Error al eliminar la solicitud. Intent\u00e1 de nuevo.");
      console.error(err);
    } finally {
      setEliminando(null);
    }
  };

  const toolbarFiltros = [
    {
      id: "tipo",
      label: "Tipo",
      value: valoresFiltro.tipo ?? "todos",
      onChange: (valor) => setValorFiltro("tipo", valor),
      opciones: [
        { value: "todos", label: "Todos los tipos" },
        ...TIPOS_VOLUNTARIADO.map((tipo) => ({ value: tipo, label: tipo })),
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
      id: "fecha",
      label: "Fecha",
      tipo: "fecha",
      value: valoresFiltro.fecha ?? "",
      onChange: (valor) => setValorFiltro("fecha", valor),
    },
  ];

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
      <AdminLayout>
        <section className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Solicitudes registradas</h1>
                <p className="mt-1 max-w-2xl text-slate-600">{"Gestion\u00e1 el estado y los datos de cada solicitud de voluntariado recibida."}</p>
              </div>

              <button
                type="button"
                onClick={cargarSolicitudes}
                disabled={cargando}
                className={`${btnCancelarGris} gap-2 px-4 py-2 text-sm`}
              >
                <RefreshCw className={`size-4 ${cargando ? "animate-spin" : ""}`} />
                Actualizar
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-10 gap-y-3">
              {ESTADOS.map((estado) => (
                <div key={estado}>
                  <p className={`text-sm font-semibold ${colorEstado[estado]}`}>{estado}</p>
                  <p className="mt-0.5 text-2xl font-bold text-slate-950">{resumen[estado] || 0}</p>
                </div>
              ))}
            </div>
          </div>

          {cargando ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-3 size-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
              <p className="text-sm text-slate-600">Cargando solicitudes...</p>
            </div>
          ) : null}

          {!cargando && error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
              <p className="font-semibold">{error}</p>
              <button
                type="button"
                onClick={cargarSolicitudes}
                className={`${accionBtnBase} mt-4 border-rose-200 bg-rose-50 px-4 py-2 text-rose-700 hover:bg-rose-100`}
              >
                Reintentar
              </button>
            </div>
          ) : null}

          {!cargando && !error && solicitudes.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-slate-600">{"No hay solicitudes registradas a\u00fan."}</p>
            </div>
          ) : null}

          {!cargando && !error && solicitudes.length > 0 ? (
            <>
              <div className="overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm">
                <AdminListaToolbar
                  busqueda={busqueda}
                  onBusquedaChange={setBusqueda}
                  placeholder={"Buscar por nombre, correo, identificaci\u00f3n o instituci\u00f3n..."}
                  filtros={toolbarFiltros}
                  total={total}
                  visibles={visibles}
                  hayFiltrosActivos={hayFiltrosActivos}
                  onLimpiar={limpiarFiltros}
                  compacto
                />

                {solicitudesFiltradas.length === 0 ? (
                  <AdminListaVacia onLimpiar={limpiarFiltros} />
                ) : (
                  <>
                    <div className="hidden overflow-hidden md:block">
                      <div className="admin-table-shell">
                        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                          <thead>
                            <tr>
                              <th>Nombre</th>
                              <th>Tipo de voluntariado</th>
                              <th>Fecha</th>
                              <th>Estado</th>
                              <th>Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {solicitudesPagina.map((solicitud) => (
                              <tr key={solicitud.id} className="transition hover:bg-slate-50/60">
                                <td className="px-5 py-4">
                                  <div className="font-semibold text-slate-950">{solicitud.nombre || "Sin nombre"}</div>
                                  <div className="mt-1 text-xs text-slate-500">{solicitud.email || "Sin correo"}</div>
                                </td>
                                <td className="px-5 py-4 text-slate-700">{solicitud.tipoVoluntariado || "No indicado"}</td>
                                <td className="px-5 py-4 text-slate-700">{solicitud.fechaSolicitud || "No indicada"}</td>
                                <td className="px-5 py-4">
                                  <BadgeEstado estado={solicitud.estado} />
                                </td>
                                <td className="px-5 py-4">
                                  <AccionesSolicitud
                                    solicitud={solicitud}
                                    eliminando={eliminando}
                                    esSuperAdmin={esSuperAdmin}
                                    onVer={() => setViendo(solicitud)}
                                    onEditar={() => setEditando(solicitud)}
                                    onEliminar={() => handleEliminar(solicitud)}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100 md:hidden">
                      {solicitudesPagina.map((solicitud) => (
                        <article key={solicitud.id} className="space-y-3 px-4 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-slate-950">{solicitud.nombre || "Sin nombre"}</h3>
                              <p className="mt-0.5 truncate text-sm text-slate-500">{solicitud.email || "Sin correo"}</p>
                            </div>
                            <BadgeEstado estado={solicitud.estado} />
                          </div>

                          <div className="grid gap-1 text-sm text-slate-600">
                            <p><span className="font-medium text-slate-800">Tipo:</span> {solicitud.tipoVoluntariado || "No indicado"}</p>
                            <p><span className="font-medium text-slate-800">Fecha:</span> {solicitud.fechaSolicitud || "No indicada"}</p>
                          </div>

                          <AccionesSolicitud
                            solicitud={solicitud}
                            eliminando={eliminando}
                            esSuperAdmin={esSuperAdmin}
                            onVer={() => setViendo(solicitud)}
                            onEditar={() => setEditando(solicitud)}
                            onEliminar={() => handleEliminar(solicitud)}
                            variant="mobile"
                          />
                        </article>
                      ))}
                    </div>
                    <AdminPaginacion
                      page={page}
                      totalPages={totalPages}
                      total={solicitudesFiltradas.length}
                      onChange={setPage}
                      label={"Paginaci\u00f3n de voluntariado"}
                    />
                  </>
                )}
              </div>
            </>
          ) : null}
        </section>

        {viendo ? (
          <ModalDetalle solicitud={viendo} onGuardar={handleActualizar} onCerrar={() => setViendo(null)} />
        ) : null}
        {editando ? (
          <ModalEditar solicitud={editando} onGuardar={handleActualizar} onCerrar={() => setEditando(null)} />
        ) : null}
      </AdminLayout>
    </AdminPageGate>
  );
};

export default AdminVoluntariado;
