import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { format, isBefore, startOfDay } from "date-fns";
import { enUS, es } from "date-fns/locale";
import {
  AlertTriangle,
  Bug,
  CalendarCheck2,
  CalendarX2,
  Car,
  CheckCircle2,
  Clock,
  Download,
  Droplets,
  FileDown,
  Footprints,
  Info,
  ShieldCheck,
  X,
} from "lucide-react";
import { IconoSitio } from "../../Components/IconoSitio/IconoSitio";

import { Calendar } from "@/Components/ui/calendar";
import { SelectFiltro } from "../../Components/ui/SelectFiltro";
import { ST } from "../../Components/T/ST";
import { useTraducir } from "../../hooks/useTraducir";
import { useIdioma } from "../../lib/useIdioma";
import PageLoading from "../../Components/PageLoading/PageLoading";
import AvisoSedeFinca from "../../Components/AvisoSedeFinca/AvisoSedeFinca";
import { usePaintPublicPage } from "../../hooks/usePaintPublicPage";
import { PROVINCIAS_CR, cantonesDeProvincia } from "../../lib/costaRicaDivisiones";
import {
  digitosConsultables,
  esperaConsultaIdentificacion,
  limpiarIdentificacion,
  placeholderIdentificacion,
  TIPOS_IDENTIFICACION,
  validarIdentificacion,
} from "../../lib/identificacionPersona";
import { obtenerOpcionesPaises } from "../../lib/paises";
import { esCorreoValido, limpiarCorreo, MENSAJE_CORREO_INVALIDO } from "../../lib/correo";
import { NumericInput } from "../../Components/NumericInput/NumericInput";
import { sedeDesdeHomeLocation } from "../../lib/sedeFinca";
import { consultarCedulaDetallada } from "../../services/cedulaService";
import { obtenerSeccion } from "../../services/informacionService";
import { getActiveSessionUser } from "../../services/sessionService";
import {
  crearSolicitudVisita,
  formatearHora12,
  obtenerDisponibilidadVisitasPublica,
  obtenerFranjasHorariasPorFecha,
  obtenerUrlInstructivoPdf,
} from "../../services/visitasService";
import "../Voluntariado/SolicitarVoluntariado.css";

const VISITA_LOGIN_REDIRECT = "/visitas/solicitar";

const INITIAL_FORM = {
  encargadoTipoIdentificacion: "cedula",
  encargadoNacionalidad: "",
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
      <ST>{label}</ST>
      {children}
    </label>
  );
}

function SectionCard({ lugar, paso, title, hint, children }) {
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
          <ST>{title}</ST>
        </h4>
        {lugar ? <IconoSitio lugar={lugar} className="section-card__icon-inline" size={20} /> : null}
        {hint ? <span className="section-card__hint"><ST>{hint}</ST></span> : null}
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
  const { idioma } = useIdioma();
  const localeFecha = idioma === "en" ? enUS : es;
  const tPhPais = useTraducir("País de procedencia");
  const tPhProvincia = useTraducir("Provincia o Estado");
  const tPhCiudad = useTraducir("Ciudad");
  const tPhTipoGrupo = useTraducir("Universidad, empresa, asociación…");
  const tCerrarVentana = useTraducir("Cerrar ventana");
  const tElegirProvincia = useTraducir("Seleccioná una provincia");
  const tElegirCanton = useTraducir("Seleccioná un cantón");
  const tPrimeroProvincia = useTraducir("Primero seleccioná una provincia");
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
  const tipoDocumento = form.encargadoTipoIdentificacion;
  const tPhIdentificacion = useTraducir(placeholderIdentificacion(tipoDocumento));
  const esPasaporte = tipoDocumento === "pasaporte";
  const opcionesPais = useMemo(() => obtenerOpcionesPaises("es"), []);

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

  const [modalRecomendacionesAbierto, setModalRecomendacionesAbierto] = useState(false);
  const [franjasFecha, setFranjasFecha] = useState([]);
  const [cargandoFranjas, setCargandoFranjas] = useState(false);

  const urlInstructivoPdf = useMemo(() => {
    try {
      if (typeof obtenerUrlInstructivoPdf === "function") {
        return obtenerUrlInstructivoPdf();
      }
    } catch {
      // fallback
    }
    return "/visitas/solicitudes/instructivo-pdf";
  }, []);

  // Consulta dinámica de franjas y aforo en tiempo real al seleccionar fecha
  useEffect(() => {
    if (!fechaSeleccionada) {
      setFranjasFecha([]);
      return;
    }
    const iso = format(fechaSeleccionada, "yyyy-MM-dd");
    let active = true;
    setCargandoFranjas(true);

    if (typeof obtenerFranjasHorariasPorFecha === "function") {
      obtenerFranjasHorariasPorFecha(iso)
        .then((data) => {
          if (!active) return;
          setFranjasFecha(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          if (!active) return;
          setFranjasFecha([]);
        })
        .finally(() => {
          if (!active) return;
          setCargandoFranjas(false);
        });
    } else {
      setCargandoFranjas(false);
    }

    return () => {
      active = false;
    };
  }, [fechaSeleccionada]);

  const slotsParaFechaSeleccionada = useMemo(() => {
    if (!fechaSeleccionada) return [];
    const iso = format(fechaSeleccionada, "yyyy-MM-dd");
    return fechasHabilitadasMap.get(iso) || [];
  }, [fechaSeleccionada, fechasHabilitadasMap]);

  const slotsActuales = useMemo(() => {
    if (franjasFecha && franjasFecha.length > 0) return franjasFecha;
    return slotsParaFechaSeleccionada;
  }, [franjasFecha, slotsParaFechaSeleccionada]);

  const selectedSlot = useMemo(
    () =>
      slotsActuales.find((slot) => slot.id === form.disponibilidadVisitaId) ||
      availability.find((slot) => slot.id === form.disponibilidadVisitaId) ||
      null,
    [slotsActuales, availability, form.disponibilidadVisitaId],
  );

  const cantidadNum = Number(form.cantidadVisitantes) || 0;
  const cupoRestanteSeleccionado =
    selectedSlot?.cupoRestante ?? selectedSlot?.capacidadMaxima ?? 30;
  const cupoExcedido = Boolean(
    selectedSlot &&
      selectedSlot.cupoRestante !== undefined &&
      cantidadNum > 0 &&
      cantidadNum > cupoRestanteSeleccionado,
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
    if (!digitosConsultables(tipoDocumento, digitos)) return;
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
        setAvisoCedula("No se encontraron datos para esta identificación. Complete los datos manualmente.");
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
      const mensajeBase = cedulaError?.message?.trim() || "No se pudo consultar la identificación.";
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
  }, [tipoDocumento]);

  useEffect(() => {
    const digitos = digitosConsultables(tipoDocumento, form.encargadoIdentificacion);
    if (!digitos) return;
    if (consultaCedulaRef.current.enCurso) return;
    if (consultaCedulaRef.current.digitos === digitos) return;

    const timeoutId = window.setTimeout(() => {
      consultarDatosCedula(digitos);
    }, esperaConsultaIdentificacion(tipoDocumento));

    return () => window.clearTimeout(timeoutId);
  }, [form.encargadoIdentificacion, tipoDocumento, consultarDatosCedula]);

  const handleIdentificacionBlur = () => {
    const digitos = digitosConsultables(tipoDocumento, form.encargadoIdentificacion);
    if (digitos && consultaCedulaRef.current.digitos !== digitos) {
      consultarDatosCedula(digitos, { forzar: true });
    }
  };

  const update = (event) => {
    const { checked, name, type, value } = event.target;
    setForm((current) => {
      const next = {
        ...current,
        [name]: type === "checkbox"
          ? checked
          : name === "encargadoIdentificacion"
            ? limpiarIdentificacion(current.encargadoTipoIdentificacion, value)
            : name === "encargadoEmail"
              ? limpiarCorreo(value)
              : value,
      };
      if (name === "encargadoTipoIdentificacion") {
        next.encargadoIdentificacion = "";
        next.encargadoNacionalidad = value === "pasaporte" ? current.encargadoNacionalidad : "";
        next.encargadoNombre = "";
        next.encargadoPrimerApellido = "";
        next.encargadoSegundoApellido = "";
      }
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

    if (name === "encargadoIdentificacion" || name === "encargadoTipoIdentificacion") {
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

    if (!esCorreoValido(form.encargadoEmail)) {
      setError(MENSAJE_CORREO_INVALIDO);
      return;
    }

    const errorIdentificacion = validarIdentificacion(tipoDocumento, form.encargadoIdentificacion);
    if (errorIdentificacion) {
      setError(errorIdentificacion);
      return;
    }
    if (esPasaporte && !form.encargadoNacionalidad) {
      setError("Elegí el país de origen del pasaporte.");
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

    if (selectedSlot && selectedSlot.agotada) {
      setError("La franja horaria seleccionada se encuentra agotada. Por favor seleccioná otro horario.");
      return;
    }

    if (
      selectedSlot &&
      selectedSlot.cupoRestante !== undefined &&
      cantidadNum > cupoRestanteSeleccionado
    ) {
      setError(
        `La cantidad de visitantes (${cantidadNum}) supera el cupo disponible (${cupoRestanteSeleccionado} personas) para este horario.`,
      );
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
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("visitas-updated"));
      }
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
            <h1><ST>Solicitud de visitas grupales</ST></h1>
            <p>
              <ST>
                Completá la información del grupo y elegí uno de los horarios habilitados por la administración.
                La solicitud quedará pendiente de revisión.
              </ST>
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
                lugar="visitas.encargado"
                title="Información del encargado"
                hint="Datos de la persona responsable de coordinar la visita."
              >
                <div className="form-grid">
                  <Field label="Tipo de identificación *">
                    <SelectFiltro
                      name="encargadoTipoIdentificacion"
                      value={tipoDocumento}
                      onChange={update}
                      traducirOpciones
                    >
                      {TIPOS_IDENTIFICACION.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                      ))}
                    </SelectFiltro>
                  </Field>
                  {esPasaporte ? (
                    <Field label="País de origen *">
                      <SelectFiltro
                        name="encargadoNacionalidad"
                        value={form.encargadoNacionalidad}
                        onChange={update}
                      >
                        <option value="">Elegí el país</option>
                        {opcionesPais.map((pais) => (
                          <option key={pais.value} value={pais.value}>{pais.label}</option>
                        ))}
                      </SelectFiltro>
                    </Field>
                  ) : null}
                  <Field label="Identificación *">
                    <input
                      name="encargadoIdentificacion"
                      value={form.encargadoIdentificacion}
                      onChange={update}
                      onBlur={handleIdentificacionBlur}
                      inputMode={esPasaporte ? "text" : "numeric"}
                      autoComplete="off"
                      placeholder={tPhIdentificacion}
                    />
                    {consultandoCedula ? (
                      <span className="text-xs text-slate-500 mt-1 block"><ST>Consultando identificación…</ST></span>
                    ) : null}
                    {avisoCedula ? (
                      <span
                        className={`text-xs mt-1 block ${
                          avisoCedula.includes("automáticamente") ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        <ST>{avisoCedula}</ST>
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
                      inputMode="email"
                      name="encargadoEmail"
                      value={form.encargadoEmail}
                      onChange={update}
                    />
                  </Field>
                  <Field label="Teléfono *">
                    <NumericInput
                      name="encargadoTelefono"
                      value={form.encargadoTelefono}
                      onChange={update}
                      maxLength={15}
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
                lugar="visitas.grupo"
                title="Información del grupo"
                hint="Las visitas grupales requieren al menos dos personas."
              >
                <div className="form-grid">
                  <Field label="Tipo de visitante *">
                    <SelectFiltro name="tipoVisitante" value={form.tipoVisitante} onChange={update} traducirOpciones>
                      <option value="Nacional">Nacional</option>
                      <option value="Internacional">Internacional</option>
                    </SelectFiltro>
                  </Field>

                  {form.tipoVisitante === "Internacional" ? (
                    <>
                      <Field label="País de procedencia *">
                        <input
                          name="paisProcedencia"
                          value={form.paisProcedencia}
                          onChange={update}
                          placeholder={tPhPais}
                        />
                      </Field>
                      <Field label="Provincia o Estado *">
                        <input
                          name="provincia"
                          value={form.provincia}
                          onChange={update}
                          placeholder={tPhProvincia}
                        />
                      </Field>
                      <Field label="Ciudad *">
                        <input
                          name="canton"
                          value={form.canton}
                          onChange={update}
                          placeholder={tPhCiudad}
                        />
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field label="Provincia *">
                        <SelectFiltro name="provincia" value={form.provincia} onChange={update}>
                          <option value="">{tElegirProvincia}</option>
                          {PROVINCIAS_CR.map((prov) => (
                            <option key={prov} value={prov}>
                              {prov}
                            </option>
                          ))}
                        </SelectFiltro>
                      </Field>
                      <Field label="Cantón *">
                        <SelectFiltro
                          name="canton"
                          value={form.canton}
                          onChange={update}
                          disabled={!form.provincia}
                        >
                          <option value="">
                            {form.provincia ? tElegirCanton : tPrimeroProvincia}
                          </option>
                          {cantonesDeProvincia(form.provincia).map((can) => (
                            <option key={can} value={can}>
                              {can}
                            </option>
                          ))}
                        </SelectFiltro>
                      </Field>
                    </>
                  )}

                  <Field label="Cantidad de visitantes *">
                    <NumericInput
                      name="cantidadVisitantes"
                      value={form.cantidadVisitantes}
                      onChange={update}
                      maxLength={4}
                    />
                  </Field>
                  <Field label="Tipo de grupo *">
                    <input
                      name="tipoGrupo"
                      value={form.tipoGrupo}
                      onChange={update}
                      placeholder={tPhTipoGrupo}
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
                lugar="visitas.fecha"
                title="Fecha y horario disponibles *"
                hint="Seleccioná un día habilitado en el calendario y luego el turno de tu preferencia."
              >
                {availabilityStatus === "loading" ? (
                  <div className="voluntariado-aviso-bloque">
                    <div className="size-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="voluntariado-aviso-bloque__texto">
                      <ST>Cargando fechas y horarios disponibles…</ST>
                    </p>
                  </div>
                ) : availabilityStatus === "error" ? (
                  <p className="mensaje-error text-center" role="alert">
                    <ST>{availabilityError || "No se pudieron cargar los horarios disponibles."}</ST>
                  </p>
                ) : fechasHabilitadasDates.length === 0 ? (
                  <div className="voluntariado-aviso-bloque">
                    <CalendarX2 className="voluntariado-aviso-bloque__icono size-8 text-amber-500" />
                    <p className="voluntariado-aviso-bloque__titulo text-amber-900">
                      <ST>No hay fechas y horarios habilitados</ST>
                    </p>
                    <p className="voluntariado-aviso-bloque__texto text-amber-700">
                      <ST>Actualmente no hay fechas habilitadas para visitas grupales. Por favor consultá más adelante.</ST>
                    </p>
                  </div>
                ) : (
                  <div className="campo full flex flex-col items-center">
                    {fechaSeleccionada && (
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-900 bg-white px-5 py-2 shadow-xs">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          <ST>FECHA SELECCIONADA:</ST>
                        </span>
                        <span className="text-xs font-bold text-slate-950 capitalize">
                          {format(fechaSeleccionada, idioma === "en" ? "EEEE, MMMM dd, yyyy" : "EEEE, dd 'de' MMMM 'de' yyyy", { locale: localeFecha })}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-center my-1 w-full">
                      <Calendar
                        mode="single"
                        selected={fechaSeleccionada}
                        onSelect={handleSelectFecha}
                        disabled={isDateDisabled}
                        locale={localeFecha}
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
                        <span><ST>Fecha disponible para visitas</ST></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex size-5 items-center justify-center text-slate-400 opacity-40 text-[11px]">
                          15
                        </span>
                        <span><ST>Fecha no disponible</ST></span>
                      </div>
                    </div>

                    <div className="w-full mt-6 pt-6 border-t border-slate-200">
                      {!fechaSeleccionada ? (
                        <div className="voluntariado-aviso-bloque">
                          <Clock className="voluntariado-aviso-bloque__icono size-8 text-slate-400" />
                          <p className="voluntariado-aviso-bloque__titulo text-slate-800">
                            <ST>Seleccioná una fecha en el calendario</ST>
                          </p>
                          <p className="voluntariado-aviso-bloque__texto text-slate-600">
                            <ST>Al seleccionar un día habilitado, se consultarán y cargarán los turnos u horarios disponibles para esa fecha.</ST>
                          </p>
                        </div>
                      ) : cargandoFranjas ? (
                        <div className="voluntariado-aviso-bloque">
                          <div className="size-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-2" />
                          <p className="voluntariado-aviso-bloque__texto">
                            <ST>Consultando bloques horarios y aforo disponible…</ST>
                          </p>
                        </div>
                      ) : slotsActuales.length === 0 ? (
                        <div className="voluntariado-aviso-bloque">
                          <CalendarX2 className="voluntariado-aviso-bloque__icono size-8 text-amber-500" />
                          <p className="voluntariado-aviso-bloque__titulo text-amber-900">
                            <ST>Sin turnos para esta fecha</ST>
                          </p>
                          <p className="voluntariado-aviso-bloque__texto text-amber-700">
                            <ST>No hay turnos disponibles para el día seleccionado.</ST>
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-semibold text-slate-700 mb-3">
                            <ST>Horarios disponibles para el</ST>{" "}
                            <strong>
                              {format(fechaSeleccionada, idioma === "en" ? "MMMM dd" : "dd 'de' MMMM", { locale: localeFecha })}
                            </strong>:
                          </p>

                          <div className="opciones-disponibilidad-grid">
                            {slotsActuales.map((slot) => {
                              const esActivo = form.disponibilidadVisitaId === slot.id;
                              const inicio12 =
                                slot.horaInicioFormato ||
                                (slot.horaInicio ? formatearHora12(slot.horaInicio) : "");
                              const fin12 =
                                slot.horaFinFormato ||
                                (slot.horaFin ? formatearHora12(slot.horaFin) : "");
                              const franja =
                                slot.franja ||
                                (inicio12 && fin12 ? `${inicio12} - ${fin12}` : "") ||
                                `${slot.horaInicio?.slice(0, 5)} – ${slot.horaFin?.slice(0, 5)}`;
                              const capacidadMaxima = slot.capacidadMaxima ?? 30;
                              const cupoRestante = slot.cupoRestante ?? capacidadMaxima;
                              const estaAgotada = Boolean(slot.agotada || cupoRestante <= 0);

                              return (
                                <label
                                  key={slot.id}
                                  className={`opcion-disponibilidad-card ${
                                    esActivo ? "opcion-disponibilidad-card--activa" : ""
                                  } ${estaAgotada ? "opcion-disponibilidad-card--agotada" : ""}`}
                                >
                                  <input
                                    type="radio"
                                    name="disponibilidadVisitaId"
                                    value={slot.id}
                                    checked={esActivo}
                                    disabled={estaAgotada}
                                    aria-label={`Horario ${slot.horaInicio?.slice(0, 5) || ""} ${franja}`}
                                    onChange={() => {
                                      if (estaAgotada) return;
                                      setForm((prev) => ({
                                        ...prev,
                                        disponibilidadVisitaId: slot.id,
                                      }));
                                    }}
                                  />
                                  <div className="opcion-disponibilidad__header">
                                    <span className="opcion-disponibilidad__titulo font-bold text-slate-950">
                                      {franja}
                                    </span>
                                    <span className="opcion-disponibilidad__radio-dot" />
                                  </div>
                                  <span className="opcion-disponibilidad__horario">
                                    <Clock size={14} />
                                    {franja}
                                  </span>

                                  {/* Badge de aforo y cupo restante */}
                                  <div>
                                    {estaAgotada ? (
                                      <span className="opcion-disponibilidad__cupo-badge opcion-disponibilidad__cupo-badge--agotado">
                                        <ST>Cupo agotado (0 cupos disponibles)</ST>
                                      </span>
                                    ) : cupoRestante <= 5 ? (
                                      <span className="opcion-disponibilidad__cupo-badge opcion-disponibilidad__cupo-badge--bajo">
                                        <ST>{`¡Últimos ${cupoRestante} cupos! (de ${capacidadMaxima})`}</ST>
                                      </span>
                                    ) : (
                                      <span className="opcion-disponibilidad__cupo-badge opcion-disponibilidad__cupo-badge--disponible">
                                        <ST>{`${cupoRestante} cupos disponibles (de ${capacidadMaxima})`}</ST>
                                      </span>
                                    )}
                                  </div>

                                  {slot.nota ? (
                                    <span className="text-xs text-slate-500 mt-1 block">
                                      <ST>{slot.nota}</ST>
                                    </span>
                                  ) : null}
                                </label>
                              );
                            })}
                          </div>

                          {cupoExcedido ? (
                            <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900" role="alert">
                              <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                              <ST>
                                {`Atención: La cantidad solicitada (${cantidadNum} personas) supera el cupo restante (${cupoRestanteSeleccionado} personas) de este horario.`}
                              </ST>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </SectionCard>

              <SectionCard
                paso={4}
                lugar="visitas.necesidades"
                title="Necesidades y recomendaciones"
                hint="Todas las visitas serán recibidas o acompañadas por personal del proyecto."
              >
                <fieldset className="grid gap-3 sm:grid-cols-2">
                  <legend className="mb-3 text-sm font-semibold text-slate-700"><ST>Necesidades del grupo</ST></legend>
                  {[
                    ["requiereAccesibilidad", "Requerimientos de accesibilidad"],
                    ["requiereParqueoBus", "Parqueo"],
                  ].map(([name, label]) => (
                    <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm font-medium" key={name}>
                      <input type="checkbox" name={name} checked={form[name]} onChange={update} /> <ST>{label}</ST>
                    </label>
                  ))}
                </fieldset>

                {/* Tarjeta de recomendaciones generales */}
                <div className="tarjeta-recomendaciones my-2">
                  <div className="tarjeta-recomendaciones__header">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="text-emerald-700" size={22} />
                        <p className="font-bold text-slate-900 text-sm sm:text-base">
                          <ST>Recomendaciones para la visita</ST>
                        </p>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        <ST>Lineamientos obligatorios y sugerencias para un recorrido seguro en la finca experimental.</ST>
                      </p>
                    </div>
                  </div>

                  <div className="tarjeta-recomendaciones__grid">
                    <div className="recomendacion-item">
                      <div className="recomendacion-item__icon-wrapper">
                        <Footprints size={20} className="text-emerald-700" />
                      </div>
                      <div>
                        <p className="recomendacion-item__titulo"><ST>Calzado cerrado obligatorio</ST></p>
                        <p className="recomendacion-item__desc">
                          <ST>Uso indispensable de calzado cerrado o botas con suela antideslizante para caminar por senderos agrícolas.</ST>
                        </p>
                      </div>
                    </div>

                    <div className="recomendacion-item">
                      <div className="recomendacion-item__icon-wrapper">
                        <Droplets size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="recomendacion-item__titulo"><ST>Hidratación continua</ST></p>
                        <p className="recomendacion-item__desc">
                          <ST>Llevá botella o termo reutilizable con agua potable para el recorrido.</ST>
                        </p>
                      </div>
                    </div>

                    <div className="recomendacion-item">
                      <div className="recomendacion-item__icon-wrapper">
                        <Bug size={20} className="text-amber-700" />
                      </div>
                      <div>
                        <p className="recomendacion-item__titulo"><ST>Vestimenta y protección</ST></p>
                        <p className="recomendacion-item__desc">
                          <ST>Usá vestimenta cómoda, repelente y protección solar para actividades en campo abierto.</ST>
                        </p>
                      </div>
                    </div>

                    <div className="recomendacion-item">
                      <div className="recomendacion-item__icon-wrapper">
                        <Car size={20} className="text-slate-800" />
                      </div>
                      <div>
                        <p className="recomendacion-item__titulo"><ST>Zonas de parqueo</ST></p>
                        <p className="recomendacion-item__desc">
                          <ST>Estacionamiento vigilado para vehículos particulares y espacio reservado para buses o microbuses.</ST>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="tarjeta-recomendaciones__footer">
                    <a
                      href={urlInstructivoPdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-descargar-instructivo"
                      download="instructivo_recomendaciones_visitas_cafe_una.pdf"
                    >
                      <Download size={16} aria-hidden="true" />
                      <ST>Descargar instructivo en PDF</ST>
                    </a>

                    <button
                      type="button"
                      onClick={() => setModalRecomendacionesAbierto(true)}
                      className="btn-modal-instructivo"
                    >
                      <Info size={16} aria-hidden="true" />
                      <ST>Ver recomendaciones detalladas</ST>
                    </button>
                  </div>
                </div>

                {/* Modal interactivo con recomendaciones completas */}
                {modalRecomendacionesAbierto && (
                  <div
                    className="modal-overlay-recomendaciones"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-recomendaciones-titulo"
                    onClick={() => setModalRecomendacionesAbierto(false)}
                  >
                    <div
                      className="modal-content-recomendaciones"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="text-emerald-700" size={24} />
                          <h3 id="modal-recomendaciones-titulo" className="text-lg font-bold text-slate-900">
                            <ST>Instructivo de Recomendaciones y Seguridad</ST>
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setModalRecomendacionesAbierto(false)}
                          className="rounded-full p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          aria-label={tCerrarVentana}
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="space-y-4 text-sm text-slate-700">
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-950">
                          <p className="font-semibold text-xs uppercase tracking-wider text-emerald-800 mb-1">
                            Finca Experimental Santa Lucía - Café UNA
                          </p>
                          <p className="text-xs">
                            <ST>Para que tu experiencia sea memorable y segura, te solicitamos cumplir con las siguientes directrices durante la visita:</ST>
                          </p>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 flex items-center gap-2">
                            <Footprints size={16} className="text-emerald-700" />
                            <ST>1. Calzado cerrado obligatorio</ST>
                          </h4>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">
                            <ST>Es indispensable utilizar tenis deportivas, botas de senderismo o botas con buen agarre. Por normativas de prevención, no se admiten sandalias ni calzado abierto en los senderos.</ST>
                          </p>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 flex items-center gap-2">
                            <Droplets size={16} className="text-blue-600" />
                            <ST>2. Hidratación y vestimenta cómoda</ST>
                          </h4>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">
                            <ST>Usá vestimenta cómoda y apropiada para recorridos al aire libre bajo el sol. Sugerimos pantalón largo ligero. La finca dispone de tomas de agua potable para rellenar botellas reutilizables.</ST>
                          </p>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 flex items-center gap-2">
                            <Bug size={16} className="text-amber-700" />
                            <ST>3. Repelente contra insectos y protección solar</ST>
                          </h4>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">
                            <ST>Llevá repelente si visitarán zonas con vegetación densa o cafetales. Considerá protección solar, sombrero o gorra y gafas oscuras durante las horas de mayor radiación.</ST>
                          </p>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 flex items-center gap-2">
                            <Car size={16} className="text-slate-800" />
                            <ST>4. Zonas de parqueo y acceso</ST>
                          </h4>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">
                            <ST>Disponemos de estacionamiento gratuito vigilado para automóviles y área reservada para el desembarque y parqueo de autobuses o microbuses.</ST>
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                          <a
                            href={urlInstructivoPdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-descargar-instructivo text-xs py-2 px-4"
                            download="instructivo_recomendaciones_visitas_cafe_una.pdf"
                          >
                            <Download size={14} /> <ST>Descargar PDF</ST>
                          </a>
                          <button
                            type="button"
                            onClick={() => setModalRecomendacionesAbierto(false)}
                            className="btn-modal-instructivo text-xs py-2 px-4"
                          >
                            <ST>Entendido, cerrar</ST>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Field label="Observaciones">
                  <textarea name="observaciones" value={form.observaciones} onChange={update} />
                </Field>
              </SectionCard>
            </div>

            {error ? (
              <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800" role="alert">
                <ST>{error}</ST>
              </p>
            ) : null}
            {success ? (
              <p className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900" role="status">
                <CheckCircle2 aria-hidden="true" /> <ST>{`Solicitud #${success.id} enviada en estado ${success.estado}.`}</ST>
              </p>
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
                <ST>{submitting ? "Enviando…" : "Enviar solicitud"}</ST>
              </button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
