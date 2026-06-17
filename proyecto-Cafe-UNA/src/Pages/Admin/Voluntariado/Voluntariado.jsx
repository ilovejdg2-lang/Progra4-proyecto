import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
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
import AdminRouteLoading from "../../../Components/Admin/AdminRouteLoading";
import { useAdminPageLoadingGate } from "../../../hooks/usePublicPageLoadingGate";
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

function DetailInput({ icon: Icon, label, name, value, onChange, type = "text", className = "" }) {
  return (
    <label className={`grid gap-1.5 border-b border-white/15 pb-3 ${className}`}>
      <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-white/60">
        <Icon className="size-3.5" />
        {label}
      </span>
      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        className="w-full border-0 bg-transparent p-0 text-sm font-bold leading-5 text-white outline-none placeholder:text-white/30"
        placeholder="No indicado"
      />
    </label>
  );
}

function DetailTextarea({ label, name, value, onChange, rows = 4 }) {
  return (
    <label className="grid gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-white/55">{label}</span>
      <textarea
        name={name}
        value={value ?? ""}
        onChange={onChange}
        rows={rows}
        className="min-h-[108px] resize-y rounded-lg border border-white/15 bg-white/[0.04] px-3 py-3 text-sm font-semibold leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-white/35 focus:bg-white/[0.07]"
        placeholder="Escriba aqui..."
      />
    </label>
  );
}

function ModalDetalle({ solicitud, onGuardar, onCerrar }) {
  const [form, setForm] = useState(() => ({
    estado: solicitud.estado || "Pendiente",
    nombre: solicitud.nombre || "",
    email: solicitud.email || "",
    telefono: solicitud.telefono || "",
    tipoVoluntariado: solicitud.tipoVoluntariado || "",
    fechaSolicitud: solicitud.fechaSolicitud || "",
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
    try {
      await onGuardar(solicitud.id, {
        ...form,
        cantidadParticipantes: Number(form.cantidadParticipantes) || 1,
      });
      onCerrar();
    } finally {
      setGuardando(false);
    }
  };

  const setEstado = (estado) => {
    setForm((prev) => ({ ...prev, estado }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4 text-white">
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[760px] space-y-5 rounded-xl bg-[#1f1f1d] p-5 shadow-2xl ring-1 ring-white/10">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onCerrar} className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10">
            <ArrowLeft className="size-3.5" />
            Volver a solicitudes
          </button>
          <button type="button" onClick={onCerrar} className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white" aria-label="Cerrar">
            <X className="size-4" />
          </button>
        </div>

        <header className="flex items-center gap-4">
          <div className="grid size-16 shrink-0 place-items-center rounded-full bg-blue-700 text-lg font-bold text-white">
            {getInitials(form.nombre)}
          </div>
          <div className="min-w-0 flex-1">
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="w-full border-0 bg-transparent p-0 text-xl font-extrabold leading-tight text-white outline-none placeholder:text-white/30"
              placeholder="Nombre de solicitante"
            />
            <p className="mt-1 text-xs font-bold text-white/70">
              Solicitud #{solicitud.id} - Recibida el {form.fechaSolicitud || "Sin fecha"}
            </p>
          </div>
        </header>

        <section className="rounded-lg border border-white/15 bg-white/[0.05] p-5">
          <h3 className="mb-4 text-[11px] font-extrabold uppercase tracking-wide text-white/55">Solicitud completa</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailInput icon={UserRound} label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} />
            <DetailInput icon={Mail} label="Correo" name="email" type="email" value={form.email} onChange={handleChange} />
            <DetailInput icon={Phone} label="Telefono" name="telefono" value={form.telefono} onChange={handleChange} />
            <DetailInput icon={GraduationCap} label="Tipo de voluntariado" name="tipoVoluntariado" value={form.tipoVoluntariado} onChange={handleChange} />
            <DetailInput icon={Calendar} label="Fecha de solicitud" name="fechaSolicitud" type="date" value={form.fechaSolicitud} onChange={handleChange} />
            <DetailInput icon={Clock} label="Disponibilidad" name="horario" value={form.horario} onChange={handleChange} />
            <DetailInput icon={Hash} label="Identificacion" name="identificacion" value={form.identificacion} onChange={handleChange} />
            <DetailInput icon={Building2} label="Institucion" name="institucion" value={form.institucion} onChange={handleChange} />
            <DetailInput icon={MapPin} label="Residencia" name="residencia" value={form.residencia} onChange={handleChange} />
            <DetailInput icon={Users} label="Participantes" name="cantidadParticipantes" type="number" value={form.cantidadParticipantes} onChange={handleChange} />
            <DetailInput icon={MapPin} label="Pais" name="pais" value={form.pais} onChange={handleChange} />
            <DetailInput icon={Calendar} label="Dias disponibles" name="dias" value={form.dias} onChange={handleChange} />
          </div>
        </section>

        <section className="rounded-lg border border-white/15 bg-white/[0.05] p-5">
          <DetailTextarea label="Motivacion" name="motivacion" value={form.motivacion} onChange={handleChange} />
        </section>

        <section className="rounded-lg border border-white/15 bg-white/[0.05] p-5">
          <h3 className="mb-4 text-[11px] font-extrabold uppercase tracking-wide text-white/55">Panel de administracion</h3>
          <div className="grid gap-4">
            <DetailTextarea label="Observaciones del administrador" name="observacionesAdmin" value={form.observacionesAdmin} onChange={handleChange} rows={3} />
            <DetailTextarea label="Experiencia / descripcion" name="descripcion" value={form.descripcion} onChange={handleChange} rows={3} />
            <label className="grid gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-white/55">Estado</span>
              <select name="estado" value={form.estado} onChange={handleChange} className="rounded-lg border border-white/15 bg-[#252522] px-3 py-3 text-sm font-bold text-white outline-none transition focus:border-white/35">
                {ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setEstado("Aprobado")} className="rounded-lg border border-white/20 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-emerald-700">Aprobar</button>
              <button type="button" onClick={() => setEstado("Rechazado")} className="rounded-lg border border-white/20 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-red-700">Rechazar</button>
              <button type="submit" disabled={guardando} className="rounded-lg border border-white/30 bg-white/[0.04] px-4 py-2 text-xs font-extrabold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </section>
      </form>
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
  const showLoading = useAdminPageLoadingGate('/admin/voluntariado', !cargando);

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

  if (showLoading) {
    return <AdminRouteLoading />;
  }

  return (
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
  );
};

export default AdminVoluntariado;

