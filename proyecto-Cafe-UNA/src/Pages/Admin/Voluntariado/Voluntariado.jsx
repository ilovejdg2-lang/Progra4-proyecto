import { useEffect, useMemo, useState } from "react";
import {
  Building2,
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
import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import {
  actualizarSolicitud,
  eliminarSolicitud,
  obtenerSolicitudes,
} from "../../../services/voluntariadoService";
import { getActiveSessionUser } from "../../../services/sessionService";

const ESTADOS = ["Pendiente", "En revisión", "Aprobado", "Rechazado"];

const ESTADO_ESTILOS = {
  Pendiente: "border-amber-200 bg-amber-50 text-amber-700",
  "En revisión": "border-blue-200 bg-blue-50 text-blue-700",
  Aprobado: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Rechazado: "border-red-200 bg-red-50 text-red-700",
};

function normalizarEstado(estado) {
  const normalized = String(estado || "Pendiente")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalized === "aprobada" || normalized === "aprobado") return "Aprobado";
  if (normalized === "rechazada" || normalized === "rechazado") return "Rechazado";
  if (normalized === "en revision" || normalized === "revision") return "En revisión";
  return "Pendiente";
}

function normalizarSolicitud(solicitud) {
  return {
    ...solicitud,
    estado: normalizarEstado(solicitud?.estado),
  };
}

const CAMPOS_EDITABLES = [
  { name: "nombre", label: "Nombre completo" },
  { name: "email", label: "Correo electrónico", type: "email" },
  { name: "telefono", label: "Teléfono" },
  { name: "tipoVoluntariado", label: "Tipo de voluntariado" },
  { name: "identificacion", label: "Identificación" },
  { name: "institucion", label: "Institución" },
  { name: "pais", label: "País" },
  { name: "residencia", label: "Residencia" },
  { name: "horario", label: "Horario" },
  { name: "dias", label: "Días disponibles" },
  { name: "area", label: "Área de interés" },
];

function BadgeEstado({ estado }) {
  const estadoNormalizado = normalizarEstado(estado);

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        ESTADO_ESTILOS[estadoNormalizado] ?? "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {estadoNormalizado}
    </span>
  );
}

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
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
        {value || "No indicado"}
      </p>
    </div>
  );
}

function DetailBlock({ label, value }) {
  return (
    <div className="grid gap-2 md:col-span-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="min-h-[4.5rem] whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold leading-6 text-slate-900">
        {value || "No indicado"}
      </div>
    </div>
  );
}

function ModalDetalle({ solicitud, onGuardar, onCerrar }) {
  const [estado, setEstado] = useState(normalizarEstado(solicitud.estado));
  const [observacionesAdmin, setObservacionesAdmin] = useState(solicitud.observacionesAdmin || "");
  const [guardando, setGuardando] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl">
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
            className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[68vh] overflow-y-auto px-6 py-5">
          <header className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="grid size-14 shrink-0 place-items-center rounded-full bg-[#a7532d] text-base font-bold text-white">
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
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Solicitud completa</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailField icon={UserRound} label="Nombre" value={solicitud.nombre} />
              <DetailField icon={Mail} label="Correo" value={solicitud.email} />
              <DetailField icon={Phone} label="Teléfono" value={solicitud.telefono} />
              <DetailField icon={GraduationCap} label="Tipo de voluntariado" value={solicitud.tipoVoluntariado} />
              <DetailField icon={Calendar} label="Fecha de solicitud" value={solicitud.fechaSolicitud} />
              <DetailField icon={Clock} label="Disponibilidad" value={solicitud.horario} />
              <DetailField icon={Hash} label="Identificación" value={solicitud.identificacion} />
              <DetailField icon={Building2} label="Institución" value={solicitud.institucion} />
              <DetailField icon={MapPin} label="Residencia" value={solicitud.residencia} />
              <DetailField icon={Users} label="Participantes" value={String(solicitud.cantidadParticipantes || 1)} />
              <DetailField icon={MapPin} label="País" value={solicitud.pais} />
              <DetailField icon={Calendar} label="Días disponibles" value={solicitud.dias} />
              <DetailField icon={GraduationCap} label="Modalidad" value={solicitud.modalidad === "grupal" ? "Grupal" : "Individual"} />
              <DetailField icon={MapPin} label="Área de interés" value={solicitud.area} />
              <DetailBlock label="Motivación" value={solicitud.motivacion} />
              <DetailBlock label="Experiencia" value={solicitud.descripcion} />
            </div>
          </section>

          <section className="mt-6 space-y-4 border-t border-slate-100 pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Panel de administración</h4>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Observaciones del administrador
              <textarea
                value={observacionesAdmin}
                onChange={(event) => setObservacionesAdmin(event.target.value)}
                rows={3}
                className="resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                placeholder="Notas internas sobre esta solicitud..."
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
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Marcar en revisión
            </button>
            <button
              type="button"
              disabled={guardando}
              onClick={() => cambiarEstado("Aprobado")}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Aprobar
            </button>
            <button
              type="button"
              disabled={guardando}
              onClick={() => cambiarEstado("Rechazado")}
              className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Rechazar
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cerrar
            </button>
            <button
              type="button"
              disabled={guardando}
              onClick={() => guardarCambios()}
              className="rounded-lg bg-[#a7532d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8c3d1f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando ? "Guardando..." : "Guardar observaciones"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function ModalEditar({ solicitud, onGuardar, onCerrar }) {
  const [form, setForm] = useState(() => ({
    estado: solicitud.estado || "Pendiente",
    nombre: solicitud.nombre || "",
    email: solicitud.email || "",
    telefono: solicitud.telefono || "",
    tipoVoluntariado: solicitud.tipoVoluntariado || "",
    identificacion: solicitud.identificacion || "",
    institucion: solicitud.institucion || "",
    pais: solicitud.pais || "",
    residencia: solicitud.residencia || "",
    horario: solicitud.horario || "",
    dias: solicitud.dias || "",
    area: solicitud.area || "",
    modalidad: solicitud.modalidad || "individual",
    cantidadParticipantes: solicitud.cantidadParticipantes || 1,
    descripcion: solicitud.descripcion || "",
    motivacion: solicitud.motivacion || "",
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Editar solicitud</h2>
            <p className="text-sm text-slate-500">Actualizá los datos o el estado del voluntariado.</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[68vh] overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Estado
              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              >
                {ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Modalidad
              <select
                name="modalidad"
                value={form.modalidad}
                onChange={handleChange}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="individual">Individual</option>
                <option value="grupal">Grupal</option>
              </select>
            </label>

            {CAMPOS_EDITABLES.map((campo) => (
              <label key={campo.name} className="grid gap-2 text-sm font-medium text-slate-700">
                {campo.label}
                <input
                  type={campo.type || "text"}
                  name={campo.name}
                  value={form[campo.name]}
                  onChange={handleChange}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            ))}

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Cantidad de participantes
              <input
                type="number"
                name="cantidadParticipantes"
                min="1"
                value={form.cantidadParticipantes}
                onChange={handleChange}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
              Experiencia
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows={3}
                className="resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
              Motivación
              <textarea
                name="motivacion"
                value={form.motivacion}
                onChange={handleChange}
                rows={3}
                className="resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
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
  const actorRoles = Array.isArray(actor?.roles) ? actor.roles.map((rol) => String(rol).toLowerCase()) : [];
  const esSuperAdmin = actorRoles.includes("superadmin");
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [viendo, setViendo] = useState(null);
  const [editando, setEditando] = useState(null);
  const [eliminando, setEliminando] = useState(null);
  const { showLoading, loadingMessage } = useAdminPageGate('/admin/voluntariado', !cargando);

  const resumen = useMemo(() => {
    return solicitudes.reduce((acc, solicitud) => {
      const estado = normalizarEstado(solicitud.estado);
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, Object.fromEntries(ESTADOS.map((estado) => [estado, 0])));
  }, [solicitudes]);

  const cargarSolicitudes = async () => {
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
  };

  useEffect(() => {
    let activo = true;

    obtenerSolicitudes()
      .then((data) => {
        if (activo) setSolicitudes(Array.isArray(data) ? data.map(normalizarSolicitud) : []);
      })
      .catch((err) => {
        if (!activo) return;
        setError("No se pudieron cargar las solicitudes de voluntariado.");
        console.error(err);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const handleActualizar = async (id, cambios) => {
    try {
      const actualizada = await actualizarSolicitud(id, cambios);
      setSolicitudes((prev) =>
        prev.map((solicitud) => (
          solicitud.id === id
            ? normalizarSolicitud({ ...solicitud, ...(actualizada || cambios) })
            : solicitud
        ))
      );
      setEditando(null);
      setViendo(null);
    } catch (err) {
      alert("Error al actualizar la solicitud. Intentá de nuevo.");
      console.error(err);
    }
  };

  const handleEliminar = async (solicitud) => {
    if (!esSuperAdmin) {
      alert("Solo SuperAdmin puede eliminar solicitudes de voluntariado.");
      return;
    }

    const confirmar = window.confirm(`¿Deseás eliminar la solicitud de ${solicitud.nombre || "esta persona"}?`);
    if (!confirmar) return;

    setEliminando(solicitud.id);
    try {
      await eliminarSolicitud(solicitud.id);
      setSolicitudes((prev) => prev.filter((item) => item.id !== solicitud.id));
    } catch (err) {
      alert("Error al eliminar la solicitud. Intentá de nuevo.");
      console.error(err);
    } finally {
      setEliminando(null);
    }
  };

  return (
    <AdminPageGate showLoading={showLoading} message={loadingMessage}>
    <AdminLayout>
      <section className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-sm font-semibold text-emerald-800">
                Programa de Voluntariado
              </span>
              <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Solicitudes registradas</h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Gestioná el estado y los datos de cada solicitud de voluntariado recibida.
              </p>
            </div>

            <button
              type="button"
              onClick={cargarSolicitudes}
              disabled={cargando}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`size-4 ${cargando ? "animate-spin" : ""}`} />
              Actualizar
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {ESTADOS.map((estado) => (
              <div key={estado} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{estado}</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">{resumen[estado] || 0}</p>
              </div>
            ))}
          </div>
        </div>

        {cargando ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-3 size-9 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-700" />
            <p className="text-sm text-slate-600">Cargando solicitudes...</p>
          </div>
        ) : null}

        {!cargando && error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-semibold">{error}</p>
            <button
              type="button"
              onClick={cargarSolicitudes}
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
            >
              Reintentar
            </button>
          </div>
        ) : null}

        {!cargando && !error && solicitudes.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-600">No hay solicitudes registradas aún.</p>
          </div>
        ) : null}

        {!cargando && !error && solicitudes.length > 0 ? (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-bold">Nombre</th>
                      <th className="px-5 py-4 font-bold">Tipo de voluntariado</th>
                      <th className="px-5 py-4 font-bold">Fecha</th>
                      <th className="px-5 py-4 font-bold">Estado</th>
                      <th className="px-5 py-4 font-bold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {solicitudes.map((solicitud) => (
                      <tr key={solicitud.id} className="transition hover:bg-slate-50">
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
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setViendo(solicitud)}
                              className="inline-flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                              title="Ver solicitud"
                            >
                              <Eye className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditando(solicitud)}
                              className="inline-flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                              title="Editar solicitud"
                            >
                              <Pencil className="size-4" />
                            </button>
                            {esSuperAdmin ? (
                              <button
                                type="button"
                                onClick={() => handleEliminar(solicitud)}
                                disabled={eliminando === solicitud.id}
                                className="inline-flex size-9 items-center justify-center rounded-lg bg-red-50 text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                title="Eliminar solicitud"
                              >
                                {eliminando === solicitud.id ? (
                                  <RefreshCw className="size-4 animate-spin" />
                                ) : (
                                  <Trash2 className="size-4" />
                                )}
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:hidden">
              {solicitudes.map((solicitud) => (
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

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setViendo(solicitud)}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                    >
                      <Eye className="size-4" />
                      Ver
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditando(solicitud)}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <Pencil className="size-4" />
                      Editar
                    </button>
                    {esSuperAdmin ? (
                      <button
                        type="button"
                        onClick={() => handleEliminar(solicitud)}
                        disabled={eliminando === solicitud.id}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {eliminando === solicitud.id ? (
                          <RefreshCw className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                        Eliminar
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
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

