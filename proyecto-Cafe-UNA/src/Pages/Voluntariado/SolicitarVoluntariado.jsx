import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CalendarCheck2,
  CalendarDays,
  CalendarX2,
  Check,
  Clock,
  FileText,
  Lock,
  Mail,
  Sprout,
  Trash2,
  UploadCloud,
  User,
  Users,
} from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import BackToHomeLink from "../../Components/BackToHomeLink/BackToHomeLink";
import { NumericInput } from "../../Components/NumericInput/NumericInput";
import { HOME_SCROLL_SECTIONS } from "../../lib/homeScrollTarget";
import PageLoading from "../../Components/PageLoading/PageLoading";
import { usePaintPublicPage } from "../../hooks/usePaintPublicPage";
import { getActiveSessionUser } from "../../services/sessionService";
import { crearSolicitud } from "../../services/voluntariadoService";
import { consultarCedulaDetallada } from "../../services/cedulaService";
import {
  obtenerFechasDisponibles,
  obtenerResumenTipos,
} from "../../services/voluntariadoFechasService";
import {
  HORARIOS_PREDETERMINADOS,
  TIPOS_VOLUNTARIADO,
} from "../../lib/voluntariadoCatalogo";
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

function getCantidadFechas(resumen, tipo, fechasActivas = []) {
  if (!tipo) return 0;
  if (Array.isArray(fechasActivas) && fechasActivas.length > 0) {
    return fechasActivas.length;
  }
  const t = String(tipo).trim();
  const direct = resumen?.[t];
  if (typeof direct === "number") return direct;
  const lower = resumen?.[t.toLowerCase()];
  if (typeof lower === "number") return lower;
  if (t.toLowerCase() === "apoyo general") {
    const gen = resumen?.["General"] ?? resumen?.["general"];
    if (typeof gen === "number") return gen;
  }
  return 0;
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

  const tNacional = useTraducir("¿Es costarricense?");
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

  const tPaso1 = useTraducir("1. Tipo de voluntariado");
  const tPaso1Hint = useTraducir("Seleccione el área o modalidad de voluntariado en la que desea participar");

  const tPaso2 = useTraducir("2. Fechas disponibles");
  const tPaso2Hint = useTraducir("Seleccione una de las fechas habilitadas en el calendario para este voluntariado");

  const tPaso3 = useTraducir("3. Horario disponible");
  const tPaso3Hint = useTraducir("Seleccione el horario o turno configurado para la fecha elegida");

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

  const [resumenTipos, setResumenTipos] = useState({});
  const [fechasDisponibles, setFechasDisponibles] = useState([]);
  const [cargandoFechas, setCargandoFechas] = useState(false);
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

  // Cargar resumen de disponibilidad de tipos
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const resumen = await obtenerResumenTipos();
        if (!cancelado) {
          setResumenTipos(resumen || {});
        }
      } catch (err) {
        console.warn("No se pudo cargar el resumen de tipos:", err);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  // Mapeo de fechas habilitadas para el tipo seleccionado (YYYY-MM-DD -> registro)
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

  // Fechas habilitadas para el modifier del Calendar
  const fechasHabilitadasDates = useMemo(() => {
    const list = [];
    for (const [iso] of fechasHabilitadasMap) {
      const [y, m, d] = iso.split("-").map(Number);
      if (y && m && d) list.push(new Date(y, m - 1, d));
    }
    return list;
  }, [fechasHabilitadasMap]);

  // Registro de la fecha seleccionada actual
  const registroFechaSeleccionada = useMemo(() => {
    if (!formulario.fechaVoluntariado) return null;
    return (
      fechasDisponibles.find(
        (f) => String(f.Fecha || f.fecha || "").slice(0, 10) === formulario.fechaVoluntariado
      ) || null
    );
  }, [fechasDisponibles, formulario.fechaVoluntariado]);

  // Horarios configurados para la fecha seleccionada
  const horariosDisponiblesParaFecha = useMemo(() => {
    if (!registroFechaSeleccionada) return [];
    const h = registroFechaSeleccionada.Horarios ?? registroFechaSeleccionada.horarios;
    if (Array.isArray(h) && h.length > 0) {
      return h;
    }
    return HORARIOS_PREDETERMINADOS;
  }, [registroFechaSeleccionada]);

  // Función para deshabilitar días en el calendario
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

  // Selección del tipo de voluntariado (Paso 1)
  const handleTipoVoluntariado = async (tipo) => {
    setFormulario((prev) => ({
      ...prev,
      tipo,
      tipoOtro: tipo === "Otro" ? prev.tipoOtro : "",
      fechaVoluntariado: "",
      disponibilidad: "",
    }));
    setFechaSeleccionada(undefined);
    limpiarError("tipo");
    limpiarError("tipoOtro");
    limpiarError("fechaVoluntariado");
    limpiarError("disponibilidad");

    setCargandoFechas(true);
    try {
      const data = await obtenerFechasDisponibles(tipo);
      setFechasDisponibles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Error al cargar fechas para el tipo de voluntariado:", err);
      setFechasDisponibles([]);
    } finally {
      setCargandoFechas(false);
    }
  };

  // Selección de Fecha (Paso 2)
  const handleSelectFecha = (date) => {
    setFechaSeleccionada(date);
    const isoStr = date ? format(date, "yyyy-MM-dd") : "";
    setFormulario((prev) => ({
      ...prev,
      fechaVoluntariado: isoStr,
      disponibilidad: "", // Reiniciar horario para forzar selección acorde al nuevo día
    }));
    limpiarError("fechaVoluntariado");
    limpiarError("disponibilidad");
  };

  // Selección de Horario (Paso 3)
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

    // Validar Tipo de Voluntariado (Paso 1)
    if (!formulario.tipo) {
      nuevosErrores.tipo = "Seleccione el tipo de voluntariado";
    } else if (esTipoOtro && !formulario.tipoOtro?.trim()) {
      nuevosErrores.tipoOtro = "Especifique el tipo de voluntariado";
    } else if (fechasDisponibles.length === 0 && !cargandoFechas) {
      nuevosErrores.tipo = "El tipo de voluntariado seleccionado no tiene fechas disponibles para postular";
    }

    // Validar Fecha (Paso 2)
    if (!formulario.fechaVoluntariado) {
      nuevosErrores.fechaVoluntariado = "Seleccione una fecha disponible en el calendario";
    } else if (!fechasHabilitadasMap.has(formulario.fechaVoluntariado)) {
      nuevosErrores.fechaVoluntariado = "La fecha seleccionada no está habilitada para este tipo de voluntariado";
    }

    // Validar Horario (Paso 3)
    if (!formulario.disponibilidad) {
      nuevosErrores.disponibilidad = "Seleccione un horario disponible para la fecha seleccionada";
    }

    if (esGrupal) {
      const cantidad = Number(formulario.cantidadParticipantes);
      if (!formulario.cantidadParticipantes || cantidad < 2) {
        nuevosErrores.cantidadParticipantes = "Ingrese la cantidad (mínimo 2)";
      } else if (cantidad > 50) {
        nuevosErrores.cantidadParticipantes = "Máximo 50 participantes";
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
    setFechasDisponibles([]);
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
          "tipo",
          "tipoOtro",
          "fechaVoluntariado",
          "disponibilidad",
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
      `Tipo: ${tipoFinal}. Fecha: ${formulario.fechaVoluntariado}. Horario: ${formulario.disponibilidad}.${
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

  const tipoSeleccionadoTieneFechas =
    formulario.tipo &&
    getCantidadFechas(resumenTipos, formulario.tipo, fechasDisponibles) > 0;

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

                <SectionCard
                  icon={Sprout}
                  title={tPaso1}
                  hint={tPaso1Hint}
                >
                  <div className="opciones-radio-lista">
                    {TIPOS_VOLUNTARIADO.map((tipo) => {
                      const count = getCantidadFechas(
                        resumenTipos,
                        tipo,
                        formulario.tipo === tipo ? fechasDisponibles : []
                      );
                      const tieneFechas = count > 0;
                      const esSeleccionado = formulario.tipo === tipo;

                      return (
                        <label
                          key={tipo}
                          className={`opcion-radio ${
                            esSeleccionado ? "opcion-radio--activa" : ""
                          } ${!tieneFechas ? "opcion-radio--sin-fechas" : ""}`}
                        >
                          <input
                            type="radio"
                            name="tipoVoluntariado"
                            value={tipo}
                            checked={esSeleccionado}
                            onChange={() => handleTipoVoluntariado(tipo)}
                          />
                          <span className="opcion-radio__indicador" />
                          <div className="opcion-radio__meta">
                            <span className="font-semibold text-slate-900">
                              <ST>{tipo}</ST>
                            </span>
                            {tieneFechas ? (
                              <span className="opcion-radio__badge-disponible">
                                <CalendarDays className="size-3" />
                                <span>{count} {count === 1 ? "fecha disponible" : "fechas disponibles"}</span>
                              </span>
                            ) : (
                              <span className="opcion-radio__badge-nodisponible">
                                <CalendarX2 className="size-3" />
                                <span><ST>Sin fechas disponibles</ST></span>
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {esTipoOtro && (
                    <div className="campo tipo-otro mt-3">
                      <input
                        type="text"
                        name="tipoOtro"
                        placeholder="Describa el tipo de voluntariado en el que desea participar"
                        value={formulario.tipoOtro}
                        onChange={handleChange}
                      />
                      {errores.tipoOtro && (
                        <span className="mensaje-error"><ST>{errores.tipoOtro}</ST></span>
                      )}
                    </div>
                  )}

                  {formulario.tipo && !tipoSeleccionadoTieneFechas && !cargandoFechas && (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 flex items-start gap-2">
                      <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">
                          <ST>No hay fechas habilitadas para este tipo de voluntariado actualmente.</ST>
                        </p>
                        <p className="mt-0.5 text-amber-700">
                          <ST>Por favor seleccione otra modalidad con fechas disponibles o consulte más adelante.</ST>
                        </p>
                      </div>
                    </div>
                  )}

                  {errores.tipo && <span className="mensaje-error mt-2 block"><ST>{errores.tipo}</ST></span>}
                </SectionCard>

                <SectionCard
                  icon={CalendarCheck2}
                  title={tPaso2}
                  hint={tPaso2Hint}
                >
                  {!formulario.tipo ? (
                    <div className="voluntariado-aviso-bloque">
                      <Sprout className="voluntariado-aviso-bloque__icono size-8" />
                      <p className="voluntariado-aviso-bloque__titulo">
                        <ST>Seleccione primero el tipo de voluntariado</ST>
                      </p>
                      <p className="voluntariado-aviso-bloque__texto">
                        <ST>El calendario se habilitará automáticamente presentando única y exclusivamente las fechas disponibles configuradas para la modalidad seleccionada.</ST>
                      </p>
                    </div>
                  ) : cargandoFechas ? (
                    <div className="voluntariado-aviso-bloque">
                      <div className="size-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-2" />
                      <p className="voluntariado-aviso-bloque__texto">
                        <ST>Consultando fechas disponibles para {formulario.tipo}...</ST>
                      </p>
                    </div>
                  ) : !tipoSeleccionadoTieneFechas ? (
                    <div className="voluntariado-aviso-bloque">
                      <CalendarX2 className="voluntariado-aviso-bloque__icono size-8 text-amber-500" />
                      <p className="voluntariado-aviso-bloque__titulo text-amber-900">
                        <ST>Sin fechas configuradas</ST>
                      </p>
                      <p className="voluntariado-aviso-bloque__texto text-amber-700">
                        <ST>Actualmente no hay fechas disponibles para "{formulario.tipo}". No es posible seleccionar fechas ni enviar solicitudes para esta opción.</ST>
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
                          <span><ST>Fecha disponible para {formulario.tipo}</ST></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex size-5 items-center justify-center text-slate-400 opacity-40 text-[11px]">
                            15
                          </span>
                          <span><ST>Fecha no disponible</ST></span>
                        </div>
                      </div>

                      {errores.fechaVoluntariado && (
                        <span className="mensaje-error text-center block w-full mt-2">
                          <ST>{errores.fechaVoluntariado}</ST>
                        </span>
                      )}
                    </div>
                  )}
                </SectionCard>

                <SectionCard
                  icon={Clock}
                  title={tPaso3}
                  hint={tPaso3Hint}
                >
                  {!formulario.tipo ? (
                    <div className="voluntariado-aviso-bloque">
                      <Clock className="voluntariado-aviso-bloque__icono size-8" />
                      <p className="voluntariado-aviso-bloque__titulo">
                        <ST>Paso pendiente: Seleccione tipo de voluntariado</ST>
                      </p>
                      <p className="voluntariado-aviso-bloque__texto">
                        <ST>Debe completar los pasos anteriores para visualizar los horarios.</ST>
                      </p>
                    </div>
                  ) : !formulario.fechaVoluntariado ? (
                    <div className="voluntariado-aviso-bloque">
                      <CalendarDays className="voluntariado-aviso-bloque__icono size-8" />
                      <p className="voluntariado-aviso-bloque__titulo">
                        <ST>Seleccione una fecha en el calendario</ST>
                      </p>
                      <p className="voluntariado-aviso-bloque__texto">
                        <ST>Al seleccionar un día habilitado, se cargarán exclusivamente los horarios o turnos disponibles para esa fecha.</ST>
                      </p>
                    </div>
                  ) : (
                    <div className="campo full">
                      <p className="text-xs font-semibold text-slate-700 mb-3">
                        <ST>Horarios disponibles para el día</ST>{" "}
                        <strong>
                          {fechaSeleccionada ? format(fechaSeleccionada, "dd 'de' MMMM", { locale }) : formulario.fechaVoluntariado}
                        </strong>:
                      </p>

                      <div className="opciones-disponibilidad-grid">
                        {horariosDisponiblesParaFecha.map((horarioStr) => {
                          const esActivo = formulario.disponibilidad === horarioStr;
                          return (
                            <label
                              key={horarioStr}
                              className={`opcion-disponibilidad-card ${
                                esActivo ? "opcion-disponibilidad-card--activa" : ""
                              }`}
                            >
                              <input
                                type="radio"
                                name="disponibilidad"
                                value={horarioStr}
                                checked={esActivo}
                                onChange={() => handleDisponibilidad(horarioStr)}
                              />
                              <div className="opcion-disponibilidad__header">
                                <span className="opcion-disponibilidad__titulo">
                                  {horarioStr}
                                </span>
                                <span className="opcion-disponibilidad__radio-dot" />
                              </div>
                              <span className="opcion-disponibilidad__horario">
                                <Clock size={14} />
                                {horarioStr}
                              </span>
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
                  )}
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
                  disabled={enviando || !usuario || (!tipoSeleccionadoTieneFechas && Boolean(formulario.tipo))}
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