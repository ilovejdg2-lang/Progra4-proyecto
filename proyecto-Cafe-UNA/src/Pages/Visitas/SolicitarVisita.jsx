import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { format, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarCheck2,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  ClipboardList,
  Clock,
  Lock,
  UserRound,
  Users,
} from "lucide-react";

import { Calendar } from "@/Components/ui/calendar";
import PageLoading from "../../Components/PageLoading/PageLoading";
import AvisoSedeFinca from "../../Components/AvisoSedeFinca/AvisoSedeFinca";
import { usePaintPublicPage } from "../../hooks/usePaintPublicPage";
import { PROVINCIAS_CR, cantonesDeProvincia } from "../../lib/costaRicaDivisiones";
import { sedeDesdeHomeLocation } from "../../lib/sedeFinca";
import { consultarCedulaDetallada } from "../../services/cedulaService";
import { obtenerSeccion } from "../../services/informacionService";
import { getActiveSessionUser } from "../../services/sessionService";
import {
  crearSolicitudVisita,
  obtenerDisponibilidadVisitasPublica,
} from "../../services/visitasService";
import "../Voluntariado/SolicitarVoluntariado.css";

const VISITA_LOGIN_REDIRECT = "/visitas/solicitar";

const INITIAL_FORM = {
  encargadoIdentificacion: "",
  encargadoNombre: "",
  encargadoPrimerApellido: "",
  encargadoSegundoApellido: "",
  encargadoEmail: "",
  encargadoTelefono: "",
  encargadoInstitucion: "",
  tipoVisitante: "Nacional",
  paisProcedencia: "",
  provincia: "",
  canton: "",
  cantidadVisitantes: "",
  tipoGrupo: "",
  disponibilidadVisitaId: "",
  motivoVisita: "",
  requiereAccesibilidad: false,
  requiereParqueoBus: false,
  observaciones: "",
};

function normalizarCedulaCr(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

function esCedulaFisica(valor) {
  const digitos = normalizarCedulaCr(valor);
  return digitos.length === 9 && digitos === String(valor ?? "").replace(/[\s-]/g, "");
}

function partesNombreCedula(datos) {
  return {
    nombre: String(datos?.nombre || datos?.Nombre || "").trim(),
    primerApellido: String(datos?.primerApellido || datos?.PrimerApellido || "").trim(),
    segundoApellido: String(datos?.segundoApellido || datos?.SegundoApellido || "").trim(),
  };
}

function Field({ label, children }) {
  return (
    <label className="campo">
      {label}
      {children}
    </label>
  );
}

function SectionCard({ icon: Icon, paso, title, hint, children }) {
  return (
    <section className="section-card">
      <div className="section-card__header">
        {paso != null ? (
          <span className="section-card__paso" aria-hidden="true">
            {paso}
          </span>
        ) : null}
        <h4>
          {paso != null ? (
            <span className="sr-only">Paso {paso}. </span>
          ) : null}
          {title}
        </h4>
        {Icon ? <Icon aria-hidden="true" className="section-card__icon-inline" size={20} /> : null}
        {hint ? <span className="section-card__hint">{hint}</span> : null}
      </div>
      <div className="section-card__body">{children}</div>
    </section>
  );
}

function parseIsoLocal(isoStr) {
  if (!isoStr) return null;
  const [y, m, d] = String(isoStr).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export default function SolicitarVisita() {
  const navigate = useNavigate();
  const session = getActiveSessionUser();
  const isAuthenticated = Boolean(session?.token || session?.id);

  const [form, setForm] = useState(() => ({
    ...INITIAL_FORM,
    encargadoEmail: session?.email || "",
  }));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState([]);
  const [availabilityStatus, setAvailabilityStatus] = useState("loading");
  const [availabilityError, setAvailabilityError] = useState("");
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);

  const consultaCedulaRef = useRef({ digitos: "", enCurso: false });
  const [consultandoCedula, setConsultandoCedula] = useState(false);
  const [avisoCedula, setAvisoCedula] = useState(null);
  const [sedeFinca, setSedeFinca] = useState(() => sedeDesdeHomeLocation(null));

  const {
    ref: pageRef,
    showLoading,
    showPrepaint,
    inert,
    loadingMessage,
  } = usePaintPublicPage("visitas");

  useEffect(() => {
    let vivo = true;
    obtenerSeccion("homeLocation")
      .then((section) => {
        if (!vivo) return;
        setSedeFinca(sedeDesdeHomeLocation(section));
      })
      .catch(() => {
        if (!vivo) return;
        setSedeFinca(sedeDesdeHomeLocation(null));
      });
    return () => {
      vivo = false;
    };
  }, []);

  // Mapeo de fechas habilitadas para visitas (YYYY-MM-DD -> array de slots)
  const fechasHabilitadasMap = useMemo(() => {
    const map = new Map();
    for (const slot of availability) {
      if (!slot.habilitada) continue;
      const iso = String(slot.fecha || "").slice(0, 10);
      if (!iso) continue;
      if (!map.has(iso)) map.set(iso, []);
      map.get(iso).push(slot);
    }
    return map;
  }, [availability]);

  // Fechas habilitadas para el modifier del Calendar
  const fechasHabilitadasDates = useMemo(() => {
    const list = [];
    for (const [iso] of fechasHabilitadasMap) {
      const parsed = parseIsoLocal(iso);
      if (parsed) list.push(parsed);
    }
    return list;
  }, [fechasHabilitadasMap]);

  // Función para deshabilitar días en el calendario
  const isDateDisabled = useCallback(
    (date) => {
      const hoy = startOfDay(new Date());
      if (isBefore(startOfDay(date), hoy)) return true;
      const iso = format(date, "yyyy-MM-dd");
      return !fechasHabilitadasMap.has(iso);
    },
    [fechasHabilitadasMap],
  );

  const slotsParaFechaSeleccionada = useMemo(() => {
    if (!fechaSeleccionada) return [];
    const iso = format(fechaSeleccionada, "yyyy-MM-dd");
    return fechasHabilitadasMap.get(iso) || [];
  }, [fechaSeleccionada, fechasHabilitadasMap]);

  const selectedSlot = useMemo(
    () => availability.find((slot) => slot.id === form.disponibilidadVisitaId) || null,
    [availability, form.disponibilidadVisitaId],
  );

  const redirectToLogin = useCallback(() => {
    sessionStorage.setItem("postLoginRedirect", VISITA_LOGIN_REDIRECT);
    navigate({ to: "/login" });
  }, [navigate]);

  const handleFormInteractionCapture = useCallback(
    (event) => {
      if (isAuthenticated) return;
      if (event.target.closest?.(".auth-banner__link")) return;

      event.preventDefault();
      event.stopPropagation();
      redirectToLogin();
    },
    [isAuthenticated, redirectToLogin],
  );

  useEffect(() => {
    let active = true;
    obtenerDisponibilidadVisitasPublica()
      .then((slots) => {
        if (!active) return;
        setAvailability(slots);
        setAvailabilityStatus("success");

        // Si hay fechas habilitadas, preseleccionar la primera fecha disponible
        const habilitados = slots.filter((s) => s.habilitada);
        if (habilitados.length > 0) {
          const primerIso = habilitados[0].fecha;
          const parsed = parseIsoLocal(primerIso);
          if (parsed) {
            setFechaSeleccionada(parsed);
          }
        }
      })
      .catch((loadError) => {
        if (!active) return;
        setAvailability([]);
        setAvailabilityError(loadError?.message || "No se pudieron cargar los horarios disponibles.");
        setAvailabilityStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSelectFecha = (date) => {
    if (!date) return;
    setFechaSeleccionada(date);
    const iso = format(date, "yyyy-MM-dd");
    // Si el turno actual no pertenece a la fecha seleccionada, reiniciar
    setForm((current) => {
      const currentSlot = availability.find((s) => s.id === current.disponibilidadVisitaId);
      if (currentSlot && currentSlot.fecha === iso) return current;
      return { ...current, disponibilidadVisitaId: "" };
    });
  };

  const consultarDatosCedula = useCallback(async (digitos, { forzar = false } = {}) => {
    if (digitos.length !== 9) return;
    if (consultaCedulaRef.current.enCurso) return;
    if (!forzar && consultaCedulaRef.current.digitos === digitos) return;

    consultaCedulaRef.current = { digitos, enCurso: true };
    setConsultandoCedula(true);
    setAvisoCedula(null);

    try {
      const datos = await consultarCedulaDetallada(digitos);
      const partes = partesNombreCedula(datos);
      if (!partes.nombre && !partes.primerApellido) {
        consultaCedulaRef.current = { digitos: "", enCurso: false };
        setAvisoCedula("No se encontraron datos para esta cédula. Complete los datos manualmente.");
        return;
      }
      consultaCedulaRef.current = { digitos, enCurso: false };
      setForm((prev) => ({
        ...prev,
        encargadoNombre: partes.nombre,
        encargadoPrimerApellido: partes.primerApellido,
        encargadoSegundoApellido: partes.segundoApellido,
      }));
      setAvisoCedula("Datos cargados automáticamente. Puede editarlos si es necesario.");
    } catch (cedulaError) {
      consultaCedulaRef.current = { digitos: "", enCurso: false };
      const mensajeBase = cedulaError?.message?.trim() || "No se pudo consultar la cédula.";
      const yaIndicaManual = /manualmente|completar el nombre/i.test(mensajeBase);
      const esConexion =
        cedulaError?.cause?.code === "ERR_NETWORK" || /conectar con el servidor/i.test(mensajeBase);
      setAvisoCedula(
        yaIndicaManual
          ? mensajeBase
          : esConexion
            ? `${mensajeBase} Mientras tanto, complete los datos manualmente.`
            : `${mensajeBase} Complete los datos manualmente.`,
      );
    } finally {
      setConsultandoCedula(false);
    }
  }, []);

  useEffect(() => {
    const digitos = normalizarCedulaCr(form.encargadoIdentificacion);
    if (!esCedulaFisica(form.encargadoIdentificacion) || digitos.length !== 9) return;
    if (consultaCedulaRef.current.enCurso) return;
    if (consultaCedulaRef.current.digitos === digitos) return;

    const timeoutId = window.setTimeout(() => {
      consultarDatosCedula(digitos);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [form.encargadoIdentificacion, consultarDatosCedula]);

  const handleIdentificacionBlur = () => {
    const digitos = normalizarCedulaCr(form.encargadoIdentificacion);
    if (esCedulaFisica(form.encargadoIdentificacion) && digitos.length === 9) {
      if (consultaCedulaRef.current.digitos !== digitos) {
        consultarDatosCedula(digitos, { forzar: true });
      }
    }
  };

  const update = (event) => {
    const { checked, name, type, value } = event.target;
    setForm((current) => {
      const next = {
        ...current,
        [name]: type === "checkbox" ? checked : value,
      };
      if (name === "provincia" && current.tipoVisitante === "Nacional") {
        next.canton = "";
      }
      if (name === "tipoVisitante") {
        next.provincia = "";
        next.canton = "";
        next.paisProcedencia = value === "Nacional" ? "" : "";
      }
      return next;
    });

    if (name === "encargadoIdentificacion") {
      consultaCedulaRef.current = { digitos: "", enCurso: false };
      setAvisoCedula(null);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess(null);

    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }

    if (
      !form.encargadoIdentificacion.trim() ||
      !form.encargadoNombre.trim() ||
      !form.encargadoPrimerApellido.trim() ||
      !form.encargadoEmail.trim() ||
      !form.encargadoTelefono.trim()
    ) {
      setError("Completá los campos obligatorios antes de enviar la solicitud.");
      return;
    }

    if (form.tipoVisitante === "Nacional") {
      if (!form.provincia.trim() || !form.canton.trim()) {
        setError("Completá los campos obligatorios antes de enviar la solicitud.");
        return;
      }
    } else {
      if (!form.paisProcedencia.trim()) {
        setError("Indicá el país de procedencia del grupo internacional.");
        return;
      }
      if (!form.provincia.trim() || !form.canton.trim()) {
        setError("Completá los campos obligatorios antes de enviar la solicitud.");
        return;
      }
    }

    if (!form.cantidadVisitantes || Number(form.cantidadVisitantes) < 2) {
      setError("Las visitas grupales requieren al menos 2 personas.");
      return;
    }

    if (
      !form.tipoGrupo.trim() ||
      !form.disponibilidadVisitaId ||
      !form.motivoVisita.trim()
    ) {
      setError("Completá los campos obligatorios antes de enviar la solicitud.");
      return;
    }

    const nombreCompleto = [
      form.encargadoNombre,
      form.encargadoPrimerApellido,
      form.encargadoSegundoApellido,
    ]
      .map((parte) => String(parte || "").trim())
      .filter(Boolean)
      .join(" ");

    const ciudadProvincia = [form.provincia, form.canton]
      .map((parte) => String(parte || "").trim())
      .filter(Boolean)
      .join(", ");

    const paisProcedencia =
      form.tipoVisitante === "Internacional"
        ? form.paisProcedencia.trim()
        : "Costa Rica";

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        encargadoNombre: nombreCompleto,
        paisProcedencia,
        ciudadProvincia,
      };
      const created = await crearSolicitudVisita(payload);
      setSuccess(created);
    } catch (requestError) {
      setError(requestError?.message || "No se pudo enviar la solicitud de visita.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {showLoading ? <PageLoading message={loadingMessage} /> : null}
      <main
        className={`voluntariado-page${showPrepaint ? " voluntariado-page--prepaint" : ""}`}
        inert={inert}
        ref={pageRef}
      >
        <section className="voluntariado-section">
          <header className="voluntariado-header">
            <h1>Solicitud de visitas grupales</h1>
            <p>
              Completá la información del grupo y elegí uno de los horarios habilitados por la administración.
              La solicitud quedará pendiente de revisión.
            </p>
          </header>

          <form
            className="formulario-card"
            onSubmit={submit}
            onFocusCapture={handleFormInteractionCapture}
            onPointerDownCapture={handleFormInteractionCapture}
            noValidate
          >
            <div className="form-secciones">
              <SectionCard
                paso={1}
                icon={UserRound}
                title="Información del encargado"
                hint="Datos de la persona responsable de coordinar la visita."
              >
                <div className="form-grid">
                  <Field label="Identificación *">
                    <input
                      name="encargadoIdentificacion"
                      value={form.encargadoIdentificacion}
                      onChange={update}
                      onBlur={handleIdentificacionBlur}
                      placeholder="Ej: 1-1111-1111"
                    />
                    {consultandoCedula ? (
                      <span className="text-xs text-slate-500 mt-1 block">Consultando cédula…</span>
                    ) : null}
                    {avisoCedula ? (
                      <span
                        className={`text-xs mt-1 block ${
                          avisoCedula.includes("automáticamente") ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {avisoCedula}
                      </span>
                    ) : null}
                  </Field>
                  <Field label="Nombre *">
                    <input
                      name="encargadoNombre"
                      value={form.encargadoNombre}
                      onChange={update}
                    />
                  </Field>
                  <Field label="Primer Apellido *">
                    <input
                      name="encargadoPrimerApellido"
                      value={form.encargadoPrimerApellido}
                      onChange={update}
                    />
                  </Field>
                  <Field label="Segundo Apellido">
                    <input
                      name="encargadoSegundoApellido"
                      value={form.encargadoSegundoApellido}
                      onChange={update}
                    />
                  </Field>
                  <Field label="Correo electrónico *">
                    <input
                      type="email"
                      name="encargadoEmail"
                      value={form.encargadoEmail}
                      onChange={update}
                    />
                  </Field>
                  <Field label="Teléfono *">
                    <input
                      name="encargadoTelefono"
                      value={form.encargadoTelefono}
                      onChange={update}
                    />
                  </Field>
                  <Field label="Institución">
                    <input
                      name="encargadoInstitucion"
                      value={form.encargadoInstitucion}
                      onChange={update}
                    />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard
                paso={2}
                icon={Users}
                title="Información del grupo"
                hint="Las visitas grupales requieren al menos dos personas."
              >
                <div className="form-grid">
                  <Field label="Tipo de visitante *">
                    <select name="tipoVisitante" value={form.tipoVisitante} onChange={update}>
                      <option value="Nacional">Nacional</option>
                      <option value="Internacional">Internacional</option>
                    </select>
                  </Field>

                  {form.tipoVisitante === "Internacional" ? (
                    <>
                      <Field label="País de procedencia *">
                        <input
                          name="paisProcedencia"
                          value={form.paisProcedencia}
                          onChange={update}
                          placeholder="País de procedencia"
                        />
                      </Field>
                      <Field label="Provincia o Estado *">
                        <input
                          name="provincia"
                          value={form.provincia}
                          onChange={update}
                          placeholder="Provincia o Estado"
                        />
                      </Field>
                      <Field label="Ciudad *">
                        <input
                          name="canton"
                          value={form.canton}
                          onChange={update}
                          placeholder="Ciudad"
                        />
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field label="Provincia *">
                        <select name="provincia" value={form.provincia} onChange={update}>
                          <option value="">Seleccioná una provincia</option>
                          {PROVINCIAS_CR.map((prov) => (
                            <option key={prov} value={prov}>
                              {prov}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Cantón *">
                        <select
                          name="canton"
                          value={form.canton}
                          onChange={update}
                          disabled={!form.provincia}
                        >
                          <option value="">
                            {form.provincia ? "Seleccioná un cantón" : "Primero seleccioná una provincia"}
                          </option>
                          {cantonesDeProvincia(form.provincia).map((can) => (
                            <option key={can} value={can}>
                              {can}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </>
                  )}

                  <Field label="Cantidad de visitantes *">
                    <input
                      min="2"
                      type="number"
                      name="cantidadVisitantes"
                      value={form.cantidadVisitantes}
                      onChange={update}
                    />
                  </Field>
                  <Field label="Tipo de grupo *">
                    <input
                      name="tipoGrupo"
                      value={form.tipoGrupo}
                      onChange={update}
                      placeholder="Universidad, empresa, asociación…"
                    />
                  </Field>
                  <Field label="Motivo de la visita *">
                    <input
                      name="motivoVisita"
                      value={form.motivoVisita}
                      onChange={update}
                    />
                  </Field>
                </div>
              </SectionCard>

              {/* Sección de Horarios Homologada a Voluntariado */}
              <SectionCard
                paso={3}
                icon={CalendarDays}
                title="Fecha y horario disponibles *"
                hint="Seleccioná un día habilitado en el calendario y luego el turno de tu preferencia."
              >
                {availabilityStatus === "loading" ? (
                  <div className="voluntariado-aviso-bloque">
                    <div className="size-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="voluntariado-aviso-bloque__texto">
                      Cargando fechas y horarios disponibles…
                    </p>
                  </div>
                ) : availabilityStatus === "error" ? (
                  <p className="mensaje-error text-center" role="alert">
                    {availabilityError || "No se pudieron cargar los horarios disponibles."}
                  </p>
                ) : fechasHabilitadasDates.length === 0 ? (
                  <div className="voluntariado-aviso-bloque">
                    <CalendarX2 className="voluntariado-aviso-bloque__icono size-8 text-amber-500" />
                    <p className="voluntariado-aviso-bloque__titulo text-amber-900">
                      No hay fechas y horarios habilitados
                    </p>
                    <p className="voluntariado-aviso-bloque__texto text-amber-700">
                      Actualmente no hay fechas habilitadas para visitas grupales. Por favor consultá más adelante.
                    </p>
                  </div>
                ) : (
                  <div className="campo full flex flex-col items-center">
                    {fechaSeleccionada && (
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-900 bg-white px-5 py-2 shadow-xs">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          FECHA SELECCIONADA:
                        </span>
                        <span className="text-xs font-bold text-slate-950 capitalize">
                          {format(fechaSeleccionada, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-center my-1 w-full">
                      <Calendar
                        mode="single"
                        selected={fechaSeleccionada}
                        onSelect={handleSelectFecha}
                        disabled={isDateDisabled}
                        locale={es}
                        modifiers={{
                          habilitado: fechasHabilitadasDates,
                        }}
                        modifiersClassNames={{
                          habilitado: "rdp-day-habilitado",
                        }}
                        captionLayout="dropdown"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 mt-4 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex size-5 items-center justify-center rounded-full border-2 border-slate-950 bg-white font-bold text-slate-950 text-[11px]">
                          15
                        </span>
                        <span>Fecha disponible para visitas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex size-5 items-center justify-center text-slate-400 opacity-40 text-[11px]">
                          15
                        </span>
                        <span>Fecha no disponible</span>
                      </div>
                    </div>

                    <div className="w-full mt-6 pt-6 border-t border-slate-200">
                      {!fechaSeleccionada ? (
                        <div className="voluntariado-aviso-bloque">
                          <Clock className="voluntariado-aviso-bloque__icono size-8 text-slate-400" />
                          <p className="voluntariado-aviso-bloque__titulo text-slate-800">
                            Seleccioná una fecha en el calendario
                          </p>
                          <p className="voluntariado-aviso-bloque__texto text-slate-600">
                            Al seleccionar un día habilitado, se cargarán los turnos u horarios disponibles para esa fecha.
                          </p>
                        </div>
                      ) : slotsParaFechaSeleccionada.length === 0 ? (
                        <div className="voluntariado-aviso-bloque">
                          <CalendarX2 className="voluntariado-aviso-bloque__icono size-8 text-amber-500" />
                          <p className="voluntariado-aviso-bloque__titulo text-amber-900">
                            Sin turnos para esta fecha
                          </p>
                          <p className="voluntariado-aviso-bloque__texto text-amber-700">
                            No hay turnos disponibles para el día seleccionado.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-semibold text-slate-700 mb-3">
                            Horarios disponibles para el{" "}
                            <strong>
                              {format(fechaSeleccionada, "dd 'de' MMMM", { locale: es })}
                            </strong>:
                          </p>

                          <div className="opciones-disponibilidad-grid">
                            {slotsParaFechaSeleccionada.map((slot) => {
                              const esActivo = form.disponibilidadVisitaId === slot.id;
                              const franja = `${slot.horaInicio.slice(0, 5)} – ${slot.horaFin.slice(0, 5)}`;
                              return (
                                <label
                                  key={slot.id}
                                  className={`opcion-disponibilidad-card ${
                                    esActivo ? "opcion-disponibilidad-card--activa" : ""
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="disponibilidadVisitaId"
                                    value={slot.id}
                                    checked={esActivo}
                                    aria-label={`Horario ${franja}`}
                                    onChange={() => {
                                      setForm((prev) => ({
                                        ...prev,
                                        disponibilidadVisitaId: slot.id,
                                      }));
                                    }}
                                  />
                                  <div className="opcion-disponibilidad__header">
                                    <span className="opcion-disponibilidad__titulo">
                                      {franja}
                                    </span>
                                    <span className="opcion-disponibilidad__radio-dot" />
                                  </div>
                                  <span className="opcion-disponibilidad__horario">
                                    <Clock size={14} />
                                    {franja}
                                  </span>
                                  {slot.nota ? (
                                    <span className="text-xs text-slate-500 mt-1 block">
                                      {slot.nota}
                                    </span>
                                  ) : null}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </SectionCard>

              <SectionCard
                paso={4}
                icon={ClipboardList}
                title="Necesidades y recomendaciones"
                hint="Todas las visitas serán recibidas o acompañadas por personal del proyecto."
              >
                <fieldset className="grid gap-3 sm:grid-cols-2">
                  <legend className="mb-3 text-sm font-semibold text-slate-700">Necesidades del grupo</legend>
                  {[
                    ["requiereAccesibilidad", "Requerimientos de accesibilidad"],
                    ["requiereParqueoBus", "Parqueo"],
                  ].map(([name, label]) => (
                    <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm font-medium" key={name}>
                      <input type="checkbox" name={name} checked={form[name]} onChange={update} /> {label}
                    </label>
                  ))}
                </fieldset>
                <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Recomendaciones para la visita</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Usá vestimenta cómoda y apropiada para recorridos al aire libre.</li>
                    <li>Llevá repelente si visitarán zonas con vegetación.</li>
                    <li>Considerá protección solar e hidratación.</li>
                  </ul>
                </aside>
                <Field label="Observaciones">
                  <textarea name="observaciones" value={form.observaciones} onChange={update} />
                </Field>
              </SectionCard>
            </div>

            {error ? (
              <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800" role="alert">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900" role="status">
                <CheckCircle2 aria-hidden="true" /> Solicitud #{success.id} enviada en estado {success.estado}.
              </p>
            ) : null}

            {!isAuthenticated ? (
              <div className="auth-banner mb-6">
                <Lock size={20} strokeWidth={2} className="auth-banner__icon" />
                <div className="auth-banner__content">
                  <p className="auth-banner__text">Debe iniciar sesión para enviar su solicitud de visita.</p>
                  <Link
                    to="/login"
                    className="auth-banner__link"
                    onClick={() => sessionStorage.setItem("postLoginRedirect", VISITA_LOGIN_REDIRECT)}
                  >
                    Iniciar sesión →
                  </Link>
                </div>
              </div>
            ) : null}

            <AvisoSedeFinca sede={sedeFinca} contexto="visita" />

            <div className="acciones-formulario">
              <button
                className="btn-enviar"
                disabled={
                  submitting ||
                  availabilityStatus === "error" ||
                  (availabilityStatus === "success" && fechasHabilitadasDates.length === 0)
                }
                type="submit"
              >
                {submitting ? "Enviando…" : "Enviar solicitud"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
