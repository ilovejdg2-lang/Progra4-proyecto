import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FileText, Trash2, UploadCloud } from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import BackToHomeLink from "../../Components/BackToHomeLink/BackToHomeLink";
import AvisoSedeFinca from "../../Components/AvisoSedeFinca/AvisoSedeFinca";
import { NumericInput } from "../../Components/NumericInput/NumericInput";
import { PublicPageHeader } from "../../Components/Public/PublicPageHeader";
import {
  CalendarPicker,
  ChoiceCard,
  ChoiceGroup,
  CupoTexto,
  Field,
  FieldError,
  FormAlert,
  FormGrid,
  FormNote,
  FormPlaceholder,
  FormSection,
  FormSuccess,
  SubmitFooter,
} from "../../Components/Public/PublicForm";
import { HOME_SCROLL_SECTIONS, navigateToHomeSection } from "../../lib/homeScrollTarget";
import PageLoading from "../../Components/PageLoading/PageLoading";
import { usePaintPublicPage } from "../../hooks/usePaintPublicPage";
import { sedeDesdeHomeLocation } from "../../lib/sedeFinca";
import { getActiveSessionUser } from "../../services/sessionService";
import { obtenerSeccion } from "../../services/informacionService";
import { crearSolicitud } from "../../services/voluntariadoService";
import { consultarCedulaDetallada } from "../../services/cedulaService";
import {
  obtenerConfigFechas,
  obtenerFechasDisponibles,
  obtenerHoyIso,
  obtenerResumenTipos,
  ZONA_HORARIA_PREDETERMINADA,
} from "../../services/voluntariadoFechasService";
import {
  HORARIOS_PREDETERMINADOS,
  TIPOS_VOLUNTARIADO,
} from "../../lib/voluntariadoCatalogo";
import { queueFocusFormError } from "../../lib/formFocus";
import { filtrarEnteros } from "../../lib/numericInput";
import { esCorreoValido, limpiarCorreo, MENSAJE_CORREO_INVALIDO } from "../../lib/correo";
import {
  limitarPalabras,
  MAX_PALABRAS_TITULO,
} from "../../lib/formLimits";
import { useTraducir } from "../../hooks/useTraducir";
import { useIdioma } from "../../lib/useIdioma";
import { obtenerOpcionesPaises } from "../../lib/paises";
import {
  digitosConsultables,
  esperaConsultaIdentificacion,
  LIMITE_IDENTIFICACION,
  limpiarIdentificacion,
  placeholderIdentificacion,
  validarIdentificacion,
} from "../../lib/identificacionPersona";
import { ST } from "../../Components/T/ST";
import { SelectFiltro } from "../../Components/ui/SelectFiltro";

const FORM_INICIAL = {
  modalidad: "individual",
  cantidadParticipantes: "",
  tipo: "",
  tipoOtro: "",
  tipoDocumento: "cedula",
  nacionalidad: "",
  nombre: "",
  primerApellido: "",
  segundoApellido: "",
  identificacion: "",
  institucion: "",
  pais: "Costa Rica",
  correo: "",
  telefono: "",
  fechaVoluntariado: "",
  disponibilidad: "",
};

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

const VOLUNTARIADO_LOGIN_REDIRECT = "/voluntariado";

function SolicitarVoluntariado() {
  const navigate = useNavigate();
  const { idioma } = useIdioma();
  const locale = idioma === "en" ? enUS : es;

  const tTitulo = useTraducir("Sumate a nuestras iniciativas");
  const tSub = useTraducir(
    "Elegí cómo querés participar, las fechas que te sirven y te confirmamos por correo.",
  );
  const tTipoOtro = useTraducir("Otro tipo de voluntariado");
  const tCedula = useTraducir("Cédula");
  const tDimex = useTraducir("DIMEX");
  const tPasaporte = useTraducir("Pasaporte");
  const tElegiPais = useTraducir("Elegí el país");
  const tPhNombre = useTraducir("Nombre");
  const tPh1 = useTraducir("1° Apellido");
  const tPh2 = useTraducir("2° Apellido");
  const tPhInstitucion = useTraducir("Ej. Universidad Nacional");
  const tPhPais = useTraducir("Ej. Costa Rica");
  const tPhCantidad = useTraducir("Ej. 15");
  const tPhOtro = useTraducir("Contanos en qué tipo de voluntariado querés participar");
  const tConsultando = useTraducir("Consultando...");
  const tEnviar = useTraducir("Enviar solicitud");
  const tEnviando = useTraducir("Enviando...");
  const tLoginBtn = useTraducir("Iniciá sesión para enviar");
  const tQuitar = useTraducir("Quitar archivo");

  const [usuario] = useState(() => obtenerUsuarioActual());
  const [formulario, setFormulario] = useState(() => crearFormularioInicial(obtenerUsuarioActual()));

  const [zonaHoraria, setZonaHoraria] = useState(ZONA_HORARIA_PREDETERMINADA);
  const hoyIso = useMemo(() => obtenerHoyIso(zonaHoraria), [zonaHoraria]);

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
  const [sedeFinca, setSedeFinca] = useState(() => sedeDesdeHomeLocation(null));

  const {
    ref: pageRef,
    showLoading,
    showPrepaint,
    inert,
    loadingMessage,
  } = usePaintPublicPage("voluntariado");

  const esGrupal = formulario.modalidad === "grupal";
  const esTipoOtro = formulario.tipo === "Otro";
  const tipoDocumento = formulario.tipoDocumento;
  const tPhIdentificacion = useTraducir(placeholderIdentificacion(tipoDocumento));
  const esPasaporte = tipoDocumento === "pasaporte";
  const etiquetaDocumento = tipoDocumento === "dimex" ? tDimex : esPasaporte ? tPasaporte : tCedula;
  const opcionesPais = useMemo(() => obtenerOpcionesPaises(idioma), [idioma]);
  const consultaCedulaRef = useRef({ digitos: "", enCurso: false });

  // Cargar configuración de zona horaria del servidor
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const config = await obtenerConfigFechas();
        if (!cancelado && config?.zonaHoraria) {
          setZonaHoraria(config.zonaHoraria);
        }
      } catch (err) {
        console.warn("No se pudo cargar la configuración de fechas:", err);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

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
      const iso = format(date, "yyyy-MM-dd");
      if (iso < hoyIso) return true;
      return !fechasHabilitadasMap.has(iso);
    },
    [fechasHabilitadasMap, hoyIso]
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
    if (!digitosConsultables(tipoDocumento, digitos)) return;
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
        setFormulario((prev) => ({
          ...prev,
          nombre: "",
          primerApellido: "",
          segundoApellido: "",
        }));
        setAvisoCedula("No se encontraron datos para esta identificación. Completá los datos manualmente.");
        return;
      }

      consultaCedulaRef.current = { digitos, enCurso: false };
      setFormulario((prev) => ({
        ...prev,
        identificacion: digitos,
        nombre,
        primerApellido,
        segundoApellido,
      }));
      setAvisoCedula("Datos cargados automáticamente. Podés editarlos si hace falta.");
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
      setFormulario((prev) => ({
        ...prev,
        nombre: "",
        primerApellido: "",
        segundoApellido: "",
      }));
      const mensajeBase = error?.message?.trim() || "No se pudo consultar la identificación.";
      const yaIndicaManual = /manualmente|completar el nombre/i.test(mensajeBase);
      const esConexion = error?.cause?.code === "ERR_NETWORK" || /conectar con el servidor/i.test(mensajeBase);
      setAvisoCedula(
        yaIndicaManual
          ? mensajeBase
          : esConexion
          ? `${mensajeBase} Mientras tanto, completá los datos manualmente.`
          : `${mensajeBase} Completá los datos manualmente.`
      );
    } finally {
      setConsultandoCedula(false);
    }
  }, [tipoDocumento]);

  useEffect(() => {
    const digitos = digitosConsultables(tipoDocumento, formulario.identificacion);
    if (!digitos) return;
    if (consultaCedulaRef.current.enCurso) return;
    if (consultaCedulaRef.current.digitos === digitos) return;

    const timeoutId = window.setTimeout(() => {
      consultarDatosCedula(digitos);
    }, esperaConsultaIdentificacion(tipoDocumento));

    return () => window.clearTimeout(timeoutId);
  }, [formulario.identificacion, tipoDocumento, consultarDatosCedula]);

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
    e.target.value = "";
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrores((prev) => ({
        ...prev,
        documentoGrupo: "El archivo pesa más de 10 MB",
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
      valor = limpiarCorreo(valor).toLowerCase();
    }

    if (name === "telefono") {
      valor = filtrarEnteros(valor).slice(0, 8);
    }

    if (name === "identificacion") {
      valor = limpiarIdentificacion(tipoDocumento, valor);
      if (!esPasaporte) {
        consultaCedulaRef.current = { digitos: "", enCurso: false };
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

  const handleTipoDocumento = (event) => {
    const valor = event.target.value;
    consultaCedulaRef.current = { digitos: "", enCurso: false };
    setFormulario((prev) => ({
      ...prev,
      tipoDocumento: valor,
      nacionalidad: valor === "pasaporte" ? prev.nacionalidad : "",
      identificacion: "",
      nombre: "",
      primerApellido: "",
      segundoApellido: "",
      pais: valor === "pasaporte" ? (prev.pais === "Costa Rica" ? "" : prev.pais) : "Costa Rica",
    }));
    setAvisoCedula(null);
    limpiarError("identificacion");
    limpiarError("nacionalidad");
    limpiarError("pais");
  };

  const handleIdentificacionBlur = async () => {
    if (esPasaporte || !formulario.identificacion) return;
    const digitos = digitosConsultables(tipoDocumento, formulario.identificacion);
    if (!digitos) {
      setAvisoCedula(validarIdentificacion(tipoDocumento, formulario.identificacion));
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

    const nombre = formulario.nombre?.trim();
    if (!nombre) nuevosErrores.nombre = "Ingresá el nombre";
    else if (nombre.length < 2) nuevosErrores.nombre = "Escribí al menos 2 caracteres";

    const primerApellido = formulario.primerApellido?.trim();
    if (!primerApellido) nuevosErrores.primerApellido = "Ingresá el primer apellido";

    const errorIdentificacion = validarIdentificacion(tipoDocumento, formulario.identificacion);
    if (errorIdentificacion) nuevosErrores.identificacion = errorIdentificacion;
    if (esPasaporte && !formulario.nacionalidad) {
      nuevosErrores.nacionalidad = "Elegí el país de origen del pasaporte.";
    }

    if (!formulario.institucion?.trim()) {
      nuevosErrores.institucion = "Ingresá la institución educativa";
    }

    if (!formulario.pais?.trim()) {
      nuevosErrores.pais = "Ingresá el país de residencia";
    }

    const correo = formulario.correo?.trim();
    if (!correo) nuevosErrores.correo = "Ingresá el correo electrónico";
    else if (!esCorreoValido(correo)) {
      nuevosErrores.correo = MENSAJE_CORREO_INVALIDO;
    }

    const telefono = formulario.telefono?.trim();
    if (!telefono) nuevosErrores.telefono = "Ingresá el teléfono";

    // Validar Tipo de Voluntariado (Paso 1)
    if (!formulario.tipo) {
      nuevosErrores.tipo = "Elegí el tipo de voluntariado";
    } else if (esTipoOtro && !formulario.tipoOtro?.trim()) {
      nuevosErrores.tipoOtro = "Contanos cuál es el tipo de voluntariado";
    } else if (fechasDisponibles.length === 0 && !cargandoFechas) {
      nuevosErrores.tipo = "El tipo de voluntariado que elegiste no tiene fechas disponibles";
    }

    // Validar Fecha (Paso 2)
    if (!formulario.fechaVoluntariado) {
      nuevosErrores.fechaVoluntariado = "Elegí una fecha disponible en el calendario";
    } else if (formulario.fechaVoluntariado < hoyIso) {
      nuevosErrores.fechaVoluntariado = "No se permiten fechas pasadas. Elegí una fecha vigente.";
    } else if (!fechasHabilitadasMap.has(formulario.fechaVoluntariado)) {
      nuevosErrores.fechaVoluntariado = "La fecha que elegiste no está habilitada para este tipo de voluntariado";
    }

    // Validar Horario (Paso 3)
    if (!formulario.disponibilidad) {
      nuevosErrores.disponibilidad = "Elegí un horario disponible para la fecha elegida";
    }

    if (esGrupal) {
      const cantidad = Number(formulario.cantidadParticipantes);
      if (!formulario.cantidadParticipantes || cantidad < 2) {
        nuevosErrores.cantidadParticipantes = "Ingresá la cantidad (mínimo 2)";
      } else if (cantidad > 50) {
        nuevosErrores.cantidadParticipantes = "Máximo 50 participantes";
      }

      if (!documentoGrupo) {
        nuevosErrores.documentoGrupo = "Subí un documento con los nombres de las personas del grupo";
      }
    }

    setErrores(nuevosErrores);
    return nuevosErrores;
  };

  const VOLUNTARIADO_FIELD_MAP = {
    tipo: "tipoVoluntariado",
  };

  const resetFormulario = () => {
    setFormulario(crearFormularioInicial(usuario));
    setFechaSeleccionada(undefined);
    setFechasDisponibles([]);
    setDocumentoGrupo(null);
    setErrores({});
    setErrorApi(null);
    setAvisoCedula(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    if (!usuario) {
      sessionStorage.setItem("postLoginRedirect", VOLUNTARIADO_LOGIN_REDIRECT);
      setErrorApi("Tenés que iniciar sesión antes de enviar una solicitud de voluntariado.");
      queueFocusFormError({ root: formEl });
      return;
    }

    const nuevosErrores = validarFormulario();
    if (Object.keys(nuevosErrores).length > 0) {
      queueFocusFormError({
        errors: nuevosErrores,
        root: formEl,
        fieldMap: VOLUNTARIADO_FIELD_MAP,
        idPrefix: "voluntariado-",
        fieldOrder: [
          "identificacion",
          "nacionalidad",
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

    if (!esPasaporte && !formulario.nombre?.trim()) {
      setAvisoCedula("Ingresá tu nombre o verificá la identificación.");
      queueFocusFormError({
        errors: { nombre: true, identificacion: true },
        root: formEl,
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
    formData.append("identificacion", formulario.identificacion.trim());
    formData.append("tipoIdentificacion", tipoDocumento);
    if (esPasaporte) formData.append("nacionalidad", formulario.nacionalidad);
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
        "Ocurrió un error al enviar la solicitud. Intentá de nuevo.";
      setErrorApi(msg);
      queueFocusFormError({ root: formEl });
    } finally {
      setEnviando(false);
    }
  };

  const tipoSeleccionadoTieneFechas =
    formulario.tipo &&
    getCantidadFechas(resumenTipos, formulario.tipo, fechasDisponibles) > 0;

  const placeholderCarga = (valor) => (consultandoCedula ? tConsultando : valor);

  return (
    <>
      {showLoading ? <PageLoading message={loadingMessage} /> : null}
      <main
        ref={pageRef}
        className={`pub-page pub-form-page${showPrepaint ? " pub-form-page--prepaint" : ""}`}
        inert={inert}
      >
        <div className="pub-form-container">
          <div className="pub-form-back">
            <BackToHomeLink homeSection={HOME_SCROLL_SECTIONS.iniciativas} />
          </div>

          <PublicPageHeader title={tTitulo} lead={tSub} titleId="voluntariado-titulo" />

          {!enviado ? (
            <form
              onSubmit={handleSubmit}
              className="pub-panel pub-form"
              noValidate
              aria-labelledby="voluntariado-titulo"
              onFocusCapture={handleFormInteractionCapture}
              onPointerDownCapture={handleFormInteractionCapture}
            >
              <FormSection title="¿Cómo querés participar?">
                <ChoiceGroup label="Modalidad de participación" required columns={2}>
                  <ChoiceCard
                    name="modalidad"
                    value="individual"
                    checked={formulario.modalidad === "individual"}
                    onChange={() => handleModalidad("individual")}
                    title="Individual"
                    description="Participás por tu cuenta."
                  />
                  <ChoiceCard
                    name="modalidad"
                    value="grupal"
                    checked={formulario.modalidad === "grupal"}
                    onChange={() => handleModalidad("grupal")}
                    title="Grupal"
                    description="Venís con un grupo y subís la lista de integrantes."
                  />
                </ChoiceGroup>
              </FormSection>

              <FormSection
                title={esGrupal ? "Datos del responsable del grupo" : "Tus datos"}
                hint={
                  esGrupal
                    ? "La persona que coordina al grupo y recibe nuestras respuestas."
                    : "Los usamos para contactarte y confirmar tu solicitud."
                }
              >
                <FormGrid>
                  <Field id="voluntariado-tipo-documento" label="Tipo de identificación" required>
                    {(c) => (
                      <SelectFiltro {...c} name="tipoDocumento" value={tipoDocumento} onChange={handleTipoDocumento}>
                        <option value="cedula">{tCedula}</option>
                        <option value="dimex">{tDimex}</option>
                        <option value="pasaporte">{tPasaporte}</option>
                      </SelectFiltro>
                    )}
                  </Field>

                  {esPasaporte ? (
                    <Field
                      id="voluntariado-nacionalidad"
                      label="País de origen"
                      required
                      error={errores.nacionalidad}
                    >
                      {(c) => (
                        <SelectFiltro
                          {...c}
                          name="nacionalidad"
                          value={formulario.nacionalidad}
                          onChange={handleChange}
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
                    id="voluntariado-identificacion"
                    label={etiquetaDocumento}
                    required
                    error={errores.identificacion}
                  >
                    {(c) =>
                      esPasaporte ? (
                        <input
                          {...c}
                          className="pub-input"
                          type="text"
                          name="identificacion"
                          placeholder={tPhIdentificacion}
                          value={formulario.identificacion}
                          onChange={handleChange}
                          maxLength={LIMITE_IDENTIFICACION.pasaporte}
                          autoComplete="off"
                        />
                      ) : (
                        <NumericInput
                          {...c}
                          className="pub-input"
                          name="identificacion"
                          placeholder={tPhIdentificacion}
                          value={formulario.identificacion}
                          onChange={handleChange}
                          onBlur={handleIdentificacionBlur}
                          maxLength={LIMITE_IDENTIFICACION[tipoDocumento]}
                          autoComplete="off"
                        />
                      )
                    }
                  </Field>

                  <Field id="voluntariado-nombre" label="Nombre" required error={errores.nombre}>
                    {(c) => (
                      <input
                        {...c}
                        className="pub-input"
                        type="text"
                        name="nombre"
                        placeholder={placeholderCarga(tPhNombre)}
                        value={formulario.nombre}
                        onChange={handleChange}
                        maxLength={80}
                      />
                    )}
                  </Field>

                  <Field
                    id="voluntariado-primerApellido"
                    label="Primer apellido"
                    required
                    error={errores.primerApellido}
                  >
                    {(c) => (
                      <input
                        {...c}
                        className="pub-input"
                        type="text"
                        name="primerApellido"
                        placeholder={placeholderCarga(tPh1)}
                        value={formulario.primerApellido}
                        onChange={handleChange}
                        maxLength={80}
                      />
                    )}
                  </Field>

                  <Field id="voluntariado-segundoApellido" label="Segundo apellido">
                    {(c) => (
                      <input
                        {...c}
                        className="pub-input"
                        type="text"
                        name="segundoApellido"
                        placeholder={placeholderCarga(tPh2)}
                        value={formulario.segundoApellido}
                        onChange={handleChange}
                        maxLength={80}
                      />
                    )}
                  </Field>

                  <Field
                    id="voluntariado-institucion"
                    label="Institución educativa"
                    required
                    error={errores.institucion}
                  >
                    {(c) => (
                      <input
                        {...c}
                        className="pub-input"
                        type="text"
                        name="institucion"
                        placeholder={tPhInstitucion}
                        value={formulario.institucion}
                        onChange={handleChange}
                        maxLength={120}
                      />
                    )}
                  </Field>

                  <Field id="voluntariado-pais" label="País de residencia" required error={errores.pais}>
                    {(c) => (
                      <input
                        {...c}
                        className="pub-input"
                        type="text"
                        name="pais"
                        placeholder={tPhPais}
                        value={formulario.pais}
                        onChange={handleChange}
                        readOnly={!esPasaporte}
                      />
                    )}
                  </Field>

                  <Field id="voluntariado-correo" label="Correo electrónico" required error={errores.correo}>
                    {(c) => (
                      <input
                        {...c}
                        className="pub-input"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        name="correo"
                        placeholder="correo@ejemplo.com"
                        value={formulario.correo}
                        onChange={handleChange}
                      />
                    )}
                  </Field>

                  <Field id="voluntariado-telefono" label="Número de teléfono" required error={errores.telefono}>
                    {(c) => (
                      <NumericInput
                        {...c}
                        className="pub-input"
                        name="telefono"
                        placeholder="88888888"
                        maxLength={8}
                        value={formulario.telefono}
                        onChange={handleChange}
                      />
                    )}
                  </Field>
                </FormGrid>

                <div aria-live="polite">
                  {consultandoCedula ? (
                    <p className="pub-form-status">
                      <ST>Consultando datos de la identificación...</ST>
                    </p>
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

              {esGrupal ? (
                <FormSection
                  title="Información del grupo"
                  hint="Cuántas personas participan y quiénes son."
                >
                  <FormGrid>
                    <Field
                      id="voluntariado-cantidadParticipantes"
                      label="Cantidad de participantes"
                      required
                      hint="Entre 2 y 50 personas."
                      error={errores.cantidadParticipantes}
                    >
                      {(c) => (
                        <NumericInput
                          {...c}
                          className="pub-input"
                          name="cantidadParticipantes"
                          placeholder={tPhCantidad}
                          value={formulario.cantidadParticipantes}
                          onChange={handleChange}
                        />
                      )}
                    </Field>
                  </FormGrid>

                  <Field
                    id="voluntariado-documento-grupo"
                    label="Lista de integrantes del grupo"
                    required
                    hint="PDF, Word, Excel, CSV o texto. Máximo 10 MB."
                    error={errores.documentoGrupo}
                  >
                    {(c) => (
                      <>
                        <input
                          {...c}
                          className="pub-visually-hidden"
                          name="documentoGrupo"
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                          onChange={handleDocumentoChange}
                        />
                        {documentoGrupo ? (
                          <div className="pub-file">
                            <FileText size={24} aria-hidden="true" />
                            <div className="pub-file__text">
                              <span className="pub-file__name">{documentoGrupo.name}</span>
                              <span className="pub-file__size">
                                {(documentoGrupo.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoverDocumento}
                              className="pub-btn pub-btn--secondary pub-btn--icon"
                              aria-label={`${tQuitar}: ${documentoGrupo.name}`}
                            >
                              <Trash2 size={18} aria-hidden="true" />
                            </button>
                          </div>
                        ) : (
                          <label htmlFor={c.id} className="pub-dropzone">
                            <UploadCloud size={24} aria-hidden="true" />
                            <span className="pub-dropzone__title">
                              <ST>Tocá acá para subir la lista de integrantes</ST>
                            </span>
                          </label>
                        )}
                      </>
                    )}
                  </Field>
                </FormSection>
              ) : null}

              <FormSection title="Tipo de voluntariado" hint="Elegí el área en la que querés participar.">
                <ChoiceGroup label="Tipo de voluntariado" required columns={2} error={errores.tipo}>
                  {TIPOS_VOLUNTARIADO.map((tipo) => {
                    const count = getCantidadFechas(
                      resumenTipos,
                      tipo,
                      formulario.tipo === tipo ? fechasDisponibles : []
                    );
                    return (
                      <ChoiceCard
                        key={tipo}
                        name="tipoVoluntariado"
                        value={tipo}
                        checked={formulario.tipo === tipo}
                        onChange={() => handleTipoVoluntariado(tipo)}
                        title={tipo}
                        meta={
                          <CupoTexto
                            estado={count > 0 ? "disponible" : "agotado"}
                            texto={
                              count > 0
                                ? `${count} ${count === 1 ? "fecha disponible" : "fechas disponibles"}`
                                : "Sin fechas disponibles"
                            }
                          />
                        }
                      />
                    );
                  })}
                </ChoiceGroup>

                {esTipoOtro ? (
                  <Field
                    id="voluntariado-tipo-otro"
                    label={tTipoOtro}
                    required
                    error={errores.tipoOtro}
                  >
                    {(c) => (
                      <input
                        {...c}
                        className="pub-input"
                        type="text"
                        name="tipoOtro"
                        placeholder={tPhOtro}
                        value={formulario.tipoOtro}
                        onChange={handleChange}
                      />
                    )}
                  </Field>
                ) : null}

                {formulario.tipo && !tipoSeleccionadoTieneFechas && !cargandoFechas ? (
                  <FormNote tone="warning" title="No hay fechas habilitadas para este tipo de voluntariado.">
                    <p>
                      <ST>Elegí otro tipo con fechas disponibles o volvé a consultar más adelante.</ST>
                    </p>
                  </FormNote>
                ) : null}
              </FormSection>

              <FormSection title="Fecha" hint="Elegí uno de los días habilitados para este tipo de voluntariado.">
                {!formulario.tipo ? (
                  <FormPlaceholder title="Elegí primero el tipo de voluntariado">
                    El calendario muestra solo las fechas habilitadas para el tipo que elijas.
                  </FormPlaceholder>
                ) : cargandoFechas ? (
                  <FormPlaceholder loading title={`Consultando fechas disponibles para ${formulario.tipo}...`} />
                ) : !tipoSeleccionadoTieneFechas ? (
                  <FormPlaceholder title="Sin fechas configuradas">
                    {`Por ahora no hay fechas disponibles para "${formulario.tipo}". No se puede enviar la solicitud para esta opción.`}
                  </FormPlaceholder>
                ) : (
                  <>
                    <CalendarPicker
                      id="voluntariado-fechaVoluntariado"
                      label="Calendario de fechas disponibles"
                      selected={fechaSeleccionada}
                      onSelect={handleSelectFecha}
                      disabled={isDateDisabled}
                      locale={locale}
                      enabledDates={fechasHabilitadasDates}
                      legend={`Fecha disponible para ${formulario.tipo}`}
                      invalid={Boolean(errores.fechaVoluntariado)}
                      describedBy={errores.fechaVoluntariado ? "voluntariado-fecha-error" : undefined}
                    />
                    <FieldError id="voluntariado-fecha-error">{errores.fechaVoluntariado}</FieldError>
                  </>
                )}
              </FormSection>

              <FormSection title="Horario" hint="Elegí el turno disponible para el día que seleccionaste.">
                {!formulario.tipo ? (
                  <FormPlaceholder title="Elegí primero el tipo de voluntariado">
                    Después de elegir la fecha vas a ver los turnos disponibles.
                  </FormPlaceholder>
                ) : !formulario.fechaVoluntariado ? (
                  <FormPlaceholder title="Elegí una fecha en el calendario">
                    Al elegir un día habilitado vas a ver los turnos de esa fecha.
                  </FormPlaceholder>
                ) : (
                  <ChoiceGroup
                    legend={
                      fechaSeleccionada
                        ? `Turnos para el ${format(fechaSeleccionada, "d 'de' MMMM", { locale })}`
                        : `Turnos para el ${formulario.fechaVoluntariado}`
                    }
                    required
                    error={errores.disponibilidad}
                    columns={1}
                    slots
                  >
                    {horariosDisponiblesParaFecha.map((horarioStr) => (
                      <ChoiceCard
                        key={horarioStr}
                        variant="slot"
                        name="disponibilidad"
                        value={horarioStr}
                        checked={formulario.disponibilidad === horarioStr}
                        onChange={() => handleDisponibilidad(horarioStr)}
                        title={horarioStr}
                      />
                    ))}
                  </ChoiceGroup>
                )}
              </FormSection>

              <AvisoSedeFinca sede={sedeFinca} contexto="voluntariado" />

              <FormAlert>{errorApi}</FormAlert>

              <SubmitFooter
                label={!usuario ? tLoginBtn : tEnviar}
                busyLabel={tEnviando}
                busy={enviando}
                disabled={!usuario || (!tipoSeleccionadoTieneFechas && Boolean(formulario.tipo))}
              />
            </form>
          ) : (
            <FormSuccess
              title="Solicitud enviada"
              summary="Recibimos tu solicitud de voluntariado. El equipo de Café UNA la va a revisar y te avisamos por correo electrónico."
            >
              <button type="button" className="pub-btn pub-btn--primary" onClick={() => setEnviado(false)}>
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
          )}
        </div>
      </main>
    </>
  );
}

export default SolicitarVoluntariado;
