import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Accessibility,
  Calendar,
  CalendarDays,
  Car,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  GraduationCap,
  Hash,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { AdminLayout } from "../layouts/AdminLayout";
import {
  AdminListaToolbar,
  AdminListaVacia,
} from "../../../Components/Admin/ui/AdminListaToolbar";
import { AdminPaginacion } from "../../../Components/Admin/ui/AdminPaginacion";
import { AdminModal } from "../../../Components/Admin/ui/AdminModal";
import { ST } from "../../../Components/T/ST";
import { useAdminListaFiltros } from "../../../hooks/useAdminListaFiltros";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { useAdminPaginacion } from "../../../hooks/useAdminPaginacion";
import { useTraducir } from "../../../hooks/useTraducir";
import { rolesDeUsuario, tienePermiso } from "../../../lib/permisos";
import { getActiveSessionUser } from "../../../services/sessionService";
import {
  actualizarSolicitudVisita,
  eliminarSolicitudVisita,
  obtenerSolicitudesVisitas,
} from "../../../services/visitasService";
import { GestionFechasVisitas } from "./GestionFechasVisitas";

const STATES = ["Pendiente", "En revisión", "Aprobada", "Rechazada", "Inactiva"];

function badgeEstado(estadoRaw) {
  switch (String(estadoRaw || "").trim()) {
    case "Pendiente":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "En revisión":
      return "bg-sky-50 text-sky-800 border-sky-200";
    case "Aprobada":
    case "Aprobado":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "Rechazada":
    case "Rechazado":
      return "bg-rose-50 text-rose-800 border-rose-200";
    case "Inactiva":
    case "Inactivo":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function BadgeEstado({ estado }) {
  return (
    <span
      className={`admin-chip-estado inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${badgeEstado(estado)}`}
    >
      <ST>{estado || "Pendiente"}</ST>
    </span>
  );
}

const getInitials = (name = "") => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "VG";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
};

function DetailField({ icon: Icon, label, value, className = "", traducirValor = false }) {
  const tVacio = useTraducir("No indicado");
  const mostrar = value
    ? traducirValor
      ? <ST>{value}</ST>
      : value
    : tVacio;
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
        {Icon ? <Icon className="size-3.5 text-slate-500" /> : null}
        <ST>{label}</ST>
      </span>
      <p className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 break-words">
        {mostrar}
      </p>
    </div>
  );
}

const accionBtnBase =
  "inline-flex items-center justify-center gap-1.5 rounded-full border text-xs font-semibold transition focus-visible:outline-hidden focus-visible:ring-2";
const verCls = `${accionBtnBase} border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300`;
const editarCls = `${accionBtnBase} border-slate-950 bg-slate-950 text-white hover:border-neutral-700 hover:bg-neutral-700 active:border-neutral-700 active:bg-neutral-700 focus-visible:ring-slate-400`;
const btnEstadoBase = `${accionBtnBase} px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50`;
const btnRevision = `${btnEstadoBase} border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300`;
const btnAprobar = `${btnEstadoBase} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:ring-emerald-300`;
const btnRechazar = `${btnEstadoBase} border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-300`;
const btnInactivar = `${btnEstadoBase} border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-300`;
const btnNegro = `${accionBtnBase} px-4 py-2 border-slate-950 bg-slate-950 text-white hover:border-neutral-700 hover:bg-neutral-700 active:border-neutral-700 active:bg-neutral-700 focus-visible:ring-slate-400 disabled:opacity-50`;
const btnCancelarGris = `${accionBtnBase} px-4 py-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300`;

function ModalDetalleVisita({ solicitud, onGuardar, onInactivar, onCerrar }) {
  const [estado, setEstado] = useState(solicitud.estado || "Pendiente");
  const [observacionesAdmin, setObservacionesAdmin] = useState(solicitud.observaciones || "");
  const [guardando, setGuardando] = useState(false);

  const guardarCambios = async (nuevoEstado = estado) => {
    setGuardando(true);
    try {
      await onGuardar(solicitud.id, {
        Estado: nuevoEstado,
        Observaciones: observacionesAdmin,
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

  const handleInactivar = async () => {
    if (onInactivar) {
      onCerrar();
      await onInactivar(solicitud);
    }
  };

  return (
    <AdminModal open onClose={onCerrar} maxWidth="max-w-xl" labelledBy="visita-detalle-title">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h2 id="visita-detalle-title" className="text-lg font-semibold text-slate-950">
            <ST>Ver solicitud</ST>
          </h2>
          <p className="text-sm text-slate-500">
            <ST>Solicitud</ST> #{solicitud.id} · <ST>Recibida el</ST> {solicitud.fechaSolicitud || "Sin fecha"}
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
            {getInitials(solicitud.encargadoNombre)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold text-slate-950 truncate">
              {solicitud.encargadoNombre || "Sin nombre"}
            </h3>
            <div className="mt-2">
              <BadgeEstado estado={estado} />
            </div>
          </div>
        </header>

        <section className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
            <ST>Datos de la solicitud</ST>
          </h4>
          <div className="grid gap-4 md:grid-cols-2">
            <DetailField icon={UserRound} label="Encargado / Responsable" value={solicitud.encargadoNombre} />
            <DetailField icon={Hash} label="Identificación" value={solicitud.encargadoIdentificacion} />
            <DetailField icon={Mail} label="Correo electrónico" value={solicitud.encargadoEmail} />
            <DetailField icon={Phone} label="Teléfono" value={solicitud.encargadoTelefono} />
            <DetailField icon={GraduationCap} label="Institución educativa" value={solicitud.encargadoInstitucion} />
            <DetailField icon={MapPin} label="Procedencia" value={`${solicitud.tipoVisitante || "Nacional"} · ${solicitud.ciudadProvincia || "No indicada"}`} />
            <DetailField icon={Users} label="Tipo de grupo" value={solicitud.tipoGrupo} />
            <DetailField icon={Users} label="Cantidad de participantes" value={`${solicitud.cantidadVisitantes || 1} personas`} />
            <DetailField icon={Calendar} label="Fecha de visita" value={solicitud.fechaVisita} />
            <DetailField icon={Clock} label="Horario preferido" value={solicitud.horaPreferida || "Horario pendiente"} />
            <DetailField icon={Accessibility} label="Accesibilidad" value={solicitud.requiereAccesibilidad ? "Sí, requiere facilidades de accesibilidad" : "No"} />
            <DetailField icon={Car} label="Parqueo" value={solicitud.requiereParqueoBus ? "Sí, requiere parqueo" : "No"} />
            <DetailField icon={FileText} label="Motivo de la visita" value={solicitud.motivoVisita} className="md:col-span-2" />
          </div>
        </section>

        <section className="mt-6 space-y-4 border-t border-slate-100 pt-6">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
            <ST>Panel de administración</ST>
          </h4>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <ST>Observaciones / motivo de rechazo</ST>
            <textarea
              value={observacionesAdmin}
              onChange={(event) => setObservacionesAdmin(event.target.value)}
              rows={3}
              className="min-h-[6rem] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden"
              placeholder="Indique observaciones internas o el motivo si la solicitud es rechazada..."
            />
          </label>
        </section>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={guardando}
            onClick={() => cambiarEstado("En revisión")}
            className={btnRevision}
          >
            <ST>Marcar en revisión</ST>
          </button>
          <button
            type="button"
            disabled={guardando}
            onClick={() => cambiarEstado("Aprobada")}
            className={btnAprobar}
          >
            <ST>Aprobar</ST>
          </button>
          <button
            type="button"
            disabled={guardando}
            onClick={() => cambiarEstado("Rechazada")}
            className={btnRechazar}
          >
            <ST>Rechazar</ST>
          </button>
          {onInactivar ? (
            <button
              type="button"
              disabled={guardando}
              onClick={handleInactivar}
              className={btnInactivar}
              aria-label={`Inactivar solicitud ${solicitud.id}`}
            >
              <ST>Inactivar</ST>
            </button>
          ) : null}
        </div>
        <div className="flex flex-row flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={guardando}
            onClick={() => guardarCambios()}
            className={btnNegro}
          >
            {guardando ? "Guardando..." : "Guardar observaciones"}
          </button>
          <button
            type="button"
            onClick={onCerrar}
            className={btnCancelarGris}
          >
            <ST>Cerrar</ST>
          </button>
        </div>
      </div>
    </AdminModal>
  );
}


function ModalEditarVisita({ solicitud, onGuardar, onCerrar }) {
  const [form, setForm] = useState({
    encargadoNombre: solicitud.encargadoNombre || "",
    encargadoEmail: solicitud.encargadoEmail || "",
    encargadoTelefono: solicitud.encargadoTelefono || "",
    encargadoInstitucion: solicitud.encargadoInstitucion || "",
    cantidadVisitantes: solicitud.cantidadVisitantes || 2,
    tipoGrupo: solicitud.tipoGrupo || "",
    estado: solicitud.estado || "Pendiente",
    observaciones: solicitud.observaciones || "",
  });
  const [guardando, setGuardando] = useState(false);

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await onGuardar(solicitud.id, {
        EncargadoNombre: form.encargadoNombre,
        EncargadoEmail: form.encargadoEmail,
        EncargadoTelefono: form.encargadoTelefono,
        EncargadoInstitucion: form.encargadoInstitucion,
        CantidadVisitantes: Number(form.cantidadVisitantes),
        TipoGrupo: form.tipoGrupo,
        Estado: form.estado,
        Observaciones: form.observaciones,
      });
      onCerrar();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <AdminModal open onClose={onCerrar} maxWidth="max-w-xl" labelledBy="visita-editar-title">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h2 id="visita-editar-title" className="text-lg font-semibold text-slate-950">
            <ST>Editar solicitud</ST>
          </h2>
          <p className="text-sm text-slate-500">
            <ST>Solicitud</ST> #{solicitud.id} · <ST>Modificá los datos del grupo o encargado.</ST>
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

      <form onSubmit={guardar} id="form-editar-visita" className="flex min-h-0 flex-1 flex-col">
        <div className="max-h-[68vh] overflow-y-auto px-6 py-5 space-y-4">
          <label className="grid gap-1 text-xs font-semibold text-slate-700">
            <ST>Nombre del encargado</ST>
            <input
              type="text"
              value={form.encargadoNombre}
              onChange={(e) => setForm((c) => ({ ...c, encargadoNombre: e.target.value }))}
              className="rounded-2xl border border-slate-300 p-2.5 text-xs sm:text-sm focus:border-slate-950 focus:outline-hidden"
              required
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-semibold text-slate-700">
              <ST>Correo electrónico</ST>
              <input
                type="email"
                value={form.encargadoEmail}
                onChange={(e) => setForm((c) => ({ ...c, encargadoEmail: e.target.value }))}
                className="rounded-2xl border border-slate-300 p-2.5 text-xs sm:text-sm focus:border-slate-950 focus:outline-hidden"
                required
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-700">
              <ST>Teléfono</ST>
              <input
                type="text"
                value={form.encargadoTelefono}
                onChange={(e) => setForm((c) => ({ ...c, encargadoTelefono: e.target.value }))}
                className="rounded-2xl border border-slate-300 p-2.5 text-xs sm:text-sm focus:border-slate-950 focus:outline-hidden"
                required
              />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-semibold text-slate-700">
              <ST>Cantidad de visitantes</ST>
              <input
                type="number"
                min="2"
                value={form.cantidadVisitantes}
                onChange={(e) => setForm((c) => ({ ...c, cantidadVisitantes: e.target.value }))}
                className="rounded-2xl border border-slate-300 p-2.5 text-xs sm:text-sm focus:border-slate-950 focus:outline-hidden"
                required
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-700">
              <ST>Estado</ST>
              <select
                value={form.estado}
                onChange={(e) => setForm((c) => ({ ...c, estado: e.target.value }))}
                className="rounded-2xl border border-slate-300 p-2.5 text-xs sm:text-sm focus:border-slate-950 focus:outline-hidden"
              >
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="grid gap-1 text-xs font-semibold text-slate-700">
            <ST>Institución</ST>
            <input
              type="text"
              value={form.encargadoInstitucion}
              onChange={(e) => setForm((c) => ({ ...c, encargadoInstitucion: e.target.value }))}
              className="rounded-2xl border border-slate-300 p-2.5 text-xs sm:text-sm focus:border-slate-950 focus:outline-hidden"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-slate-700">
            <ST>Observaciones</ST>
            <textarea
              value={form.observaciones}
              onChange={(e) => setForm((c) => ({ ...c, observaciones: e.target.value }))}
              rows={3}
              className="rounded-2xl border border-slate-300 p-2.5 text-xs sm:text-sm focus:border-slate-950 focus:outline-hidden resize-none"
            />
          </label>
        </div>
        <div className="flex flex-row flex-wrap justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button
            type="submit"
            disabled={guardando}
            className={btnNegro}
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={onCerrar}
            className={btnCancelarGris}
          >
            <ST>Cerrar</ST>
          </button>
        </div>
      </form>
    </AdminModal>
  );
}

export default function AdminVisitas() {
  const user = getActiveSessionUser();
  const roles = rolesDeUsuario(user);
  const canManage = tienePermiso(roles, "administrar_solicitudes_visitantes");
  const esSuperAdmin = roles.includes("SuperAdmin") || tienePermiso(roles, "inactivar_visitas") || canManage;

  const [tabActiva, setTabActiva] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get("tab") === "fechas" ? "fechas" : "solicitudes";
    } catch {
      return "solicitudes";
    }
  });

  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [viendo, setViendo] = useState(null);
  const [editando, setEditando] = useState(null);

  const { showLoading, loadingMessage } = useAdminPageGate("/admin/visitas", !loading);

  const filtrosConfig = useMemo(
    () => [
      {
        id: "estado",
        valorInicial: "todos",
        obtenerValor: (solicitud) => solicitud.estado,
      },
      {
        id: "fecha",
        valorInicial: "",
        aplicar: (items, valor) => {
          if (!valor) return items;
          return items.filter((solicitud) => solicitud.fechaVisita === valor);
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
      solicitud.encargadoNombre,
      solicitud.encargadoEmail,
      solicitud.encargadoIdentificacion,
      solicitud.encargadoInstitucion,
      solicitud.tipoGrupo,
      solicitud.ciudadProvincia,
      solicitud.estado,
    ],
    filtrosConfig,
  });

  const {
    page,
    setPage,
    pageItems: solicitudesPagina,
    totalPages,
  } = useAdminPaginacion(solicitudesFiltradas);

  const cambiarTab = (nuevaTab) => {
    setTabActiva(nuevaTab);
    try {
      const url = new URL(window.location);
      if (nuevaTab === "fechas") {
        url.searchParams.set("tab", "fechas");
      } else {
        url.searchParams.delete("tab");
      }
      window.history.replaceState({}, "", url);
    } catch (e) {
      console.warn("No se pudo actualizar URL:", e);
    }
  };

  const cargarSolicitudes = useCallback(async () => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await obtenerSolicitudesVisitas();
      const list = Array.isArray(data) ? data : [];
      setSolicitudes(list);
    } catch (requestError) {
      setError(requestError?.message || "No se pudieron cargar las solicitudes de visita.");
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]);

  const resumen = useMemo(() => {
    return solicitudes.reduce((acc, solicitud) => {
      const estado = solicitud.estado || "Pendiente";
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, Object.fromEntries(STATES.map((estado) => [estado, 0])));
  }, [solicitudes]);

  const handleActualizarEstado = async (id, cambios) => {
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      const updated = await actualizarSolicitudVisita(id, cambios);
      setSolicitudes((current) =>
        current.map((row) => (row.id === id ? { ...row, ...updated, ...cambios } : row)),
      );
      setMessage(`Solicitud #${id} actualizada correctamente.`);
      setTimeout(() => setMessage(""), 4000);
    } catch (requestError) {
      setError(requestError?.message || "No se pudo actualizar la solicitud.");
    } finally {
      setBusyId("");
    }
  };

  const deactivate = async (item) => {
    if (!item?.id) return;
    const itemId = item.id;
    // Eliminación optimista inmediata: la fila desaparece al instante sin esperar la red
    setSolicitudes((current) => current.filter((row) => row.id !== itemId));
    setMessage(`Solicitud #${itemId} inactivada correctamente.`);
    setTimeout(() => setMessage(""), 4000);
    try {
      await eliminarSolicitudVisita(itemId);
    } catch (requestError) {
      setError(requestError?.message || "No se pudo inactivar la solicitud.");
      await cargarSolicitudes();
    }
  };

  if (showLoading) {
    return (
      <AdminLayout>
        <AdminPageGate showLoading message={loadingMessage} />
      </AdminLayout>
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
        ...STATES.map((estado) => ({ value: estado, label: estado })),
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
    <AdminLayout>
      <div className="space-y-6">
        {/* Navegación por pestañas: Solicitudes vs Gestión de fechas */}
        <div className="flex border-b border-slate-200 gap-2">
          <button
            type="button"
            onClick={() => cambiarTab("solicitudes")}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              tabActiva === "solicitudes"
                ? "border-slate-950 text-slate-950"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
            }`}
          >
            <ClipboardList className="size-4" />
            <span>Solicitudes registradas</span>
          </button>

          <button
            type="button"
            onClick={() => cambiarTab("fechas")}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              tabActiva === "fechas"
                ? "border-slate-950 text-slate-950"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
            }`}
          >
            <CalendarDays className="size-4" />
            <span>Gestión de fechas de visitas</span>
          </button>
        </div>

        {!canManage ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900" role="alert">
            No tenés permiso para administrar solicitudes de visitas.
          </p>
        ) : tabActiva === "fechas" ? (
          <GestionFechasVisitas esSuperAdmin={esSuperAdmin} />
        ) : (
          <section className="space-y-6">
            {/* Banner superior con resumen de solicitudes */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                    Solicitudes de visitas grupales
                  </h1>
                  <p className="mt-1 max-w-2xl text-slate-600">
                    Revisá y gestioná el estado y detalles de cada solicitud de visita grupal recibida.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cargarSolicitudes}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
                  Actualizar
                </button>
              </div>

              <div className="mt-6 flex flex-wrap gap-x-10 gap-y-3 border-t border-slate-100 pt-6">
                {STATES.map((estado) => (
                  <div key={estado}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{estado}</p>
                    <p className="mt-0.5 text-2xl font-bold text-slate-950">{resumen[estado] || 0}</p>
                  </div>
                ))}
              </div>
            </div>

            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-sm font-medium" role="alert">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 text-sm font-medium" role="status">
                {message}
              </p>
            ) : null}

            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-3 size-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-950" />
                <p className="text-sm text-slate-600">Cargando solicitudes…</p>
              </div>
            ) : solicitudes.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <p className="text-slate-600">No hay solicitudes de visitas registradas aún.</p>
              </div>
            ) : (
              <div className="overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm">
                <AdminListaToolbar
                  busqueda={busqueda}
                  onBusquedaChange={setBusqueda}
                  placeholder="Buscar por encargado, correo, institución, procedencia o grupo…"
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
                    {/* Tabla de escritorio */}
                    <div className="hidden overflow-hidden md:block">
                      <div className="admin-table-shell">
                        <table className="w-full min-w-[780px] border-collapse text-left text-xs sm:text-sm">
                          <thead>
                            <tr>
                              <th className="px-3.5 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                <ST>Encargado</ST>
                              </th>
                              <th className="px-3.5 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                <ST>Grupo e Institución</ST>
                              </th>
                              <th className="px-3.5 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                <ST>Fecha y Horario</ST>
                              </th>
                              <th className="px-3.5 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                <ST>Visitantes</ST>
                              </th>
                              <th className="px-3.5 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                                <ST>Estado</ST>
                              </th>
                              <th className="px-3.5 py-2 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                                <ST>Acciones</ST>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {solicitudesPagina.map((item) => (
                              <tr key={item.id} className="transition hover:bg-slate-50/60">
                                <td className="px-3.5 py-2">
                                  <div className="font-semibold text-slate-950 text-xs sm:text-sm max-w-[180px] truncate">
                                    {item.encargadoNombre || "Sin nombre"}
                                  </div>
                                  <div className="text-[11px] text-slate-500 max-w-[180px] truncate">
                                    {item.encargadoEmail}
                                  </div>
                                  {item.encargadoTelefono ? (
                                    <div className="text-[11px] text-slate-400">
                                      {item.encargadoTelefono}
                                    </div>
                                  ) : null}
                                </td>
                                <td className="px-3.5 py-2 text-slate-700">
                                  <div className="font-medium text-slate-900 text-xs sm:text-sm max-w-[170px] truncate">
                                    {item.tipoGrupo || "Grupo"}
                                  </div>
                                  <div className="text-[11px] text-slate-500 max-w-[170px] truncate">
                                    {item.encargadoInstitucion || item.ciudadProvincia || "—"}
                                  </div>
                                </td>
                                <td className="px-3.5 py-2 text-slate-700 whitespace-nowrap">
                                  <div className="font-medium text-slate-800 text-xs sm:text-sm">
                                    {item.fechaVisita || "Sin fecha"}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {item.horaPreferida || "Horario pendiente"}
                                  </div>
                                </td>
                                <td className="px-3.5 py-2 font-semibold text-slate-900 whitespace-nowrap text-xs sm:text-sm">
                                  {item.cantidadVisitantes} personas
                                </td>
                                <td className="px-3.5 py-2 whitespace-nowrap">
                                  <BadgeEstado estado={item.estado} />
                                </td>
                                <td className="px-3.5 py-2 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setViendo(item)}
                                      className={`${verCls} h-7 px-2.5`}
                                      title="Ver solicitud"
                                      aria-label={`Ver solicitud ${item.id}`}
                                    >
                                      <Eye className="size-3.5 shrink-0 text-slate-500" aria-hidden="true" />
                                      <span><ST>Ver</ST></span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditando(item)}
                                      className={`${editarCls} h-7 px-2.5`}
                                      title="Editar solicitud"
                                      aria-label={`Editar solicitud ${item.id}`}
                                    >
                                      <Pencil className="size-3.5 shrink-0" aria-hidden="true" />
                                      <span><ST>Editar</ST></span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Vista móvil de tarjetas */}
                    <div className="divide-y divide-slate-100 md:hidden">
                      {solicitudesPagina.map((item) => (
                        <article key={item.id} className="space-y-2.5 p-3.5">
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-slate-950 text-xs sm:text-sm truncate">
                                {item.encargadoNombre || "Sin nombre"}
                              </h3>
                              <p className="text-[11px] text-slate-500 truncate">{item.encargadoEmail}</p>
                            </div>
                            <BadgeEstado estado={item.estado} />
                          </div>

                          <div className="grid gap-0.5 text-xs text-slate-600">
                            <p><strong>Grupo:</strong> {item.tipoGrupo} · {item.cantidadVisitantes} personas</p>
                            <p><strong>Fecha:</strong> {item.fechaVisita} ({item.horaPreferida || "Horario pendiente"})</p>
                          </div>

                          <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setViendo(item)}
                              className={`${verCls} h-8 px-2.5`}
                              aria-label={`Ver solicitud ${item.id} móvil`}
                            >
                              <Eye className="size-3.5 shrink-0 text-slate-500" aria-hidden="true" />
                              <span><ST>Ver</ST></span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditando(item)}
                              className={`${editarCls} h-8 px-2.5`}
                              aria-label={`Editar solicitud ${item.id} móvil`}
                            >
                              <Pencil className="size-3.5 shrink-0" aria-hidden="true" />
                              <span><ST>Editar</ST></span>
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>

                    <AdminPaginacion
                      page={page}
                      totalPages={totalPages}
                      total={solicitudesFiltradas.length}
                      onChange={setPage}
                      label="Paginación de visitas grupales"
                    />
                  </>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      {viendo ? (
        <ModalDetalleVisita
          solicitud={viendo}
          onGuardar={handleActualizarEstado}
          onInactivar={deactivate}
          onCerrar={() => setViendo(null)}
        />
      ) : null}

      {editando ? (
        <ModalEditarVisita
          solicitud={editando}
          onGuardar={handleActualizarEstado}
          onCerrar={() => setEditando(null)}
        />
      ) : null}
    </AdminLayout>
  );
}
