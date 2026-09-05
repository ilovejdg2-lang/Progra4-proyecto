import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarCheck2,
  Check,
  Clock,
  FileText,
  HandHeart,
  Lock,
  Mail,
  Sprout,
  Trash2,
  UploadCloud,
  User,
  Users,
} from "lucide-react";
import { format, isBefore, parseISO, startOfDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import BackToHomeLink from "../../Components/BackToHomeLink/BackToHomeLink";
import { NumericInput } from "../../Components/NumericInput/NumericInput";
import { HOME_SCROLL_SECTIONS } from "../../lib/homeScrollTarget";
import PageLoading from "../../Components/PageLoading/PageLoading";
import { usePaintPublicPage } from "../../hooks/usePaintPublicPage";
import { getActiveSessionUser } from "../../services/sessionService";
import { crearSolicitud } from "../../services/voluntariadoService";
import { consultarCedulaDetallada } from "../../services/cedulaService";
import { obtenerFechasDisponibles } from "../../services/voluntariadoFechasService";
import { Calendar } from "@/components/ui/calendar";
import { queueFocusFormError } from "../../lib/formFocus";
import { filtrarEnteros } from "../../lib/numericInput";
import {
  limitarPalabras,
  MAX_PALABRAS_TITULO,
} from "../../lib/formLimits";
import { useTraducir } from "../../hooks/useTraducir";
import { useIdioma } from "../../lib/useIdioma";
import { ST } from "../../Components/T/ST";
import { asegurarCamposEnEspanol } from "../../lib/traducir";
import "./SolicitarVoluntariado.css";

function SectionCard({ icon: Icon, title, hint, children }) {
  return (
    <div className="section-card">
      <div className="section-card__header">
        {Icon && <Icon size={20} className="section-card__icon-inline" />}
        <div className="section-card__titles">
          <h4>{title}</h4>
          {hint && <span className="section-card__hint">{hint}</span>}
        </div>
      </div>
      <div className="section-card__body">{children}</div>
    </div>
  );
}

const TIPOS_VOLUNTARIADO = [
  "Apoyo General",
  "Capacitaciones",
  "Investigación Académica",
  "Actividades de limpieza y mantenimiento",
  "Otro",
];

const OPCIONES_DISPONIBILIDAD = [
  {
    id: "manana",
    valor: "Mañana (8:00 a. m. – 12:00 m.)",
    titulo: "Mañana",
    horario: "8:00 a. m. – 12:00 m.",
  },
  {
    id: "tarde",
    valor: "Tarde (1:00 p. m. – 5:00 p. m.)",
    titulo: "Tarde",
    horario: "1:00 p. m. – 5:00 p. m.",
  },
  {
    id: "completo",
    valor: "Horario completo (8:00 a. m. – 5:00 p. m.)",
    titulo: "Horario completo",
    horario: "8:00 a. m. – 5:00 p. m.",
  },
];

const FORM_INICIAL = {
  modalidad: "individual",
  cantidadParticipantes: "",
  tipo: "",
  tipoOtro: "",
  esNacional: "",
  nombre: "",
  primerApellido: "",
  segundoApellido: "",
  identificacion: "",
  institucion: "",
  pais: "",
  correo: "",
  telefono: "",
  fechaVoluntariado: "",
  disponibilidad: "",
};

function normalizarCedulaCr(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

function obtenerUsuarioActual() {
  return getActiveSessionUser();
}

function obtenerCorreoUsuario(user) {
  return String(user?.email || user?.correo || "").trim().toLowerCase();
}

function esAvisoCedulaInformativo(mensaje) {
  return /cargad[oa]s?\s+autom[aá]ticamente/i.test(mensaje) || /datos cargados/i.test(mensaje);
}

function crearFormularioInicial(user) {
  return {
    ...FORM_INICIAL,
    correo: obtenerCorreoUsuario(user),
  };
}

const VOLUNTARIADO_LOGIN_REDIRECT = "/voluntariado/solicitar";

function SolicitarVoluntariado() {
  const navigate = useNavigate();
  const { idioma } = useIdioma();
  const locale = idioma === "en" ? enUS : es;

  const tTitulo = useTraducir("Únete a nuestras iniciativas");
  const tSub = useTraducir(
    "Complete el siguiente formulario para aplicar al área de voluntariado de su interés.",
  );
  const tComo = useTraducir("¿Cómo desea participar?");
  const tIndividual = useTraducir("Individual");
  const tGrupal = useTraducir("Grupal");

  const tInfoPersonal = useTraducir("Información personal del solicitante");
  const tInfoPersonalHint = useTraducir("Datos personales y de contacto del voluntario");
  const tInfoResponsable = useTraducir("Información del responsable del grupo");
  const tInfoResponsableHint = useTraducir("Datos personales y de contacto de la persona a cargo de la coordinación del grupo");

  const tNacional = useTraducir("¿Es nacional costarricense?");
  const tSi = useTraducir("Sí");
  const tNo = useTraducir("No");
  const tCedula = useTraducir("Cédula");
  const tIdentificacion = useTraducir("Identificación");
  const tNombre = useTraducir("Nombre");
  const tPrimerApellido = useTraducir("Primer apellido");
  const tSegundoApellido = useTraducir("Segundo apellido");
  const tPasaporte = useTraducir("Pasaporte / ID");
  const tPhNombre = useTraducir("Nombre");
  const tPh1 = useTraducir("1° Apellido");
  const tPh2 = useTraducir("2° Apellido");
  const tInstitucion = useTraducir("Institución educativa");
  const tPais = useTraducir("País de residencia");
  const tPhInstitucion = useTraducir("Ej. Universidad Nacional");
  const tPhPais = useTraducir("Ej. Costa Rica");
  const tContacto = useTraducir("Contacto del solicitante");
  const tContactoResp = useTraducir("Contacto del responsable del grupo");
  const tCorreo = useTraducir("Correo electrónico");
  const tTelefono = useTraducir("Número de teléfono");

  const tFechaVoluntariado = useTraducir("Fecha del voluntariado");
  const tFechaVoluntariadoHint = useTraducir("Seleccione una de las fechas habilitadas en el calendario");
  const tDisponibilidad = useTraducir("Disponibilidad");
  const tDisponibilidadHint = useTraducir("Seleccione la jornada en la que asistirá");

  const tTipoVol = useTraducir("Tipo de voluntariado");
  const tTipoHint = useTraducir("Seleccione una única opción");
  const tLoginMsg = useTraducir("Debe iniciar sesión para enviar su solicitud de voluntariado.");
  const tLoginLink = useTraducir("Iniciar sesión →");
  const tEnviar = useTraducir("Enviar Solicitud");
  const tEnviando = useTraducir("Enviando...");
  const tLoginBtn = useTraducir("Inicie sesión para enviar");

  const tInfoGrupo = useTraducir("Información del grupo");
  const tInfoGrupoHint = useTraducir("Datos de los participantes que asistirán al voluntariado");
  const tCantParticipantes = useTraducir("Cantidad de participantes");
  const tPhCantidad = useTraducir("Ej. 15");
  const tDocIntegrantes = useTraducir("Lista de integrantes del grupo");

  const [usuario] = useState(() => obtenerUsuarioActual());
  const [formulario, setFormulario] = useState(() => crearFormularioInicial(obtenerUsuarioActual()));

  const [fechasDisponibles, setFechasDisponibles] = useState([]);
  const [cargandoFechas, setCargandoFechas] = useState(true);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(undefined);
  const [documentoGrupo, setDocumentoGrupo] = useState(null);

  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorApi, setErrorApi] = useState(null);
  const [consultandoCedula, setConsultandoCedula] = useState(false);
  const [avisoCedula, setAvisoCedula] = useState(null);
  const [nombreAutocargado, setNombreAutocargado] = useState(false);

  const {
    ref: pageRef,
    showLoading,
    showPrepaint,
    inert,
    loadingMessage,
  } = usePaintPublicPage("voluntariado");

  const esGrupal = formulario.modalidad === "grupal";
  const esTipoOtro = formulario.tipo === "Otro";
  const esNacionalCr = formulario.esNacional === "si";
  const consultaCedulaRef = useRef({ digitos: "", enCurso: false });

  // Cargar fechas habilitadas configuradas por el Administrador
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const data = await obtenerFechasDisponibles();
        if (!cancelado) {
          setFechasDisponibles(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.warn("No se pudieron cargar las fechas disponibles:", err);
      } finally {
        if (!cancelado) setCargandoFechas(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  // Mapeo de fechas habilitadas (string YYYY-MM-DD -> boolean)
  const fechasHabilitadasMap = useMemo(() => {
    const map = new Map();
    for (const f of fechasDisponibles) {
      const iso = String(f.Fecha || f.fecha || "").slice(0, 10);
      if (iso && (f.Habilitada || f.habilitada)) {
        map.set(iso, f);
      }
    }
    return map;
  }, [fechasDisponibles]);

  // Lista de objetos Date habilitados para modifiers de Calendar
  const fechasHabilitadasDates = useMemo(() => {
    const list = [];
    for (const [iso] of fechasHabilitadasMap) {
      const [y, m, d] = iso.split("-").map(Number);
      if (y && m && d) list.push(new Date(y, m - 1, d));
    }
    return list;
  }, [fechasHabilitadasMap]);

  // Función para deshabilitar días en el calendario:
  // Solo se pueden seleccionar fechas habilitadas por el Administrador
  const isDateDisabled = useCallback(
    (date) => {
      const hoy = startOfDay(new Date());
      if (isBefore(startOfDay(date), hoy)) return true;
      const iso = format(date, "yyyy-MM-dd");
      return !fechasHabilitadasMap.has(iso);
    },
    [fechasHabilitadasMap]
  );

  const redirectToLogin = useCallback(() => {
    sessionStorage.setItem("postLoginRedirect", VOLUNTARIADO_LOGIN_REDIRECT);
    navigate({ to: "/login" });
  }, [navigate]);

  const handleFormInteractionCapture = useCallback(
    (event) => {
      if (usuario) return;
      if (event.target.closest(".auth-banner__link")) return;

      event.preventDefault();
      event.stopPropagation();
      redirectToLogin();
    },
    [usuario, redirectToLogin]
  );

  const limpiarError = (campo) => {
    if (errores[campo]) {
      setErrores((prev) => {
        const next = { ...prev };
        delete next[campo];
        return next;
      });
    }
  };

  const consultarDatosCedula = useCallback(async (digitos, { forzar = false } = {}) => {
    if (!esNacionalCr || digitos.length !== 9) return;
    if (consultaCedulaRef.current.enCurso) return;
    if (!forzar && consultaCedulaRef.current.digitos === digitos) return;

    consultaCedulaRef.current = { digitos, enCurso: true };
    setConsultandoCedula(true);
    setAvisoCedula(null);

    try {
      const datos = await consultarCedulaDetallada(digitos);
      const nombre = datos?.nombre || datos?.Nombre || "";
      const primerApellido = datos?.primerApellido || datos?.PrimerApellido || "";
      const segundoApellido = datos?.segundoApellido || datos?.SegundoApellido || "";

      if (!nombre && !primerApellido) {
        consultaCedulaRef.current = { digitos: "", enCurso: false };
        setNombreAutocargado(false);
        setFormulario((prev) => ({
          ...prev,
          nombre: "",
          primerApellido: "",
          segundoApellido: "",
        }));
        setAvisoCedula("No se encontraron datos para esta cédula. Complete los datos manualmente.");
        return;
      }

      consultaCedulaRef.current = { digitos, enCurso: false };
      setNombreAutocargado(true);
      setFormulario((prev) => ({
        ...prev,
        identificacion: digitos,
        nombre,
        primerApellido,
        segundoApellido,
        pais: "Costa Rica",
      }));
      setAvisoCedula("Datos cargados automáticamente. Puede editarlos si es necesario.");
      setErrores((prev) => {
        if (!prev.nombre && !prev.identificacion && !prev.primerApellido) return prev;
        const next = { ...prev };
        delete next.nombre;
        delete next.primerApellido;
        delete next.identificacion;
        return next;
      });
    } catch (error) {
      consultaCedulaRef.current = { digitos: "", enCurso: false };
      setNombreAutocargado(false);
      setFormulario((prev) => ({
        ...prev,
        nombre: "",
        primerApellido: "",
        segundoApellido: "",
      }));
      const mensajeBase = error?.message?.trim() || "No se pudo consultar la cédula.";
      const yaIndicaManual = /manualmente|completar el nombre/i.test(mensajeBase);
      const esConexion = error?.cause?.code === "ERR_NETWORK" || /conectar con el servidor/i.test(mensajeBase);
      setAvisoCedula(
        yaIndicaManual
          ? mensajeBase
          : esConexion
          ? `${mensajeBase} Mientras tanto, complete los datos manualmente.`
          : `${mensajeBase} Complete los datos manualmente.`
      );
    } finally {
      setConsultandoCedula(false);
    }
  }, [esNacionalCr]);

  useEffect(() => {
    if (!esNacionalCr) return;

    const digitos = normalizarCedulaCr(formulario.identificacion);
    if (digitos.length !== 9) return;
    if (consultaCedulaRef.current.enCurso) return;
    if (consultaCedulaRef.current.digitos === digitos) return;

    const timeoutId = window.setTimeout(() => {
      consultarDatosCedula(digitos);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [formulario.identificacion, esNacionalCr, consultarDatosCedula]);

  const handleSelectFecha = (date) => {
    setFechaSeleccionada(date);
    const isoStr = date ? format(date, "yyyy-MM-dd") : "";
    setFormulario((prev) => ({
      ...prev,
      fechaVoluntariado: isoStr,
    }));
    limpiarError("fechaVoluntariado");
  };

  const handleDisponibilidad = (valor) => {
    setFormulario((prev) => ({
      ...prev,
      disponibilidad: valor,
    }));
    limpiarError("disponibilidad");
  };

  const handleDocumentoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrores((prev) => ({
        ...prev,
        documentoGrupo: "El archivo excede el tamaño máximo permitido (10 MB)",
      }));
      return;
    }

    setDocumentoGrupo(file);
    limpiarError("documentoGrupo");
  };

  const handleRemoverDocumento = () => {
    setDocumentoGrupo(null);
  };

  const handleChange = (e) => {
    let valor = e.target.value;
    const name = e.target.name;

    if (typeof valor === "string") {
      valor = valor.replace(/\s+/g, " ").trimStart();
    }

    if (name === "correo") {
      valor = valor.toLowerCase();
    }

    if (name === "telefono") {
      valor = filtrarEnteros(valor).slice(0, 8);
    }

    if (name === "identificacion") {
      if (formulario.esNacional === "si") {
        valor = valor.replace(/\D/g, "").slice(0, 9);
        consultaCedulaRef.current = { digitos: "", enCurso: false };
        setNombreAutocargado(false);
        setFormulario((prev) => ({
          ...prev,
          identificacion: valor,
          nombre: "",
          primerApellido: "",
          segundoApellido: "",
        }));
        setAvisoCedula(null);
        limpiarError(name);
        return;
      }

      valor = valor.replace(/\s+/g, " ").trimStart();
    }

    if (
      name === "nombre" ||
      name === "primerApellido" ||
      name === "segundoApellido" ||
      name === "institucion" ||
      name === "pais" ||
      name === "tipoOtro"
    ) {
      valor = limitarPalabras(valor, MAX_PALABRAS_TITULO);
    }

    setFormulario((prev) => ({
      ...prev,
      [name]: valor,
    }));

    limpiarError(e.target.name);
  };

  const handleEsNacional = (valor) => {
    setFormulario((prev) => ({
      ...prev,
      esNacional: valor,
      nombre: "",
      primerApellido: "",
      segundoApellido: "",
      identificacion: valor === "si" ? normalizarCedulaCr(prev.identificacion) : prev.identificacion,
      pais: valor === "si" ? "Costa Rica" : prev.pais === "Costa Rica" ? "" : prev.pais,
    }));
    setAvisoCedula(null);
    setNombreAutocargado(false);
    limpiarError("esNacional");
    limpiarError("identificacion");

    if (valor === "si") {
      const digitos = normalizarCedulaCr(formulario.identificacion);
      if (digitos.length === 9) {
        consultarDatosCedula(digitos);
      }
    }
  };

  const handleIdentificacionBlur = async () => {
    const digitos = normalizarCedulaCr(formulario.identificacion);

    if (esNacionalCr && digitos !== formulario.identificacion) {
      setFormulario((prev) => ({
        ...prev,
        identificacion: digitos,
      }));
    }

    if (!esNacionalCr) return;

    if (digitos.length !== 9) {
      if (digitos.length > 0) {
        setAvisoCedula("La cédula costarricense debe tener 9 dígitos.");
      }
      return;
    }

    await consultarDatosCedula(digitos, { forzar: true });
  };

  const handleTipoVoluntariado = (tipo) => {
    setFormulario((prev) => ({
      ...prev,
      tipo,
      tipoOtro: tipo === "Otro" ? prev.tipoOtro : "",
    }));
    limpiarError("tipo");
    limpiarError("tipoOtro");
  };

  const handleModalidad = (modalidad) => {
    setFormulario((prev) => ({
      ...prev,
      modalidad,
      cantidadParticipantes: modalidad === "individual" ? "" : prev.cantidadParticipantes,
    }));

    if (modalidad === "individual") {
      setDocumentoGrupo(null);
      setErrores((prev) => {
        const next = { ...prev };
        delete next.cantidadParticipantes;
        delete next.documentoGrupo;
        return next;
      });
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formulario.esNacional) {
      nuevosErrores.esNacional = "Indique su nacionalidad";
    }

    const nombre = formulario.nombre?.trim();
    if (!nombre) nuevosErrores.nombre = "El nombre es obligatorio";
    else if (nombre.length < 2) nuevosErrores.nombre = "Mínimo 2 caracteres";

    const primerApellido = formulario.primerApellido?.trim();
    if (!primerApellido) nuevosErrores.primerApellido = "El primer apellido es obligatorio";

    const identificacion = formulario.identificacion?.trim();
    if (!identificacion) {
      nuevosErrores.identificacion = "La identificación es obligatoria";
    } else if (esNacionalCr) {
      const digitos = normalizarCedulaCr(identificacion);
      if (digitos.length !== 9) {
        nuevosErrores.identificacion = "La cédula costarricense debe tener 9 dígitos";
      }
    }

    if (!formulario.institucion?.trim()) {
      nuevosErrores.institucion = "Ingrese la institución educativa";
    }

    if (!formulario.pais?.trim()) {
      nuevosErrores.pais = "Ingrese el país de procedencia";
    }

    const correo = formulario.correo?.trim();
    if (!correo) nuevosErrores.correo = "El correo es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      nuevosErrores.correo = "Correo electrónico inválido";
    }

    const telefono = formulario.telefono?.trim();
    if (!telefono) nuevosErrores.telefono = "El teléfono es obligatorio";

    if (!formulario.tipo) {
      nuevosErrores.tipo = "Seleccione el tipo de voluntariado";
    } else if (esTipoOtro && !formulario.tipoOtro?.trim()) {
      nuevosErrores.tipoOtro = "Especifique el tipo de voluntariado";
    }

    if (!formulario.fechaVoluntariado) {
      nuevosErrores.fechaVoluntariado = "Seleccione una fecha disponible en el calendario";
    } else if (!fechasHabilitadasMap.has(formulario.fechaVoluntariado)) {
      nuevosErrores.fechaVoluntariado = "La fecha seleccionada no está habilitada para voluntariados";
    }

    if (!formulario.disponibilidad) {
      nuevosErrores.disponibilidad = "Seleccione su disponibilidad horaria (mañana, tarde o horario completo)";
    }

    if (esGrupal) {
      const cantidad = Number(formulario.cantidadParticipantes);
      if (!formulario.cantidadParticipantes || cantidad < 2) {
        nuevosErrores.cantidadParticipantes = "Ingrese la cantidad (mínimo 2)";
      } else if (cantidad > 100) {
        nuevosErrores.cantidadParticipantes = "Máximo 100 participantes";
      }

      if (!documentoGrupo) {
        nuevosErrores.documentoGrupo = "Debe subir un documento con los nombres de las personas del grupo";
      }
    }

    setErrores(nuevosErrores);
    return nuevosErrores;
  };

  const VOLUNTARIADO_FIELD_MAP = {
    tipo: "tipoVoluntariado",
    fechaVoluntariado: "fechaVoluntariado",
  };

  const resetFormulario = () => {
    setFormulario(crearFormularioInicial(usuario));
    setFechaSeleccionada(undefined);
    setDocumentoGrupo(null);
    setErrores({});
    setErrorApi(null);
    setAvisoCedula(null);
    setNombreAutocargado(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usuario) {
      sessionStorage.setItem("postLoginRedirect", VOLUNTARIADO_LOGIN_REDIRECT);
      setErrorApi("Debe iniciar sesión antes de enviar una solicitud de voluntariado.");
      queueFocusFormError({ root: e.currentTarget });
      return;
    }

    const nuevosErrores = validarFormulario();
    if (Object.keys(nuevosErrores).length > 0) {
      queueFocusFormError({
        errors: nuevosErrores,
        root: e.currentTarget,
        fieldMap: VOLUNTARIADO_FIELD_MAP,
        fieldOrder: [
          "esNacional",
          "identificacion",
          "nombre",
          "primerApellido",
          "institucion",
          "pais",
          "correo",
          "telefono",
          "cantidadParticipantes",
          "documentoGrupo",
          "fechaVoluntariado",
          "disponibilidad",
          "tipo",
          "tipoOtro",
        ],
      });
      return;
    }

    if (esNacionalCr && !formulario.nombre?.trim()) {
      setAvisoCedula("Ingrese su nombre o verifique la cédula.");
      queueFocusFormError({
        errors: { nombre: true, identificacion: true },
        root: e.currentTarget,
      });
      return;
    }

    const tipoFinal = esTipoOtro ? formulario.tipoOtro.trim() : formulario.tipo;

    // Crear FormData para enviar tanto campos de texto como el archivo adjunto
    const formData = new FormData();
    formData.append("nombre", formulario.nombre.trim());
    formData.append("primerApellido", formulario.primerApellido.trim());
    formData.append("segundoApellido", formulario.segundoApellido.trim());
    formData.append("email", formulario.correo.trim());
    formData.append("telefono", formulario.telefono.trim());
    formData.append("tipoVoluntariado", tipoFinal);
    formData.append(
      "identificacion",
      esNacionalCr
        ? normalizarCedulaCr(formulario.identificacion)
        : formulario.identificacion.trim()
    );
    formData.append("institucion", formulario.institucion.trim());
    formData.append("pais", formulario.pais.trim());
    formData.append("modalidad", formulario.modalidad);
    formData.append(
      "cantidadParticipantes",
      esGrupal ? String(formulario.cantidadParticipantes) : "1"
    );
    formData.append("residencia", "");
    formData.append("horario", formulario.disponibilidad);
    formData.append("dias", formulario.fechaVoluntariado);
    formData.append("area", tipoFinal);
    formData.append(
      "descripcion",
      `Fecha: ${formulario.fechaVoluntariado}. Disponibilidad: ${formulario.disponibilidad}.${
        esGrupal ? ` Cantidad de participantes: ${formulario.cantidadParticipantes}.` : ""
      }`
    );
    formData.append("motivacion", "");

    if (esGrupal && documentoGrupo) {
      formData.append("documento", documentoGrupo);
    }

    setEnviando(true);
    setErrorApi(null);

    try {
      await crearSolicitud(formData);
      window.dispatchEvent(new Event("voluntariado-updated"));
      resetFormulario();
      setEnviado(true);
    } catch (err) {
      console.error("Error al enviar solicitud:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Ocurrió un error al enviar la solicitud. Intente nuevamente.";
      setErrorApi(msg);
      queueFocusFormError({ root: e.currentTarget });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      {showLoading ? <PageLoading message={loadingMessage} /> : null}
      <main
        ref={pageRef}
        className={`voluntariado-page${showPrepaint ? " voluntariado-page--prepaint" : ""}`}
        inert={inert}
      >
        <BackToHomeLink homeSection={HOME_SCROLL_SECTIONS.voluntariado} />

        <section id="voluntariado" className="voluntariado-section">
          <div className="voluntariado-header">
            <h1>{tTitulo}</h1>
            <p>{tSub}</p>
          </div>

          {!enviado ? (
            <form
              onSubmit={handleSubmit}
              className="formulario-card"
              noValidate
              onFocusCapture={handleFormInteractionCapture}
              onPointerDownCapture={handleFormInteractionCapture}
            >
              {/* Selección de Modalidad */}
              <div className="campo full tipo-postulacion">
                <p className="campo-pregunta">
                  {tComo}<span className="req">*</span>
                </p>
                <div className="tipo-opciones">
                  <label className="radio-card">
                    <input
                      type="radio"
                      name="modalidad"
                      value="individual"
                      checked={formulario.modalidad === "individual"}
                      onChange={() => handleModalidad("individual")}
                    />
                    <span>{tIndividual}</span>
                  </label>
                  <label className="radio-card">
                    <input
                      type="radio"
                      name="modalidad"
                      value="grupal"
                      checked={formulario.modalidad === "grupal"}
                      onChange={() => handleModalidad("grupal")}
                    />
                    <span>{tGrupal}</span>
                  </label>
                </div>
              </div>

              <div className="form-secciones">
                {/* Información Personal (o del Responsable si es grupal) */}
                <SectionCard
                  icon={User}
                  title={esGrupal ? tInfoResponsable : tInfoPersonal}
                  hint={esGrupal ? tInfoResponsableHint : tInfoPersonalHint}
                >
                  <div className="campo full">
                    <p className="campo-pregunta">
                      {tNacional}<span className="req">*</span>
                    </p>
                    <div className="tipo-opciones">
                      <label className="radio-card">
                        <input
                          type="radio"
                          name="esNacional"
                          value="si"
                          checked={formulario.esNacional === "si"}
                          onChange={() => handleEsNacional("si")}
                        />
                        <span>{tSi}</span>
                      </label>
                      <label className="radio-card">
                        <input
                          type="radio"
                          name="esNacional"
                          value="no"
                          checked={formulario.esNacional === "no"}
                          onChange={() => handleEsNacional("no")}
                        />
                        <span>{tNo}</span>
                      </label>
                    </div>
                    {errores.esNacional && (
                      <span className="mensaje-error"><ST>{errores.esNacional}</ST></span>
                    )}
                  </div>

                  <div className="form-grid--4cols">
                    <div className="campo">
                      <label>
                        {esNacionalCr ? tCedula : tIdentificacion}{" "}
                        <span className="req">*</span>
                      </label>
                      {esNacionalCr ? (
                        <NumericInput
                          name="identificacion"
                          placeholder="9 dígitos"
                          value={formulario.identificacion}
                          onChange={handleChange}
                          onBlur={handleIdentificacionBlur}
                          maxLength={9}
                          autoComplete="off"
                          disabled={!formulario.esNacional}
                        />
                      ) : (
                        <input
                          type="text"
                          name="identificacion"
                          placeholder={tPasaporte}
                          value={formulario.identificacion}
                          onChange={handleChange}
                          maxLength={30}
                          autoComplete="off"
                          disabled={!formulario.esNacional}
                        />
                      )}
                    </div>

                    <div className="campo">
                      <label>
                        {tNombre} <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        placeholder={consultandoCedula ? "Consultando..." : tPhNombre}
                        value={formulario.nombre}
                        onChange={handleChange}
                        maxLength={80}
                        disabled={!formulario.esNacional}
                      />
                    </div>

                    <div className="campo">
                      <label>
                        {tPrimerApellido} <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        name="primerApellido"
                        placeholder={consultandoCedula ? "Consultando..." : tPh1}
                        value={formulario.primerApellido}
                        onChange={handleChange}
                        maxLength={80}
                        disabled={!formulario.esNacional}
                      />
                    </div>

                    <div className="campo">
                      <label>{tSegundoApellido}</label>
                      <input
                        type="text"
                        name="segundoApellido"
                        placeholder={consultandoCedula ? "Consultando..." : tPh2}
                        value={formulario.segundoApellido}
                        onChange={handleChange}
                        maxLength={80}
                        disabled={!formulario.esNacional}
                      />
                    </div>
                  </div>

                  {consultandoCedula && (
                    <span className="mensaje-info">Consultando datos de la cédula...</span>
                  )}
                  {!consultandoCedula && avisoCedula && (
                    <span className={esAvisoCedulaInformativo(avisoCedula) ? "mensaje-info" : "mensaje-error"}>
                      <ST>{avisoCedula}</ST>
                    </span>
                  )}
                  {(errores.identificacion || errores.nombre || errores.primerApellido) && (
                    <span className="mensaje-error">
                      <ST>{errores.identificacion || errores.nombre || errores.primerApellido}</ST>
                    </span>
                  )}

                  <div className="form-grid">
                    <div className="campo">
                      <label>
                        {tInstitucion}<span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        name="institucion"
                        placeholder={tPhInstitucion}
                        value={formulario.institucion}
                        onChange={handleChange}
                        maxLength={120}
                        disabled={!formulario.esNacional}
                      />
                      {errores.institucion && (
                        <span className="mensaje-error"><ST>{errores.institucion}</ST></span>
                      )}
                    </div>

                    <div className="campo">
                      <label>
                        {tPais}<span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        name="pais"
                        placeholder={tPhPais}
                        value={formulario.pais}
                        onChange={handleChange}
                        readOnly={esNacionalCr}
                        disabled={!formulario.esNacional}
                      />
                      {errores.pais && <span className="mensaje-error"><ST>{errores.pais}</ST></span>}
                    </div>
                  </div>
                </SectionCard>

                {/* Contacto */}
                <SectionCard icon={Mail} title={esGrupal ? tContactoResp : tContacto}>
                  <div className="form-grid">
                    <div className="campo">
                      <label>
                        {tCorreo}<span className="req">*</span>
                      </label>
                      <input
                        type="email"
                        name="correo"
                        placeholder="correo@ejemplo.com"
                        value={formulario.correo}
                        onChange={handleChange}
                      />
                      {errores.correo && <span className="mensaje-error"><ST>{errores.correo}</ST></span>}
                    </div>

                    <div className="campo">
                      <label>
                        {tTelefono}<span className="req">*</span>
                      </label>
                      <NumericInput
                        name="telefono"
                        placeholder="88888888"
                        maxLength={8}
                        value={formulario.telefono}
                        onChange={handleChange}
                      />
                      {errores.telefono && (
                        <span className="mensaje-error"><ST>{errores.telefono}</ST></span>
                      )}
                    </div>
                  </div>
                </SectionCard>

                {/* Información específica de Grupos */}
                {esGrupal && (
                  <SectionCard
                    icon={Users}
                    title={tInfoGrupo}
                    hint={tInfoGrupoHint}
                  >
                    <div className="form-grid">
                      <div className="campo">
                        <label>
                          {tCantParticipantes} <span className="req">*</span>
                        </label>
                        <NumericInput
                          name="cantidadParticipantes"
                          placeholder={tPhCantidad}
                          value={formulario.cantidadParticipantes}
                          onChange={handleChange}
                        />
                        {errores.cantidadParticipantes && (
                          <span className="mensaje-error"><ST>{errores.cantidadParticipantes}</ST></span>
                        )}
                      </div>
                    </div>

                    {/* Espacio para subir documento con nombres de integrantes */}
                    <div className="campo full mt-4">
                      <label>
                        {tDocIntegrantes} <span className="req">*</span>
                      </label>
                      <div className="documento-upload-wrapper">
                        {!documentoGrupo ? (
                          <label className="documento-upload-dropzone">
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                              onChange={handleDocumentoChange}
                            />
                            <div className="documento-upload-dropzone__icon">
                              <UploadCloud size={22} />
                            </div>
                            <span className="documento-upload-dropzone__texto">
                              <ST>Haga clic aquí para subir la lista de integrantes</ST>
                            </span>
                            <span className="documento-upload-dropzone__hint">
                              <ST>Archivos soportados: PDF, Word (.docx), Excel (.xlsx), CSV o texto (.txt) (máx. 10 MB)</ST>
                            </span>
                          </label>
                        ) : (
                          <div className="documento-preview-card">
                            <div className="documento-preview__info">
                              <FileText className="documento-preview__icon size-5" />
                              <div>
                                <p className="documento-preview__nombre">{documentoGrupo.name}</p>
                                <p className="documento-preview__tamano">
                                  {(documentoGrupo.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoverDocumento}
                              className="documento-preview__eliminar"
                              title="Eliminar archivo"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                        {errores.documentoGrupo && (
                          <span className="mensaje-error"><ST>{errores.documentoGrupo}</ST></span>
                        )}
                      </div>
                    </div>
                  </SectionCard>
                )}

                {/* Selección de Fecha con el Calendario shadcn UI */}
                <SectionCard
                  icon={CalendarCheck2}
                  title={tFechaVoluntariado}
                  hint={tFechaVoluntariadoHint}
                >
                  <div className="campo full flex flex-col items-center">
                    {fechaSeleccionada && (
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-900 bg-white px-5 py-2 shadow-xs">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          <ST>FECHA SELECCIONADA:</ST>
                        </span>
                        <span className="text-xs font-bold text-slate-950 capitalize">
                          {format(fechaSeleccionada, "EEEE, dd 'de' MMMM 'de' yyyy", { locale })}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-center my-1 w-full">
                      <Calendar
                        mode="single"
                        selected={fechaSeleccionada}
                        onSelect={handleSelectFecha}
                        disabled={isDateDisabled}
                        locale={locale}
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
                        <span><ST>Fecha disponible (Habilitada)</ST></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex size-5 items-center justify-center text-slate-400 opacity-40 text-[11px]">
                          15
                        </span>
                        <span><ST>Fecha no disponible (Bloqueada)</ST></span>
                      </div>
                    </div>

                    {fechasDisponibles.length === 0 && !cargandoFechas && (
                      <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200 text-center w-full mt-3">
                        <ST>Actualmente no hay fechas habilitadas para voluntariados. Por favor consulte más tarde.</ST>
                      </p>
                    )}

                    {errores.fechaVoluntariado && (
                      <span className="mensaje-error text-center block w-full mt-2">
                        <ST>{errores.fechaVoluntariado}</ST>
                      </span>
                    )}
                  </div>
                </SectionCard>

                {/* Disponibilidad: Opciones formales (Mañana, Tarde, Mixta) */}
                <SectionCard
                  icon={Clock}
                  title={tDisponibilidad}
                  hint={tDisponibilidadHint}
                >
                  <div className="campo full">
                    <div className="opciones-disponibilidad-grid">
                      {OPCIONES_DISPONIBILIDAD.map((opcion) => {
                        const esActiva = formulario.disponibilidad === opcion.valor;
                        return (
                          <label
                            key={opcion.id}
                            className={`opcion-disponibilidad-card ${esActiva ? "opcion-disponibilidad-card--activa" : ""}`}
                          >
                            <input
                              type="radio"
                              name="disponibilidad"
                              value={opcion.valor}
                              checked={esActiva}
                              onChange={() => handleDisponibilidad(opcion.valor)}
                            />
                            <div className="opcion-disponibilidad__header">
                              <span className="opcion-disponibilidad__titulo">
                                <ST>{opcion.titulo}</ST>
                              </span>
                              <span className="opcion-disponibilidad__radio-dot" />
                            </div>
                            <span className="opcion-disponibilidad__horario">
                              <Clock size={14} />
                              {opcion.horario}
                            </span>
                            {opcion.descripcion ? (
                              <span className="opcion-disponibilidad__desc">
                                <ST>{opcion.descripcion}</ST>
                              </span>
                            ) : null}
                          </label>
                        );
                      })}
                    </div>
                    {errores.disponibilidad && (
                      <span className="mensaje-error mt-2 block">
                        <ST>{errores.disponibilidad}</ST>
                      </span>
                    )}
                  </div>
                </SectionCard>

                {/* Tipo de voluntariado */}
                <SectionCard
                  icon={Sprout}
                  title={tTipoVol}
                  hint={tTipoHint}
                >
                  <div className="opciones-radio-lista">
                    {TIPOS_VOLUNTARIADO.map((tipo) => (
                      <label
                        key={tipo}
                        className={`opcion-radio${formulario.tipo === tipo ? " opcion-radio--activa" : ""}`}
                      >
                        <input
                          type="radio"
                          name="tipoVoluntariado"
                          value={tipo}
                          checked={formulario.tipo === tipo}
                          onChange={() => handleTipoVoluntariado(tipo)}
                        />
                        <span className="opcion-radio__indicador" />
                        <span><ST>{tipo}</ST></span>
                      </label>
                    ))}
                  </div>

                  {esTipoOtro && (
                    <div className="campo tipo-otro">
                      <input
                        type="text"
                        name="tipoOtro"
                        placeholder="Describa el tipo de voluntariado"
                        value={formulario.tipoOtro}
                        onChange={handleChange}
                      />
                      {errores.tipoOtro && (
                        <span className="mensaje-error"><ST>{errores.tipoOtro}</ST></span>
                      )}
                    </div>
                  )}

                  {errores.tipo && <span className="mensaje-error"><ST>{errores.tipo}</ST></span>}
                </SectionCard>
              </div>

              {errorApi && <p className="form-error" role="alert" data-form-error><ST>{errorApi}</ST></p>}

              {!usuario ? (
                <div className="auth-banner">
                  <Lock size={20} strokeWidth={2} className="auth-banner__icon" />
                  <div className="auth-banner__content">
                    <p className="auth-banner__text">
                      {tLoginMsg}
                    </p>
                    <Link
                      to="/login"
                      className="auth-banner__link"
                      onClick={() =>
                        sessionStorage.setItem("postLoginRedirect", VOLUNTARIADO_LOGIN_REDIRECT)
                      }
                    >
                      {tLoginLink}
                    </Link>
                  </div>
                </div>
              ) : null}

              <div className="acciones-formulario">
                <button
                  type="submit"
                  className="btn-enviar"
                  disabled={enviando || !usuario}
                >
                  {enviando ? tEnviando : !usuario ? tLoginBtn : tEnviar}
                </button>
              </div>
            </form>
          ) : (
            <div className="confirmacion">
              <div className="confirmacion__icono">
                <Check size={28} strokeWidth={2.2} aria-hidden="true" />
              </div>
              <h2><ST>Solicitud enviada correctamente</ST></h2>
              <p>
                <ST>Tu solicitud de voluntariado fue recibida y está siendo revisada por el equipo de Café UNA. Recibirás información en tu correo electrónico.</ST>
              </p>
              <button type="button" className="btn-enviar" onClick={() => setEnviado(false)}>
                <ST>Realizar otra solicitud</ST>
              </button>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default SolicitarVoluntariado;