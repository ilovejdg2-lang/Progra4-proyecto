import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ModalDialog } from "../../Components/ui/ModalDialog";
import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";
import {
  Bug,
  Car,
  Download,
  Droplets,
  Footprints,
  Info,
  Shirt,
  Users,
  X,
} from "lucide-react";

import { SelectFiltro } from "../../Components/ui/SelectFiltro";
import { ST } from "../../Components/T/ST";
import { useTraducir } from "../../hooks/useTraducir";
import { useIdioma } from "../../lib/useIdioma";
import PageLoading from "../../Components/PageLoading/PageLoading";
import AvisoSedeFinca from "../../Components/AvisoSedeFinca/AvisoSedeFinca";
import BackToHomeLink from "../../Components/BackToHomeLink/BackToHomeLink";
import { PublicPageHeader } from "../../Components/Public/PublicPageHeader";
import {
  CalendarPicker,
  ChoiceCard,
  ChoiceGroup,
  CupoTexto,
  Field,
  FormAlert,
  FormGrid,
  FormNote,
  FormPlaceholder,
  FormSection,
  FormSuccess,
  SubmitFooter,
} from "../../Components/Public/PublicForm";
import { usePaintPublicPage } from "../../hooks/usePaintPublicPage";
import { HOME_SCROLL_SECTIONS, navigateToHomeSection } from "../../lib/homeScrollTarget";
import { describirCupo } from "../../lib/formatoFormulario";
import { queueFocusFormError } from "../../lib/formFocus";
import { PROVINCIAS_CR, cantonesDeProvincia } from "../../lib/costaRicaDivisiones";
import {
  digitosConsultables,
  esperaConsultaIdentificacion,
  limpiarIdentificacion,
  placeholderIdentificacion,
  TIPOS_IDENTIFICACION,
  validarIdentificacion,
} from "../../lib/identificacionPersona";
import { obtenerHoyIso, ZONA_HORARIA_PREDETERMINADA } from "../../lib/zonaHoraria";
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
import "./SolicitarVisita.css";

const VISITA_LOGIN_REDIRECT = "/visitas";
const NOMBRE_PDF_INSTRUCTIVO = "instructivo_recomendaciones_visitas_cafe_una.pdf";
const IMAGEN_INSTRUCTIVO = "/visitas/kit-basico-agronomo.jpg";
const MENSAJE_FALTAN_CAMPOS = "Completá los campos obligatorios antes de enviar la solicitud.";
const MENSAJE_REVISAR_CAMPOS = "Revisá los campos marcados antes de enviar la solicitud.";

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

/** Order in which the first invalid field receives focus. */
const ORDEN_CAMPOS = [
  "encargadoIdentificacion",
  "encargadoNacionalidad",
  "encargadoNombre",
  "encargadoPrimerApellido",
  "encargadoEmail",
  "encargadoTelefono",
  "paisProcedencia",
  "provincia",
  "canton",
  "cantidadVisitantes",
  "tipoGrupo",
  "motivoVisita",
  "disponibilidadVisitaId",
];

function partesNombreCedula(datos) {
  return {
    nombre: String(datos?.nombre || datos?.Nombre || "").trim(),
    primerApellido: String(datos?.primerApellido || datos?.PrimerApellido || "").trim(),
    segundoApellido: String(datos?.segundoApellido || datos?.SegundoApellido || "").trim(),
  };
}

function parseIsoLocal(isoStr) {
  if (!isoStr) return null;
  const [y, m, d] = String(isoStr).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function esAvisoCedulaInformativo(mensaje) {
  return /cargad[oa]s?\s+autom[aá]ticamente/i.test(mensaje);
}

function validarSolicitud({ form, esPasaporte, tipoDocumento, selectedSlot, cantidadNum, cupoRestante }) {
  const errores = {};
  if (!form.encargadoIdentificacion.trim()) {
    errores.encargadoIdentificacion = "Ingresá la identificación";
  } else {
    const errorIdentificacion = validarIdentificacion(tipoDocumento, form.encargadoIdentificacion);
    if (errorIdentificacion) errores.encargadoIdentificacion = errorIdentificacion;
  }
  if (esPasaporte && !form.encargadoNacionalidad) {
    errores.encargadoNacionalidad = "Elegí el país de origen del pasaporte.";
  }
  if (!form.encargadoNombre.trim()) errores.encargadoNombre = "Ingresá el nombre";
  if (!form.encargadoPrimerApellido.trim()) errores.encargadoPrimerApellido = "Ingresá el primer apellido";
  if (!form.encargadoEmail.trim()) errores.encargadoEmail = "Ingresá el correo electrónico";
  else if (!esCorreoValido(form.encargadoEmail)) errores.encargadoEmail = MENSAJE_CORREO_INVALIDO;
  if (!form.encargadoTelefono.trim()) errores.encargadoTelefono = "Ingresá el teléfono";

  if (form.tipoVisitante === "Nacional") {
    if (!form.provincia.trim()) errores.provincia = "Elegí la provincia";
    if (!form.canton.trim()) errores.canton = "Elegí el cantón";
  } else {
    if (!form.paisProcedencia.trim()) errores.paisProcedencia = "Ingresá el país de procedencia del grupo";
    if (!form.provincia.trim()) errores.provincia = "Ingresá la provincia o estado";
    if (!form.canton.trim()) errores.canton = "Ingresá la ciudad";
  }

  if (!form.cantidadVisitantes) errores.cantidadVisitantes = "Ingresá la cantidad de visitantes";
  else if (Number(form.cantidadVisitantes) < 2) {
    errores.cantidadVisitantes = "Las visitas grupales requieren al menos 2 personas.";
  }
  if (!form.tipoGrupo.trim()) errores.tipoGrupo = "Ingresá el tipo de grupo";
  if (!form.motivoVisita.trim()) errores.motivoVisita = "Ingresá el motivo de la visita";

  if (!form.disponibilidadVisitaId) errores.disponibilidadVisitaId = "Elegí un horario con cupo";
  else if (selectedSlot?.agotada) {
    errores.disponibilidadVisitaId = "Ese horario se quedó sin cupo. Elegí otro.";
  }

  if (
    !errores.cantidadVisitantes &&
    selectedSlot &&
    selectedSlot.cupoRestante !== undefined &&
    cantidadNum > cupoRestante
  ) {
    errores.cantidadVisitantes = `La cantidad de visitantes (${cantidadNum}) supera el cupo disponible (${cupoRestante} personas) para este horario.`;
  }
  return errores;
}

/** "Antes de venir": what the group should know, grouped and scannable. Details stay in the dialog. */
function RecomendacionesVisita({ urlInstructivoPdf, onVerDetalle }) {
  return (
    <div className="pub-panel pub-form visita-antes">
      <FormSection title="Recomendaciones para la visita" hint="Antes de venir, esto es lo que conviene saber.">
        <div className="visita-antes__grupos">
          <section className="visita-antes__grupo">
            <h3 className="visita-antes__grupo-titulo">
              <ST>Qué llevar</ST>
            </h3>
            <ul className="visita-antes__lista">
              <li className="visita-antes__item">
                <Footprints size={20} aria-hidden="true" />
                <div>
                  <p className="visita-antes__titulo"><ST>Calzado cerrado obligatorio</ST></p>
                  <p className="visita-antes__desc">
                    <ST>Uso indispensable de calzado cerrado o botas con suela antideslizante para caminar por senderos agrícolas.</ST>
                  </p>
                </div>
              </li>
              <li className="visita-antes__item">
                <Droplets size={20} aria-hidden="true" />
                <div>
                  <p className="visita-antes__titulo"><ST>Hidratación continua</ST></p>
                  <p className="visita-antes__desc">
                    <ST>Llevá botella o termo reutilizable con agua potable para el recorrido.</ST>
                  </p>
                </div>
              </li>
              <li className="visita-antes__item">
                <Shirt size={20} aria-hidden="true" />
                <div>
                  <p className="visita-antes__titulo"><ST>Vestimenta y protección</ST></p>
                  <p className="visita-antes__desc">
                    <ST>Usá vestimenta cómoda, repelente y protección solar para actividades en campo abierto.</ST>
                  </p>
                </div>
              </li>
            </ul>
          </section>

          <section className="visita-antes__grupo">
            <h3 className="visita-antes__grupo-titulo">
              <ST>Durante la visita</ST>
            </h3>
            <ul className="visita-antes__lista">
              <li className="visita-antes__item">
                <Users size={20} aria-hidden="true" />
                <div>
                  <p className="visita-antes__titulo"><ST>Te acompaña personal del proyecto</ST></p>
                  <p className="visita-antes__desc">
                    <ST>Todas las visitas son recibidas o acompañadas por personal del proyecto.</ST>
                  </p>
                </div>
              </li>
            </ul>
          </section>

          <section className="visita-antes__grupo">
            <h3 className="visita-antes__grupo-titulo">
              <ST>Al llegar</ST>
            </h3>
            <ul className="visita-antes__lista">
              <li className="visita-antes__item">
                <Car size={20} aria-hidden="true" />
                <div>
                  <p className="visita-antes__titulo"><ST>Zonas de parqueo</ST></p>
                  <p className="visita-antes__desc">
                    <ST>Estacionamiento gratuito y vigilado para vehículos particulares, con área reservada para el desembarque y parqueo de autobuses o microbuses.</ST>
                  </p>
                </div>
              </li>
            </ul>
          </section>
        </div>

        <figure className="visita-antes__instructivo">
          <button type="button" className="visita-antes__instructivo-btn" onClick={onVerDetalle}>
            <img
              src={IMAGEN_INSTRUCTIVO}
              alt="Kit básico de agrónomo: botella de agua, botas, repelente, sombrero, bloqueador solar y cuchilla de bolsa"
              className="visita-antes__instructivo-img"
              loading="lazy"
            />
          </button>
          <figcaption className="visita-antes__instructivo-cap">
            <ST>Instructivo y recomendaciones generales de visita</ST>
          </figcaption>
        </figure>

        <div className="visita-antes__acciones">
          <a
            href={urlInstructivoPdf}
            target="_blank"
            rel="noopener noreferrer"
            className="pub-btn pub-btn--secondary"
            download={NOMBRE_PDF_INSTRUCTIVO}
          >
            <Download size={18} aria-hidden="true" />
            <ST>Descargar instructivo en PDF</ST>
          </a>
          <button type="button" onClick={onVerDetalle} className="pub-btn pub-btn--link">
            <Info size={18} aria-hidden="true" />
            <ST>Ver recomendaciones detalladas</ST>
          </button>
        </div>
      </FormSection>
    </div>
  );
}

function InstructivoDialog({ urlInstructivoPdf, onClose }) {
  const tCerrarVentana = useTraducir("Cerrar ventana");
  return (
    <ModalDialog className="pub-dialog-overlay" labelledBy="modal-recomendaciones-titulo" onClose={onClose}>
      <div className="pub-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="pub-dialog__header">
          <div>
            <h2 id="modal-recomendaciones-titulo" className="pub-serif-title pub-dialog__title">
              <ST>Instructivo de recomendaciones y seguridad</ST>
            </h2>
            <p className="pub-dialog__lead">
              <ST>Finca Experimental Santa Lucía - Café UNA. Para que tu experiencia sea memorable y segura, te solicitamos cumplir con las siguientes directrices durante la visita.</ST>
            </p>
          </div>
          <button type="button" className="pub-dialog-close" onClick={onClose} aria-label={tCerrarVentana}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="pub-dialog__body">
          <figure className="visita-instructivo__figura">
            <img
              src={IMAGEN_INSTRUCTIVO}
              alt="Kit básico de agrónomo: botella de agua, botas, repelente, sombrero, bloqueador solar y cuchilla de bolsa"
              className="visita-instructivo__imagen"
            />
            <figcaption className="visita-instructivo__caption">
              <ST>Kit básico de agrónomo — Instructivo y recomendaciones generales de visita</ST>
            </figcaption>
          </figure>

          <div className="visita-instructivo__punto">
            <Footprints size={20} aria-hidden="true" />
            <div>
              <h3><ST>Calzado cerrado obligatorio</ST></h3>
              <p>
                <ST>Es indispensable utilizar tenis deportivas, botas de senderismo o botas con buen agarre. Por normativas de prevención, no se admiten sandalias ni calzado abierto en los senderos.</ST>
              </p>
            </div>
          </div>
          <div className="visita-instructivo__punto">
            <Droplets size={20} aria-hidden="true" />
            <div>
              <h3><ST>Hidratación y vestimenta cómoda</ST></h3>
              <p>
                <ST>Usá vestimenta cómoda y apropiada para recorridos al aire libre bajo el sol. Sugerimos pantalón largo ligero. La finca dispone de tomas de agua potable para rellenar botellas reutilizables.</ST>
              </p>
            </div>
          </div>
          <div className="visita-instructivo__punto">
            <Bug size={20} aria-hidden="true" />
            <div>
              <h3><ST>Repelente contra insectos y protección solar</ST></h3>
              <p>
                <ST>Llevá repelente si visitarán zonas con vegetación densa o cafetales. Considerá protección solar, sombrero o gorra y gafas oscuras durante las horas de mayor radiación.</ST>
              </p>
            </div>
          </div>
          <div className="visita-instructivo__punto">
            <Car size={20} aria-hidden="true" />
            <div>
              <h3><ST>Zonas de parqueo y acceso</ST></h3>
              <p>
                <ST>Disponemos de estacionamiento gratuito vigilado para automóviles y área reservada para el desembarque y parqueo de autobuses o microbuses.</ST>
              </p>
            </div>
          </div>
        </div>

        <div className="pub-dialog__footer">
          <a
            href={urlInstructivoPdf}
            target="_blank"
            rel="noopener noreferrer"
            className="pub-btn pub-btn--secondary"
            download={NOMBRE_PDF_INSTRUCTIVO}
          >
            <Download size={18} aria-hidden="true" />
            <ST>Descargar PDF</ST>
          </a>
          <button type="button" onClick={onClose} className="pub-btn pub-btn--primary">
            <ST>Entendido, cerrar</ST>
          </button>
        </div>
      </div>
    </ModalDialog>
  );
}

export default function SolicitarVisita() {
  const navigate = useNavigate();
  const { idioma } = useIdioma();
  const localeFecha = idioma === "en" ? enUS : es;
  const tPhPais = useTraducir("País de procedencia");
  const tPhProvincia = useTraducir("Provincia o estado");
  const tPhCiudad = useTraducir("Ciudad");
  const tPhTipoGrupo = useTraducir("Universidad, empresa, asociación…");
  const tElegirProvincia = useTraducir("Seleccioná una provincia");
  const tElegirCanton = useTraducir("Seleccioná un cantón");
  const tPrimeroProvincia = useTraducir("Primero seleccioná una provincia");
  const tElegiPais = useTraducir("Elegí el país");
  const session = getActiveSessionUser();
  const isAuthenticated = Boolean(session?.token || session?.id);

  const [form, setForm] = useState(() => ({
    ...INITIAL_FORM,
    encargadoEmail: session?.email || "",
  }));
  const [error, setError] = useState("");
  const [errores, setErrores] = useState({});
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState([]);
  const [availabilityStatus, setAvailabilityStatus] = useState("loading");
  const [availabilityError, setAvailabilityError] = useState("");
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [recargaDisponibilidad, setRecargaDisponibilidad] = useState(0);
  const [zonaHoraria] = useState(ZONA_HORARIA_PREDETERMINADA);
  const hoyIso = useMemo(() => obtenerHoyIso(zonaHoraria), [zonaHoraria]);

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

  // Enabled dates (YYYY-MM-DD -> slots)
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

  const fechasHabilitadasDates = useMemo(() => {
    const list = [];
    for (const [iso] of fechasHabilitadasMap) {
      const parsed = parseIsoLocal(iso);
      if (parsed) list.push(parsed);
    }
    return list;
  }, [fechasHabilitadasMap]);

  const isDateDisabled = useCallback(
    (date) => {
      const iso = format(date, "yyyy-MM-dd");
      if (iso < hoyIso) return true;
      return !fechasHabilitadasMap.has(iso);
    },
    [fechasHabilitadasMap, hoyIso],
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

  // Live capacity of the slots of the chosen date
  useEffect(() => {
    if (!fechaSeleccionada) return;
    const iso = format(fechaSeleccionada, "yyyy-MM-dd");
    let active = true;
    setFranjasFecha([]);
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

        // Preselect the first enabled date
        const habilitados = slots.filter((s) => s.habilitada);
        if (habilitados.length > 0) {
          const parsed = parseIsoLocal(habilitados[0].fecha);
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
  }, [recargaDisponibilidad]);

  const limpiarError = (campo) => {
    setErrores((prev) => {
      if (!prev[campo]) return prev;
      const next = { ...prev };
      delete next[campo];
      return next;
    });
  };

  const handleSelectFecha = (date) => {
    if (!date) return;
    setFechaSeleccionada(date);
    const iso = format(date, "yyyy-MM-dd");
    // A slot from another date no longer applies
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
        setAvisoCedula("No se encontraron datos para esta identificación. Completá los datos manualmente.");
        return;
      }
      consultaCedulaRef.current = { digitos, enCurso: false };
      setForm((prev) => ({
        ...prev,
        encargadoNombre: partes.nombre,
        encargadoPrimerApellido: partes.primerApellido,
        encargadoSegundoApellido: partes.segundoApellido,
      }));
      setErrores((prev) => {
        const next = { ...prev };
        delete next.encargadoNombre;
        delete next.encargadoPrimerApellido;
        delete next.encargadoIdentificacion;
        return next;
      });
      setAvisoCedula("Datos cargados automáticamente. Podés editarlos si hace falta.");
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
            ? `${mensajeBase} Mientras tanto, completá los datos manualmente.`
            : `${mensajeBase} Completá los datos manualmente.`,
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
        next.paisProcedencia = "";
      }
      return next;
    });
    limpiarError(name);
    if (name === "cantidadVisitantes") limpiarError("disponibilidadVisitaId");

    if (name === "encargadoIdentificacion" || name === "encargadoTipoIdentificacion") {
      consultaCedulaRef.current = { digitos: "", enCurso: false };
      setAvisoCedula(null);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const formEl = event.currentTarget;
    setError("");
    setSuccess(null);

    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }

    const nuevosErrores = validarSolicitud({
      form,
      esPasaporte,
      tipoDocumento,
      selectedSlot,
      cantidadNum,
      cupoRestante: cupoRestanteSeleccionado,
    });
    setErrores(nuevosErrores);
    const claves = Object.keys(nuevosErrores);
    if (claves.length > 0) {
      const faltan = claves.some((clave) => /^(Ingresá|Elegí) /.test(nuevosErrores[clave]));
      setError(faltan ? MENSAJE_FALTAN_CAMPOS : MENSAJE_REVISAR_CAMPOS);
      queueFocusFormError({
        errors: nuevosErrores,
        root: formEl,
        fieldOrder: ORDEN_CAMPOS,
        idPrefix: "visita-",
      });
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
      queueFocusFormError({ root: formEl });
    } finally {
      setSubmitting(false);
    }
  };

  const reiniciarFormulario = () => {
    setSuccess(null);
    setError("");
    setErrores({});
    setAvisoCedula(null);
    consultaCedulaRef.current = { digitos: "", enCurso: false };
    setForm({ ...INITIAL_FORM, encargadoEmail: session?.email || "" });
    // The group just sent used up capacity: forget the stale slots and load them again
    setFechaSeleccionada(null);
    setFranjasFecha([]);
    setAvailabilityStatus("loading");
    setRecargaDisponibilidad((n) => n + 1);
  };

  const sinFechas = availabilityStatus === "success" && fechasHabilitadasDates.length === 0;
  const esInternacional = form.tipoVisitante === "Internacional";

  return (
    <>
      {showLoading ? <PageLoading message={loadingMessage} /> : null}
      <main
        className={`pub-page pub-form-page${showPrepaint ? " pub-form-page--prepaint" : ""}`}
        inert={inert}
        ref={pageRef}
      >
        <div className="pub-form-container pub-form-container--wide">
          <div className="pub-form-back">
            <BackToHomeLink homeSection={HOME_SCROLL_SECTIONS.iniciativas} />
          </div>

          <PublicPageHeader
            title="Solicitud de visitas grupales"
            lead="Completá los datos del grupo y elegí un horario con cupo."
            titleId="visita-titulo"
          />

          {success ? (
            <FormSuccess
              title="Solicitud enviada"
              summary={`Solicitud #${success.id} enviada en estado ${success.estado}. El equipo de Café UNA la va a revisar y te avisamos por correo electrónico.`}
            >
              <button type="button" className="pub-btn pub-btn--primary" onClick={reiniciarFormulario}>
                <ST>Hacer otra solicitud</ST>
              </button>
              <button
                type="button"
                className="pub-btn pub-btn--secondary"
                onClick={() => navigateToHomeSection(navigate, HOME_SCROLL_SECTIONS.iniciativas)}
              >
                <ST>Volver al inicio</ST>
              </button>
            </FormSuccess>
          ) : (
            <>
              <RecomendacionesVisita
                urlInstructivoPdf={urlInstructivoPdf}
                onVerDetalle={() => setModalRecomendacionesAbierto(true)}
              />

              {modalRecomendacionesAbierto ? (
                <InstructivoDialog
                  urlInstructivoPdf={urlInstructivoPdf}
                  onClose={() => setModalRecomendacionesAbierto(false)}
                />
              ) : null}

              <form
                className="pub-panel pub-form visita-form"
                onSubmit={submit}
                onFocusCapture={handleFormInteractionCapture}
                onPointerDownCapture={handleFormInteractionCapture}
                aria-labelledby="visita-titulo"
                noValidate
              >
                <FormSection
                  title="Datos del encargado"
                  hint="La persona responsable de coordinar la visita."
                >
                  <FormGrid cols={3}>
                    <Field id="visita-encargadoTipoIdentificacion" label="Tipo de identificación" required>
                      {(c) => (
                        <SelectFiltro
                          {...c}
                          name="encargadoTipoIdentificacion"
                          value={tipoDocumento}
                          onChange={update}
                          traducirOpciones
                        >
                          {TIPOS_IDENTIFICACION.map((tipo) => (
                            <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                          ))}
                        </SelectFiltro>
                      )}
                    </Field>
                    {esPasaporte ? (
                      <Field
                        id="visita-encargadoNacionalidad"
                        label="País de origen"
                        required
                        error={errores.encargadoNacionalidad}
                      >
                        {(c) => (
                          <SelectFiltro
                            {...c}
                            name="encargadoNacionalidad"
                            value={form.encargadoNacionalidad}
                            onChange={update}
                          >
                            <option value="">{tElegiPais}</option>
                            {opcionesPais.map((pais) => (
                              <option key={pais.value} value={pais.value}>{pais.label}</option>
                            ))}
                          </SelectFiltro>
                        )}
                      </Field>
                    ) : null}
                    <Field
                      id="visita-encargadoIdentificacion"
                      label="Identificación"
                      required
                      error={errores.encargadoIdentificacion}
                    >
                      {(c) => (
                        <input
                          {...c}
                          className="pub-input"
                          name="encargadoIdentificacion"
                          value={form.encargadoIdentificacion}
                          onChange={update}
                          onBlur={handleIdentificacionBlur}
                          inputMode={esPasaporte ? "text" : "numeric"}
                          autoComplete="off"
                          placeholder={tPhIdentificacion}
                        />
                      )}
                    </Field>
                    <Field
                      id="visita-encargadoNombre"
                      label="Nombre"
                      required
                      error={errores.encargadoNombre}
                    >
                      {(c) => (
                        <input
                          {...c}
                          className="pub-input"
                          name="encargadoNombre"
                          value={form.encargadoNombre}
                          onChange={update}
                        />
                      )}
                    </Field>
                    <Field
                      id="visita-encargadoPrimerApellido"
                      label="Primer apellido"
                      required
                      error={errores.encargadoPrimerApellido}
                    >
                      {(c) => (
                        <input
                          {...c}
                          className="pub-input"
                          name="encargadoPrimerApellido"
                          value={form.encargadoPrimerApellido}
                          onChange={update}
                        />
                      )}
                    </Field>
                    <Field id="visita-encargadoSegundoApellido" label="Segundo apellido">
                      {(c) => (
                        <input
                          {...c}
                          className="pub-input"
                          name="encargadoSegundoApellido"
                          value={form.encargadoSegundoApellido}
                          onChange={update}
                        />
                      )}
                    </Field>
                    <Field
                      id="visita-encargadoEmail"
                      label="Correo electrónico"
                      required
                      error={errores.encargadoEmail}
                    >
                      {(c) => (
                        <input
                          {...c}
                          className="pub-input"
                          type="email"
                          inputMode="email"
                          name="encargadoEmail"
                          value={form.encargadoEmail}
                          onChange={update}
                        />
                      )}
                    </Field>
                    <Field
                      id="visita-encargadoTelefono"
                      label="Teléfono"
                      required
                      error={errores.encargadoTelefono}
                    >
                      {(c) => (
                        <NumericInput
                          {...c}
                          className="pub-input"
                          name="encargadoTelefono"
                          value={form.encargadoTelefono}
                          onChange={update}
                          maxLength={15}
                        />
                      )}
                    </Field>
                    <Field id="visita-encargadoInstitucion" label="Institución">
                      {(c) => (
                        <input
                          {...c}
                          className="pub-input"
                          name="encargadoInstitucion"
                          value={form.encargadoInstitucion}
                          onChange={update}
                        />
                      )}
                    </Field>
                  </FormGrid>
                  <div aria-live="polite">
                    {consultandoCedula ? (
                      <p className="pub-form-status"><ST>Consultando identificación…</ST></p>
                    ) : avisoCedula ? (
                      <p
                        className={`pub-form-status ${
                          esAvisoCedulaInformativo(avisoCedula) ? "pub-form-status--ok" : "pub-form-status--problem"
                        }`}
                      >
                        <ST>{avisoCedula}</ST>
                      </p>
                    ) : null}
                  </div>
                </FormSection>

                <FormSection
                  title="Datos del grupo"
                  hint="Las visitas grupales requieren al menos dos personas."
                >
                  <FormGrid cols={3}>
                    <Field id="visita-tipoVisitante" label="Tipo de visitante" required>
                      {(c) => (
                        <SelectFiltro
                          {...c}
                          name="tipoVisitante"
                          value={form.tipoVisitante}
                          onChange={update}
                          traducirOpciones
                        >
                          <option value="Nacional">Nacional</option>
                          <option value="Internacional">Internacional</option>
                        </SelectFiltro>
                      )}
                    </Field>

                    {esInternacional ? (
                      <>
                        <Field
                          id="visita-paisProcedencia"
                          label="País de procedencia"
                          required
                          error={errores.paisProcedencia}
                        >
                          {(c) => (
                            <input
                              {...c}
                              className="pub-input"
                              name="paisProcedencia"
                              value={form.paisProcedencia}
                              onChange={update}
                              placeholder={tPhPais}
                            />
                          )}
                        </Field>
                        <Field
                          id="visita-provincia"
                          label="Provincia o estado"
                          required
                          error={errores.provincia}
                        >
                          {(c) => (
                            <input
                              {...c}
                              className="pub-input"
                              name="provincia"
                              value={form.provincia}
                              onChange={update}
                              placeholder={tPhProvincia}
                            />
                          )}
                        </Field>
                        <Field id="visita-canton" label="Ciudad" required error={errores.canton}>
                          {(c) => (
                            <input
                              {...c}
                              className="pub-input"
                              name="canton"
                              value={form.canton}
                              onChange={update}
                              placeholder={tPhCiudad}
                            />
                          )}
                        </Field>
                      </>
                    ) : (
                      <>
                        <Field id="visita-provincia" label="Provincia" required error={errores.provincia}>
                          {(c) => (
                            <SelectFiltro {...c} name="provincia" value={form.provincia} onChange={update}>
                              <option value="">{tElegirProvincia}</option>
                              {PROVINCIAS_CR.map((prov) => (
                                <option key={prov} value={prov}>
                                  {prov}
                                </option>
                              ))}
                            </SelectFiltro>
                          )}
                        </Field>
                        <Field id="visita-canton" label="Cantón" required error={errores.canton}>
                          {(c) => (
                            <SelectFiltro
                              {...c}
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
                          )}
                        </Field>
                      </>
                    )}

                    <Field
                      id="visita-cantidadVisitantes"
                      label="Cantidad de visitantes"
                      required
                      error={errores.cantidadVisitantes}
                    >
                      {(c) => (
                        <NumericInput
                          {...c}
                          className="pub-input"
                          name="cantidadVisitantes"
                          value={form.cantidadVisitantes}
                          onChange={update}
                          maxLength={4}
                        />
                      )}
                    </Field>
                    <Field id="visita-tipoGrupo" label="Tipo de grupo" required error={errores.tipoGrupo}>
                      {(c) => (
                        <input
                          {...c}
                          className="pub-input"
                          name="tipoGrupo"
                          value={form.tipoGrupo}
                          onChange={update}
                          placeholder={tPhTipoGrupo}
                        />
                      )}
                    </Field>
                    <Field
                      id="visita-motivoVisita"
                      label="Motivo de la visita"
                      required
                      error={errores.motivoVisita}
                    >
                      {(c) => (
                        <input
                          {...c}
                          className="pub-input"
                          name="motivoVisita"
                          value={form.motivoVisita}
                          onChange={update}
                        />
                      )}
                    </Field>
                  </FormGrid>
                </FormSection>

                <FormSection
                  title="Fecha y horario"
                  hint="Elegí un día habilitado en el calendario y después el turno que prefieras."
                >
                  {availabilityStatus === "loading" ? (
                    <FormPlaceholder loading title="Cargando fechas y horarios disponibles…" />
                  ) : availabilityStatus === "error" ? (
                    <p className="pub-alert" role="alert">
                      <ST>{availabilityError || "No se pudieron cargar los horarios disponibles."}</ST>
                    </p>
                  ) : sinFechas ? (
                    <FormPlaceholder title="No hay fechas y horarios habilitados">
                      Por ahora no hay fechas habilitadas para visitas grupales. Consultá más adelante.
                    </FormPlaceholder>
                  ) : (
                    <div className="visita-fecha">
                      <CalendarPicker
                        id="visita-fecha"
                        label="Calendario de fechas disponibles"
                        selected={fechaSeleccionada}
                        onSelect={handleSelectFecha}
                        disabled={isDateDisabled}
                        locale={localeFecha}
                        enabledDates={fechasHabilitadasDates}
                        legend="Fecha disponible para visitas"
                      />

                      <div className="visita-fecha__horarios">
                        {!fechaSeleccionada ? (
                          <FormPlaceholder title="Elegí una fecha en el calendario">
                            Al elegir un día habilitado vas a ver los horarios y los cupos de esa fecha.
                          </FormPlaceholder>
                        ) : cargandoFranjas && slotsActuales.length === 0 ? (
                          <FormPlaceholder loading title="Consultando bloques horarios y aforo disponible…" />
                        ) : slotsActuales.length === 0 ? (
                          <FormPlaceholder title="Sin turnos para esta fecha">
                            No hay turnos disponibles para el día elegido.
                          </FormPlaceholder>
                        ) : (
                          <ChoiceGroup
                            legend="Horarios disponibles"
                            required
                            slots
                            error={errores.disponibilidadVisitaId}
                          >
                            {slotsActuales.map((slot) => {
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
                              const cupo = describirCupo({
                                cupoRestante: slot.cupoRestante,
                                capacidadMaxima: slot.capacidadMaxima,
                                agotada: slot.agotada,
                              });
                              return (
                                <ChoiceCard
                                  key={slot.id}
                                  variant="slot"
                                  name="disponibilidadVisitaId"
                                  value={slot.id}
                                  checked={form.disponibilidadVisitaId === slot.id}
                                  disabled={cupo.estado === "agotado"}
                                  aria-label={`Horario ${slot.horaInicio?.slice(0, 5) || ""} ${franja}`}
                                  onChange={() => {
                                    setForm((prev) => ({ ...prev, disponibilidadVisitaId: slot.id }));
                                    limpiarError("disponibilidadVisitaId");
                                  }}
                                  title={franja}
                                  description={slot.nota}
                                  meta={<CupoTexto estado={cupo.estado} texto={cupo.texto} />}
                                />
                              );
                            })}
                          </ChoiceGroup>
                        )}

                        {cupoExcedido ? (
                          <FormNote tone="warning">
                            <p>
                              <ST>
                                {`Atención: la cantidad solicitada (${cantidadNum} personas) supera el cupo restante (${cupoRestanteSeleccionado} personas) de este horario.`}
                              </ST>
                            </p>
                          </FormNote>
                        ) : null}
                      </div>
                    </div>
                  )}
                </FormSection>

                <FormSection
                  title="Necesidades del grupo"
                  hint="Contanos si necesitan algo especial para la visita."
                >
                  <ChoiceGroup label="Necesidades del grupo" type="checkbox" columns={2}>
                    <ChoiceCard
                      type="checkbox"
                      name="requiereAccesibilidad"
                      checked={form.requiereAccesibilidad}
                      onChange={update}
                      title="Requerimientos de accesibilidad"
                    />
                    <ChoiceCard
                      type="checkbox"
                      name="requiereParqueoBus"
                      checked={form.requiereParqueoBus}
                      onChange={update}
                      title="Parqueo"
                    />
                  </ChoiceGroup>
                  <Field id="visita-observaciones" label="Observaciones">
                    {(c) => (
                      <textarea
                        {...c}
                        className="pub-textarea"
                        name="observaciones"
                        rows={4}
                        value={form.observaciones}
                        onChange={update}
                      />
                    )}
                  </Field>
                </FormSection>

                <AvisoSedeFinca sede={sedeFinca} contexto="visita" />

                <FormAlert>{error}</FormAlert>

                <SubmitFooter
                  label="Enviar solicitud"
                  busyLabel="Enviando…"
                  busy={submitting}
                  disabled={availabilityStatus === "error" || sinFechas}
                />
              </form>
            </>
          )}
        </div>
      </main>
    </>
  );
}
