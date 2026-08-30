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
import { ContadorPalabras } from "../../../Components/Admin/ui/CampoLimitePalabras";
import { NumericInput } from "../../../Components/NumericInput/NumericInput";
import {
  conLimitePalabras,
  limitarPalabras,
  MAX_PALABRAS_NOTAS,
  MAX_PALABRAS_TITULO,
} from "../../../lib/formLimits";
import { ST } from "../../../Components/T/ST";
import { useTraducir } from "../../../hooks/useTraducir";
import { t } from "../../../lib/t";

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
    <span className={`text-[length:var(--text-body)] font-semibold ${claseEstado(estadoNormalizado)}`}>
      <ST>{estadoNormalizado}</ST>
    </span>
  );
}

const CAMPOS_EDITABLES = [
  { name: "email", label: "Correo electr\u00f3nico", type: "email" },
  { name: "telefono", label: "Tel\u00e9fono" },
  { name: "identificacion", label: "Identificaci\u00f3n" },
  { name: "institucion", label: "Instituci\u00f3n educativa" },
  { name: "pais", label: "Pa\u00eds de residencia" },
  { name: "tipoVoluntariado", label: "Tipo de voluntariado" },
  { name: "horario", label: "Horario y disponibilidad" },
];

function partirNombreCompleto(completo = "") {
  const parts = String(completo || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return { nombre: "", primerApellido: "", segundoApellido: "" };
  if (parts.length === 1) return { nombre: parts[0], primerApellido: "", segundoApellido: "" };
  if (parts.length === 2) {
    return { nombre: parts[0], primerApellido: parts[1], segundoApellido: "" };
  }
  return {
    nombre: parts.slice(0, -2).join(" "),
    primerApellido: parts[parts.length - 2],
    segundoApellido: parts[parts.length - 1],
  };
}

function unirNombreCompleto({ nombre, primerApellido, segundoApellido }) {
  return [nombre, primerApellido, segundoApellido]
    .map((parte) => String(parte || "").trim())
    .filter(Boolean)
    .join(" ");
}

function partirPeriodo(dias = "") {
  const m = String(dias || "").match(
    /(\d{4}-\d{2}-\d{2})\s*[-–—]\s*(\d{4}-\d{2}-\d{2})/,
  );
  if (m) return { fechaInicio: m[1], fechaFin: m[2] };
  return { fechaInicio: "", fechaFin: "" };
}

function unirPeriodo(fechaInicio, fechaFin) {
  const a = String(fechaInicio || "").trim();
  const b = String(fechaFin || "").trim();
  if (a && b) return `${a} - ${b}`;
  return a || b || "";
}

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SV";
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
          <span><ST>Ver</ST></span>
        </button>
        <button type="button" onClick={onEditar} className={`${editarCls} h-8 px-2.5`}>
          <Pencil className="size-3 shrink-0" aria-hidden="true" />
          <span><ST>Editar</ST></span>
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
            <span><ST>Eliminar</ST></span>
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <button type="button" onClick={onVer} className={`${verCls} h-7 px-2`} title={t("Ver solicitud")}>
        <Eye className="size-3 shrink-0" aria-hidden="true" />
        <span><ST>Ver</ST></span>
      </button>
      <button type="button" onClick={onEditar} className={`${editarCls} h-7 px-2`} title={t("Editar solicitud")}>
        <Pencil className="size-3 shrink-0" aria-hidden="true" />
        <span><ST>Editar</ST></span>
      </button>
      {esSuperAdmin ? (
        <button
          type="button"
          onClick={onEliminar}
          disabled={eliminando === solicitud.id}
          className={`${eliminarCls} h-7 px-2 disabled:cursor-not-allowed disabled:opacity-50`}
          title={t("Eliminar solicitud")}
        >
          {eliminando === solicitud.id ? (
            <RefreshCw className="size-3 shrink-0 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="size-3 shrink-0" aria-hidden="true" />
          )}
          <span><ST>Eliminar</ST></span>
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
      <div className="relative z-10 max-h-[92dvh] w-full max-w-xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950"><ST>Ver solicitud</ST></h2>
            <p className="text-sm text-slate-500">
              <ST>Solicitud</ST> #{solicitud.id} · <ST>Recibida el</ST> {solicitud.fechaSolicitud || t("sin fecha")}
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
        </div>

        <div className="max-h-[68vh] overflow-y-auto px-6 py-5">
          <header className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="grid size-14 shrink-0 place-items-center rounded-full bg-slate-950 text-base font-bold text-white">
              {getInitials(solicitud.nombre)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold text-slate-950">{solicitud.nombre || t("Sin nombre")}</h3>
              <div className="mt-2">
                <BadgeEstado estado={estado} />
              </div>
            </div>
          </header>

          <section className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500"><ST>Datos de la solicitud</ST></h4>
            <div className="grid gap-4 md:grid-cols-2">
              {(() => {
                const partes = partirNombreCompleto(solicitud.nombre);
                return (
                  <>
                    <DetailField icon={UserRound} label="Nombre" value={partes.nombre} />
                    <DetailField icon={UserRound} label="Primer apellido" value={partes.primerApellido} />
                    <DetailField icon={UserRound} label="Segundo apellido" value={partes.segundoApellido} />
                  </>
                );
              })()}
              <DetailField icon={Mail} label={"Correo electr\u00f3nico"} value={solicitud.email} />
              <DetailField icon={Phone} label={"Tel\u00e9fono"} value={solicitud.telefono} />
              <DetailField icon={Hash} label={"Identificaci\u00f3n"} value={solicitud.identificacion} />
              <DetailField icon={GraduationCap} label={"Instituci\u00f3n educativa"} value={solicitud.institucion} />
              <DetailField icon={MapPin} label={"Pa\u00eds de residencia"} value={solicitud.pais} />
              <DetailField
                icon={Users}
                label="Modalidad"
                value={esGrupal ? "Grupal" : "Individual"}
                traducirValor
              />
              {esGrupal ? (
                <DetailField
                  icon={Users}
                  label="Cantidad de participantes"
                  value={String(solicitud.cantidadParticipantes || "")}
                />
              ) : null}
              <DetailField icon={GraduationCap} label="Tipo de voluntariado" value={solicitud.tipoVoluntariado} traducirValor />
              <DetailField icon={Calendar} label="Fecha de solicitud" value={solicitud.fechaSolicitud} />
              {(() => {
                const periodo = partirPeriodo(solicitud.dias);
                return (
                  <>
                    <DetailField icon={Calendar} label="Fecha de inicio" value={periodo.fechaInicio} />
                    <DetailField icon={Calendar} label="Fecha de finalización" value={periodo.fechaFin} />
                  </>
                );
              })()}
              <DetailField icon={Clock} label="Horario y disponibilidad" value={solicitud.horario} className="md:col-span-2" traducirValor />
            </div>
          </section>

          <section className="mt-6 space-y-4 border-t border-slate-100 pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500"><ST>{"Panel de administraci\u00f3n"}</ST></h4>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              <ST>Observaciones / motivo de rechazo</ST>
              <textarea
                value={observacionesAdmin}
                onChange={conLimitePalabras(
                  (event) => setObservacionesAdmin(event.target.value),
                  MAX_PALABRAS_NOTAS,
                )}
                rows={3}
                className={`${inputModalCls} min-h-[6rem] resize-none rounded-2xl`}
                placeholder={t("Indique observaciones internas o el motivo si la solicitud es rechazada...")}
              />
              <ContadorPalabras value={observacionesAdmin} maxPalabras={MAX_PALABRAS_NOTAS} />
            </label>
          </section>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={guardando} onClick={() => cambiarEstado("En revisi\u00f3n")} className={btnRevision}>
              <ST>{"Marcar en revisi\u00f3n"}</ST>
            </button>
            <button type="button" disabled={guardando} onClick={() => cambiarEstado("Aprobado")} className={btnAprobar}>
              <ST>Aprobar</ST>
            </button>
            <button type="button" disabled={guardando} onClick={() => cambiarEstado("Rechazado")} className={btnRechazar}>
              <ST>Rechazar</ST>
            </button>
          </div>
          <div className="flex flex-row flex-wrap justify-end gap-2">
            <button type="button" disabled={guardando} onClick={() => guardarCambios()} className={btnNegro}>
              {guardando ? t("Guardando...") : t("Guardar observaciones")}
            </button>
            <button type="button" onClick={onCerrar} className={btnCancelarGris}>
              <ST>Cerrar</ST>
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
  const partesNombre = partirNombreCompleto(solicitud.nombre);
  const periodo = partirPeriodo(solicitud.dias);
  const [form, setForm] = useState(() => ({
    estado: normalizarEstado(solicitud.estado),
    nombre: partesNombre.nombre,
    primerApellido: partesNombre.primerApellido,
    segundoApellido: partesNombre.segundoApellido,
    email: solicitud.email || "",
    telefono: solicitud.telefono || "",
    tipoVoluntariado: solicitud.tipoVoluntariado || "",
    identificacion: solicitud.identificacion || "",
    institucion: solicitud.institucion || "",
    pais: solicitud.pais || "",
    horario: solicitud.horario || "",
    fechaInicio: periodo.fechaInicio,
    fechaFin: periodo.fechaFin,
    modalidad: solicitud.modalidad || "individual",
    cantidadParticipantes: solicitud.cantidadParticipantes || 1,
    observacionesAdmin: solicitud.observacionesAdmin || "",
  }));
  const [guardando, setGuardando] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    let next = value;
    if (name === "observacionesAdmin") {
      next = limitarPalabras(value, MAX_PALABRAS_NOTAS);
    } else if (
      name === "nombre" ||
      name === "primerApellido" ||
      name === "segundoApellido" ||
      name === "institucion" ||
      name === "carrera" ||
      name === "lugar" ||
      name === "horario"
    ) {
      next = limitarPalabras(value, MAX_PALABRAS_TITULO);
    }
    setForm((prev) => ({ ...prev, [name]: next }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setGuardando(true);
    await onGuardar(solicitud.id, {
      estado: form.estado,
      nombre: unirNombreCompleto(form),
      email: form.email,
      telefono: form.telefono,
      tipoVoluntariado: form.tipoVoluntariado,
      identificacion: form.identificacion,
      institucion: form.institucion,
      pais: form.pais,
      horario: form.horario,
      dias: unirPeriodo(form.fechaInicio, form.fechaFin),
      modalidad: form.modalidad,
      cantidadParticipantes: form.cantidadParticipantes,
      observacionesAdmin: form.observacionesAdmin,
    });
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
      <form onSubmit={handleSubmit} className="relative z-10 max-h-[92dvh] w-full max-w-xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950"><ST>Editar solicitud</ST></h2>
            <p className="text-sm text-slate-500"><ST>{"Actualiz\u00e1 los datos o el estado del voluntariado."}</ST></p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label={t("Cerrar")}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="max-h-[68vh] overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2 text-sm font-medium text-slate-700">
              <ST>Estado</ST>
              <UiSelect
                ariaLabel={t("Estado")}
                value={form.estado}
                onChange={(valor) => handleChange({ target: { name: "estado", value: valor } })}
                options={ESTADOS.map((estado) => ({ value: estado, label: t(estado) }))}
              />
            </div>

            <div className="grid gap-2 text-sm font-medium text-slate-700">
              <ST>Modalidad</ST>
              <UiSelect
                ariaLabel={t("Modalidad")}
                value={form.modalidad}
                onChange={(valor) => handleChange({ target: { name: "modalidad", value: valor } })}
                options={[
                  { value: "individual", label: t("Individual") },
                  { value: "grupal", label: t("Grupal") },
                ]}
              />
            </div>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              <ST>Nombre</ST>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className={inputModalCls}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              <ST>Primer apellido</ST>
              <input
                type="text"
                name="primerApellido"
                value={form.primerApellido}
                onChange={handleChange}
                className={inputModalCls}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
              <ST>Segundo apellido</ST>
              <input
                type="text"
                name="segundoApellido"
                value={form.segundoApellido}
                onChange={handleChange}
                className={inputModalCls}
              />
            </label>

            {CAMPOS_EDITABLES.map((campo) => (
              <label key={campo.name} className={`grid gap-2 text-sm font-medium text-slate-700 ${campo.name === "horario" ? "md:col-span-2" : ""}`}>
                <ST>{campo.label}</ST>
                {campo.name === "telefono" ? (
                  <NumericInput
                    name={campo.name}
                    maxLength={8}
                    value={form[campo.name]}
                    onChange={handleChange}
                    className={inputModalCls}
                  />
                ) : (
                  <input
                    type={campo.type || "text"}
                    name={campo.name}
                    value={form[campo.name]}
                    onChange={handleChange}
                    className={inputModalCls}
                  />
                )}
              </label>
            ))}

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              <ST>Fecha de inicio</ST>
              <input
                type="date"
                name="fechaInicio"
                value={form.fechaInicio}
                onChange={handleChange}
                className={inputModalCls}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              <ST>Fecha de finalización</ST>
              <input
                type="date"
                name="fechaFin"
                value={form.fechaFin}
                onChange={handleChange}
                className={inputModalCls}
              />
            </label>

            {form.modalidad === "grupal" ? (
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                <ST>Cantidad de participantes</ST>
                <NumericInput
                  name="cantidadParticipantes"
                  value={form.cantidadParticipantes}
                  onChange={handleChange}
                  className={inputModalCls}
                />
              </label>
            ) : null}

            <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
              <ST>Observaciones / motivo de rechazo</ST>
              <textarea
                name="observacionesAdmin"
                value={form.observacionesAdmin}
                onChange={handleChange}
                rows={3}
                className={`${inputModalCls} min-h-[6rem] resize-none rounded-2xl`}
              />
              <ContadorPalabras value={form.observacionesAdmin} maxPalabras={MAX_PALABRAS_NOTAS} />
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
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl"><ST>Solicitudes registradas</ST></h1>
                <p className="mt-1 max-w-2xl text-slate-600"><ST>{"Gestion\u00e1 el estado y los datos de cada solicitud de voluntariado recibida."}</ST></p>
              </div>

              <button
                type="button"
                onClick={cargarSolicitudes}
                disabled={cargando}
                className={`${btnCancelarGris} gap-2 px-4 py-2 text-sm`}
              >
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
              <p className="text-sm text-slate-600"><ST>Cargando solicitudes...</ST></p>
            </div>
          ) : null}

          {!cargando && error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
              <p className="font-semibold"><ST>{error}</ST></p>
              <button
                type="button"
                onClick={cargarSolicitudes}
                className={`${accionBtnBase} mt-4 border-rose-200 bg-rose-50 px-4 py-2 text-rose-700 hover:bg-rose-100`}
              >
                <ST>Reintentar</ST>
              </button>
            </div>
          ) : null}

          {!cargando && !error && solicitudes.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-slate-600"><ST>{"No hay solicitudes registradas a\u00fan."}</ST></p>
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
                        <table className="w-full min-w-[900px] border-collapse text-left text-[length:var(--text-body)]">
                          <thead>
                            <tr>
                              <th><ST>Nombre</ST></th>
                              <th><ST>Tipo de voluntariado</ST></th>
                              <th><ST>Fecha</ST></th>
                              <th><ST>Estado</ST></th>
                              <th><ST>Acciones</ST></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {solicitudesPagina.map((solicitud) => (
                              <tr key={solicitud.id} className="transition hover:bg-slate-50/60">
                                <td className="px-5 py-4">
                                  <div className="font-semibold text-slate-950">{solicitud.nombre || t("Sin nombre")}</div>
                                  <div className="mt-1 text-[length:var(--text-body)] text-slate-500">{solicitud.email || t("Sin correo")}</div>
                                </td>
                                <td className="px-5 py-4 text-slate-700">{solicitud.tipoVoluntariado ? <ST>{solicitud.tipoVoluntariado}</ST> : t("No indicado")}</td>
                                <td className="px-5 py-4 text-slate-700">{solicitud.fechaSolicitud || t("No indicada")}</td>
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
                              <h3 className="font-semibold text-slate-950">{solicitud.nombre || t("Sin nombre")}</h3>
                              <p className="mt-0.5 truncate text-sm text-slate-500">{solicitud.email || t("Sin correo")}</p>
                            </div>
                            <BadgeEstado estado={solicitud.estado} />
                          </div>

                          <div className="grid gap-1 text-sm text-slate-600">
                            <p><span className="font-medium text-slate-800"><ST>Tipo</ST>:</span> {solicitud.tipoVoluntariado ? <ST>{solicitud.tipoVoluntariado}</ST> : t("No indicado")}</p>
                            <p><span className="font-medium text-slate-800"><ST>Fecha</ST>:</span> {solicitud.fechaSolicitud || t("No indicada")}</p>
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
