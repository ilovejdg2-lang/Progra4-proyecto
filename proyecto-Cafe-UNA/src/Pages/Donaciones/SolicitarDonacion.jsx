import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  CalendarX2,
  Check,
  Clock,
  FileText,
  HelpCircle,
  Lock,
  MapPin,
  Package,
  Phone,
  Send,
  Truck,
  UploadCloud,
  User,
} from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import BackToHomeLink from "../../Components/BackToHomeLink/BackToHomeLink";
import { NumericInput } from "../../Components/NumericInput/NumericInput";
import { HOME_SCROLL_SECTIONS } from "../../lib/homeScrollTarget";
import PageLoading from "../../Components/PageLoading/PageLoading";
import { usePaintPublicPage } from "../../hooks/usePaintPublicPage";
import { getActiveSessionUser } from "../../services/sessionService";
import { consultarCedulaDetallada } from "../../services/cedulaService";
import {
  enviarSolicitudDonacion,
  obtenerFechasRecepcionDisponibles,
  obtenerNecesidadesPublicas,
} from "../../services/donacionesService";
import { Calendar } from "@/components/ui/calendar";
import { useIdioma } from "../../lib/useIdioma";
import { queueFocusFormError } from "../../lib/formFocus";
import { filtrarEnteros } from "../../lib/numericInput";
import {
  limitarPalabras,
  MAX_PALABRAS_TITULO,
} from "../../lib/formLimits";
import { useTraducir } from "../../hooks/useTraducir";
import { ST } from "../../Components/T/ST";
import { ImageLightbox } from "../../Components/ImageLightbox/ImageLightbox";
import {
  cantonesDeProvincia,
  distritosDeCanton,
  PROVINCIAS_CR,
} from "../../lib/costaRicaDivisiones";
import { asegurarCamposEnEspanol } from "../../lib/traducir";
import "../Voluntariado/SolicitarVoluntariado.css";
import "./SolicitarDonacion.css";

function SectionCard({ icon: Icon, paso, title, hint, children }) {
  return (
    <div className="section-card">
      <div className="section-card__header">
        <span className="section-card__paso" aria-hidden="true">
          {paso}
        </span>
        <h4>
          <span className="sr-only">
            <ST>Paso</ST> {paso}.{" "}
          </span>
          {title}
        </h4>
        {Icon ? <Icon size={20} className="section-card__icon-inline" aria-hidden="true" /> : null}
        {hint ? <span className="section-card__hint">{hint}</span> : null}
      </div>
      <div className="section-card__body">{children}</div>
    </div>
  );
}

const ESTADOS_ARTICULOS = [
  "Nuevo",
  "Usado en buen estado",
  "Usado con desgaste",
  "Para reparar",
];

const MAX_DESCRIPCION = 500;
const MAX_FOTOS = 5;
const MAX_FOTO_BYTES = 10 * 1024 * 1024;
const TIPOS_FOTO = new Set(["image/jpeg", "image/png", "image/webp"]);
const DONACION_LOGIN_REDIRECT = "/donaciones/solicitar";

const FORM_INICIAL = {
  tipoDonante: "persona",
  nombre: "",
  primerApellido: "",
  segundoApellido: "",
  identificacion: "",
  correo: "",
  telefono: "",
  categoriaId: "",
  materialId: "",
  categoriaOtra: "",
  descripcion: "",
  cantidadEstimada: "",
  estadoArticulos: "",
  metodoEntrega: "",
  provincia: "",
  canton: "",
  distrito: "",
  direccion: "",
  direccionRecoleccion: "",
  horaEntrega: "",
  valorEstimado: "",
  fechaSolicitud: "",
  fechaEntrega: "",
  declaraOrigen: false,
  aceptaPrivacidad: false,
};

function normalizarCedulaCr(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

function isoLocal(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function hoyIso() {
  return isoLocal(new Date());
}

function parseIsoLocal(valor) {
  if (!valor) return null;
  const fecha = new Date(`${valor}T00:00:00`);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function esAvisoCedulaInformativo(mensaje) {
  return /cargad[oa]s?\s+autom[aá]ticamente/i.test(mensaje) || /datos cargados/i.test(mensaje);
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

function nombreCompletoDonante(formulario) {
  if (formulario.tipoDonante === "organizacion") {
    return formulario.nombre.trim();
  }
  return [formulario.nombre, formulario.primerApellido, formulario.segundoApellido]
    .map((parte) => String(parte || "").trim())
    .filter(Boolean)
    .join(" ");
}

function comprimirFoto(file) {
  return new Promise((resolve, reject) => {
    const objeto = URL.createObjectURL(file);
    const imagen = new Image();
    imagen.onload = () => {
      const max = 720;
      const escala = Math.min(1, max / Math.max(imagen.width, imagen.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(imagen.width * escala));
      canvas.height = Math.max(1, Math.round(imagen.height * escala));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objeto);
        reject(new Error("No se pudo procesar la imagen."));
        return;
      }
      ctx.drawImage(imagen, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objeto);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    imagen.onerror = () => {
      URL.revokeObjectURL(objeto);
      reject(new Error("No se pudo leer la imagen."));
    };
    imagen.src = objeto;
  });
}

function leerNecesidadDesdeUrl(params, search) {
  if (params?.necesidadId) return String(params.necesidadId);
  if (search && typeof search === "object" && search.necesidadId) {
    return String(search.necesidadId);
  }
  if (typeof window !== "undefined") {
    return new URLSearchParams(window.location.search).get("necesidadId") || "";
  }
  return "";
}

function crearFormularioInicial(user, necesidadId = "") {
  return {
    ...FORM_INICIAL,
    correo: String(user?.email || user?.correo || "").trim().toLowerCase(),
    categoriaId: necesidadId ? String(necesidadId) : "",
    fechaSolicitud: hoyIso(),
  };
}

export default function SolicitarDonacion() {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const search = useRouterState({ select: (state) => state.location.search });
  const necesidadInicial = leerNecesidadDesdeUrl(params, search);

  const tTitulo = useTraducir("Solicitud de donación");
  const tSub = useTraducir(
    "Café UNA recibe únicamente donaciones materiales: bienes, equipos, herramientas e insumos físicos.",
  );
  const tDonante = useTraducir("Información del donante");
  const tQuien = useTraducir("¿Quién realizará la donación?");
  const tPersona = useTraducir("Persona");
  const tOrganizacion = useTraducir("Organización");
  const tNombre = useTraducir("Nombre");
  const tRazonSocial = useTraducir("Razón social");
  const tPrimerApellido = useTraducir("Primer apellido");
  const tSegundoApellido = useTraducir("Segundo apellido");
  const tPhNombre = useTraducir("Nombre");
  const tPh1 = useTraducir("1° Apellido");
  const tPh2 = useTraducir("2° Apellido");
  const tIdentificacion = useTraducir("Identificación");
  const tPhId = useTraducir("Cédula, jurídica o pasaporte");
  const tCorreo = useTraducir("Correo electrónico");
  const tTelefono = useTraducir("Teléfono");
  const tDetalles = useTraducir("Detalles de la donación");
  const tDetallesHint = useTraducir("Cuéntanos más sobre los artículos que deseas donar.");
  const tCategoria = useTraducir("Categoría de la donación");
  const tSeleccione = useTraducir("Seleccione una opción");
  const tDescripcion = useTraducir("Descripción detallada de los artículos");
  const tCantidad = useTraducir("Cantidad o volumen estimado");
  const tPhCantidad = useTraducir("3 cajas, 5 unidades");
  const tEstado = useTraducir("Estado de los artículos");
  const tFotos = useTraducir("Fotografías de los artículos");
  const tFotosHint = useTraducir("JPG, PNG o WEBP. Máximo 5 imágenes de 10 MB cada una.");
  const tFotosCta = useTraducir("Arrastra las fotos aquí o haz clic para seleccionarlas");
  const tLogistica = useTraducir("Logística de entrega");
  const tLogisticaHint = useTraducir("Indica cómo te gustaría realizar la entrega de los artículos.");
  const tMetodo = useTraducir("Método de entrega preferido");
  const tEntregaTitulo = useTraducir("Lo entregaré personalmente");
  const tEntregaDesc = useTraducir("Llevaré los artículos al centro de acopio.");
  const tRecoleccionTitulo = useTraducir("Solicito recolección");
  const tRecoleccionDesc = useTraducir("La organización evaluará si puede recoger la donación.");
  const tHorarios = useTraducir("Horario de recepción");
  const tHorariosHint = useTraducir(
    "Seleccione un día habilitado y uno de los turnos en los que el centro de acopio recibe donaciones.",
  );
  const tDiaEntregaEntrega = useTraducir("Día de entrega");
  const { idioma } = useIdioma();
  const localeCalendario = idioma === "en" ? enUS : es;
  const tDeclaracion = useTraducir("Declaración y confirmación");
  const tDeclaracionHint = useTraducir("Revisa la información y acepta los términos para completar tu solicitud.");
  const tValor = useTraducir("Valor estimado de la donación");
  const tFecha = useTraducir("Fecha de la solicitud");
  const tOrigen = useTraducir(
    "Certifico que los artículos son de mi propiedad y de origen lícito.",
  );
  const tPrivacidad = useTraducir("Acepto la Política de privacidad.");
  const tCancelar = useTraducir("Cancelar");
  const tEnviar = useTraducir("Enviar solicitud");
  const tEnviando = useTraducir("Enviando...");
  const tLoginBtn = useTraducir("Inicie sesión para enviar");
  const tLoginMsg = useTraducir("Debe iniciar sesión para enviar su solicitud de donación.");
  const tLoginLink = useTraducir("Iniciar sesión →");
  const tMaterial = useTraducir("Material o artículo");
  const tValorHint = useTraducir("Indique el valor aproximado total de los artículos ofrecidos.");
  const tUbicacion = useTraducir("Ubicación de la donación");
  const tUbicacionHint = useTraducir("Indique dónde se encuentran físicamente los artículos.");
  const tProvincia = useTraducir("Provincia");
  const tCanton = useTraducir("Cantón");
  const tDistrito = useTraducir("Distrito");
  const tSeñas = useTraducir("Dirección o señas adicionales");
  const tRecoleccionAviso = useTraducir(
    "La solicitud de recolección está sujeta a disponibilidad de personal, vehículo institucional, ubicación, cantidad y características de los artículos. Seleccionar esta opción no garantiza que la recolección sea aprobada.",
  );
  const tIntro = useTraducir(
    "En Café UNA recibimos donaciones de materiales, equipos, herramientas e insumos que puedan contribuir al desarrollo de las actividades del proyecto. Antes de completar la solicitud, revise las categorías y materiales actualmente requeridos.",
  );
  const tFaqTitulo = useTraducir("Preguntas frecuentes");

  const [usuario] = useState(() => getActiveSessionUser());
  const [formulario, setFormulario] = useState(() =>
    crearFormularioInicial(getActiveSessionUser(), necesidadInicial),
  );
  const [fotos, setFotos] = useState([]);
  const [necesidades, setNecesidades] = useState([]);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorApi, setErrorApi] = useState(null);
  const [consultandoCedula, setConsultandoCedula] = useState(false);
  const [avisoCedula, setAvisoCedula] = useState(null);
  const [dropActivo, setDropActivo] = useState(false);
  const [fotoVista, setFotoVista] = useState(null);
  const [fechasRecepcion, setFechasRecepcion] = useState([]);
  const [cargandoFechasRecepcion, setCargandoFechasRecepcion] = useState(false);

  const {
    ref: pageRef,
    showLoading,
    showPrepaint,
    inert,
    loadingMessage,
  } = usePaintPublicPage("donaciones");

  const consultaCedulaRef = useRef({ digitos: "", enCurso: false });
  const fileInputRef = useRef(null);
  const fotosRef = useRef([]);
  fotosRef.current = fotos;
  const esPersona = formulario.tipoDonante === "persona";
  const pideRecoleccion = formulario.metodoEntrega === "recoleccion";
  const pideEntrega = formulario.metodoEntrega === "entrega";
  const cantonesDisponibles = cantonesDeProvincia(formulario.provincia);
  const distritosDisponibles = distritosDeCanton(formulario.provincia, formulario.canton);

  const redirectToLogin = useCallback(() => {
    sessionStorage.setItem("postLoginRedirect", DONACION_LOGIN_REDIRECT);
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
    [usuario, redirectToLogin],
  );

  useEffect(() => {
    let vivo = true;
    obtenerNecesidadesPublicas()
      .then((rows) => {
        if (!vivo) return;
        setNecesidades((rows || []).filter((row) => row.estado === "ACTIVA"));
      })
      .catch(() => {
        if (!vivo) return;
        setNecesidades([]);
      });
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    let vivo = true;
    setCargandoFechasRecepcion(true);
    obtenerFechasRecepcionDisponibles()
      .then((rows) => {
        if (!vivo) return;
        setFechasRecepcion(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!vivo) return;
        setFechasRecepcion([]);
      })
      .finally(() => {
        if (vivo) setCargandoFechasRecepcion(false);
      });
    return () => {
      vivo = false;
    };
  }, []);

  const fechasRecepcionMap = useMemo(() => {
    const map = new Map();
    for (const f of fechasRecepcion) {
      const iso = String(f.Fecha || f.fecha || "").slice(0, 10);
      if (iso && (f.Habilitada ?? f.habilitada)) map.set(iso, f);
    }
    return map;
  }, [fechasRecepcion]);

  const fechasRecepcionDates = useMemo(() => {
    const list = [];
    for (const [iso] of fechasRecepcionMap) {
      const [y, m, d] = iso.split("-").map(Number);
      if (y && m && d) list.push(new Date(y, m - 1, d));
    }
    return list;
  }, [fechasRecepcionMap]);

  const fechaEntregaSeleccionada = parseIsoLocal(formulario.fechaEntrega);

  const horariosRecepcionParaFecha = useMemo(() => {
    const registro = fechasRecepcionMap.get(formulario.fechaEntrega);
    if (!registro) return [];
    const h = registro.Horarios ?? registro.horarios;
    return Array.isArray(h) && h.length > 0 ? h : [];
  }, [fechasRecepcionMap, formulario.fechaEntrega]);

  const isFechaRecepcionDisabled = useCallback(
    (date) => {
      if (isBefore(startOfDay(date), startOfDay(new Date()))) return true;
      return !fechasRecepcionMap.has(format(date, "yyyy-MM-dd"));
    },
    [fechasRecepcionMap],
  );

  useEffect(() => {
    return () => {
      fotosRef.current.forEach((foto) => URL.revokeObjectURL(foto.preview));
    };
  }, []);

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
    if (!esPersona || digitos.length !== 9) return;
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
      setFormulario((prev) => ({
        ...prev,
        identificacion: digitos,
        nombre: partes.nombre,
        primerApellido: partes.primerApellido,
        segundoApellido: partes.segundoApellido,
      }));
      setAvisoCedula("Datos cargados automáticamente. Puede editarlos si es necesario.");
      setErrores((prev) => {
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
      const mensajeBase = error?.message?.trim() || "No se pudo consultar la cédula.";
      const yaIndicaManual = /manualmente|completar el nombre/i.test(mensajeBase);
      const esConexion = error?.cause?.code === "ERR_NETWORK" || /conectar con el servidor/i.test(mensajeBase);
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
  }, [esPersona]);

  useEffect(() => {
    if (!esPersona) return;
    const digitos = normalizarCedulaCr(formulario.identificacion);
    if (!esCedulaFisica(formulario.identificacion) || digitos.length !== 9) return;
    if (consultaCedulaRef.current.enCurso) return;
    if (consultaCedulaRef.current.digitos === digitos) return;
    const timeoutId = window.setTimeout(() => {
      consultarDatosCedula(digitos);
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [formulario.identificacion, esPersona, consultarDatosCedula]);

  const handleChange = (event) => {
    const name = event.target.name;
    if (name === "fechaSolicitud") return;

    let valor = event.target.type === "checkbox" ? event.target.checked : event.target.value;

    if (typeof valor === "string") {
      valor = valor.replace(/\s+/g, " ").trimStart();
    }
    if (name === "correo") valor = String(valor).toLowerCase();
    if (name === "telefono") valor = filtrarEnteros(valor).slice(0, 8);
    if (name === "valorEstimado") valor = String(valor).replace(/[^\d.,]/g, "").slice(0, 20);
    if (name === "descripcion") valor = String(valor).slice(0, MAX_DESCRIPCION);

    if (name === "identificacion") {
      if (esPersona) {
        const crudo = String(valor);
        const soloDigitos = crudo.replace(/[\s-]/g, "");
        if (/^\d*$/.test(soloDigitos)) {
          valor = soloDigitos.slice(0, 9);
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
      valor = String(valor).slice(0, 30);
    }

    if (name === "metodoEntrega") {
      setFormulario((prev) => ({
        ...prev,
        metodoEntrega: valor,
        fechaEntrega: "",
        horaEntrega: "",
      }));
      limpiarError("metodoEntrega");
      limpiarError("fechaEntrega");
      limpiarError("horaEntrega");
      return;
    }

    if (
      name === "nombre" ||
      name === "primerApellido" ||
      name === "segundoApellido"
    ) {
      valor = limitarPalabras(String(valor), MAX_PALABRAS_TITULO);
    }

    if (name === "provincia") {
      setFormulario((prev) => ({
        ...prev,
        provincia: valor,
        canton: "",
        distrito: "",
      }));
      limpiarError("provincia");
      limpiarError("canton");
      limpiarError("distrito");
      return;
    }
    if (name === "canton") {
      setFormulario((prev) => ({
        ...prev,
        canton: valor,
        distrito: "",
      }));
      limpiarError("canton");
      limpiarError("distrito");
      return;
    }

    if (name === "categoriaId") {
      setFormulario((prev) => ({
        ...prev,
        categoriaId: valor,
        materialId: "",
        categoriaOtra: "",
      }));
      limpiarError("categoriaId");
      limpiarError("materialId");
      return;
    }

    setFormulario((prev) => ({ ...prev, [name]: valor }));
    limpiarError(name);
  };

  const handleTipoDonante = (tipoDonante) => {
    consultaCedulaRef.current = { digitos: "", enCurso: false };
    setAvisoCedula(null);
    setFormulario((prev) => ({
      ...prev,
      tipoDonante,
      nombre: "",
      primerApellido: "",
      segundoApellido: "",
      identificacion:
        tipoDonante === "persona"
          ? normalizarCedulaCr(prev.identificacion).slice(0, 9)
          : prev.identificacion,
    }));
    limpiarError("nombre");
    limpiarError("primerApellido");
    limpiarError("identificacion");
  };

  const handleIdentificacionBlur = async () => {
    if (!esPersona) return;
    const digitos = normalizarCedulaCr(formulario.identificacion);
    if (esCedulaFisica(formulario.identificacion) && digitos !== formulario.identificacion) {
      setFormulario((prev) => ({ ...prev, identificacion: digitos }));
    }
    if (!esCedulaFisica(formulario.identificacion)) return;
    if (digitos.length !== 9) {
      if (digitos.length > 0) setAvisoCedula("La cédula costarricense debe tener 9 dígitos.");
      return;
    }
    await consultarDatosCedula(digitos, { forzar: true });
  };

  const agregarFotos = (fileList) => {
    const incoming = Array.from(fileList || []);
    const mensajes = [];
    setFotos((prev) => {
      const next = [...prev];
      for (const file of incoming) {
        if (next.length >= MAX_FOTOS) {
          mensajes.push("Máximo 5 imágenes.");
          break;
        }
        if (!TIPOS_FOTO.has(file.type)) {
          mensajes.push("Solo se permiten imágenes JPG, PNG o WEBP.");
          continue;
        }
        if (file.size > MAX_FOTO_BYTES) {
          mensajes.push("Cada imagen debe pesar máximo 10 MB.");
          continue;
        }
        next.push({
          id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
          file,
          preview: URL.createObjectURL(file),
        });
      }
      return next;
    });
    if (mensajes.length) {
      setErrores((prev) => ({ ...prev, fotos: mensajes[0] }));
    } else {
      limpiarError("fotos");
    }
  };

  const quitarFoto = (id) => {
    setFotos((prev) => {
      const encontrada = prev.find((item) => item.id === id);
      if (encontrada) URL.revokeObjectURL(encontrada.preview);
      return prev.filter((item) => item.id !== id);
    });
    setFotoVista(null);
    limpiarError("fotos");
  };

  const categoriaSeleccionada = useMemo(
    () => necesidades.find((row) => String(row.id) === String(formulario.categoriaId)),
    [necesidades, formulario.categoriaId],
  );
  const materialesCategoria = useMemo(
    () =>
      (categoriaSeleccionada?.materiales || []).filter(
        (item) => !item.estado || item.estado === "ACTIVA",
      ),
    [categoriaSeleccionada],
  );

  const validarFormulario = () => {
    const nuevos = {};
    if (esPersona) {
      if (!formulario.nombre.trim()) nuevos.nombre = "El nombre es obligatorio";
      else if (formulario.nombre.trim().length < 2) nuevos.nombre = "Mínimo 2 caracteres";
      if (!formulario.primerApellido.trim()) nuevos.primerApellido = "El primer apellido es obligatorio";
    } else if (!formulario.nombre.trim()) {
      nuevos.nombre = "La razón social es obligatoria";
    }
    const identificacion = formulario.identificacion.trim();
    if (!identificacion) {
      nuevos.identificacion = "La identificación es obligatoria";
    }
    const correo = formulario.correo.trim();
    if (!correo) nuevos.correo = "El correo es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) nuevos.correo = "Correo electrónico inválido";
    if (!formulario.telefono.trim()) nuevos.telefono = "El teléfono es obligatorio";
    if (!formulario.categoriaId) nuevos.categoriaId = "Seleccione la categoría de la donación";
    if (!formulario.materialId) nuevos.materialId = "Seleccione el material o artículo";
    if (!formulario.descripcion.trim()) nuevos.descripcion = "La descripción es obligatoria";
    if (!formulario.cantidadEstimada.trim()) nuevos.cantidadEstimada = "Indique la cantidad o volumen estimado";
    if (!formulario.estadoArticulos) nuevos.estadoArticulos = "Seleccione el estado de los artículos";
    const valorNum = Number(String(formulario.valorEstimado).replace(/[^\d.]/g, ""));
    if (!formulario.valorEstimado.trim() || !Number.isFinite(valorNum) || valorNum <= 0) {
      nuevos.valorEstimado = "Indique un valor estimado mayor a 0";
    }
    if (fotos.length < 1) nuevos.fotos = "Agregue al menos una fotografía";
    if (fotos.length > MAX_FOTOS) nuevos.fotos = "Máximo 5 imágenes.";
    if (!formulario.provincia) nuevos.provincia = "Seleccione la provincia";
    if (!formulario.canton) nuevos.canton = "Seleccione el cantón";
    if (!formulario.distrito) nuevos.distrito = "Seleccione el distrito";
    if (!formulario.direccion.trim()) nuevos.direccion = "Indique la dirección o señas";
    if (!formulario.metodoEntrega) nuevos.metodoEntrega = "Seleccione el método de entrega";
    if (pideEntrega) {
      if (!formulario.fechaEntrega) {
        nuevos.fechaEntrega = "Seleccione un día habilitado para entregar la donación";
      } else if (!fechasRecepcionMap.has(formulario.fechaEntrega)) {
        nuevos.fechaEntrega = "Esa fecha no está habilitada para recibir donaciones.";
      }
      if (!formulario.horaEntrega) {
        nuevos.horaEntrega = "Seleccione un horario de recepción";
      } else if (
        horariosRecepcionParaFecha.length > 0 &&
        !horariosRecepcionParaFecha.includes(formulario.horaEntrega)
      ) {
        nuevos.horaEntrega = "Seleccione un horario disponible para esa fecha";
      }
    }
    if (!formulario.declaraOrigen) nuevos.declaraOrigen = "Debe certificar el origen lícito de los artículos";
    if (!formulario.aceptaPrivacidad) nuevos.aceptaPrivacidad = "Debe aceptar la política de privacidad";
    setErrores(nuevos);
    return nuevos;
  };

  const resetFormulario = () => {
    fotos.forEach((foto) => URL.revokeObjectURL(foto.preview));
    setFotos([]);
    setFormulario(crearFormularioInicial(usuario, ""));
    setErrores({});
    setErrorApi(null);
    setAvisoCedula(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!usuario) {
      sessionStorage.setItem("postLoginRedirect", DONACION_LOGIN_REDIRECT);
      setErrorApi("Debe iniciar sesión antes de enviar una solicitud de donación.");
      queueFocusFormError({ root: event.currentTarget });
      return;
    }

    const nuevosErrores = validarFormulario();
    if (Object.keys(nuevosErrores).length > 0) {
      queueFocusFormError({
        errors: nuevosErrores,
        root: event.currentTarget,
        fieldOrder: [
          "nombre",
          "primerApellido",
          "identificacion",
          "correo",
          "telefono",
          "categoriaId",
          "materialId",
          "descripcion",
          "cantidadEstimada",
          "estadoArticulos",
          "valorEstimado",
          "fotos",
          "provincia",
          "canton",
          "distrito",
          "direccion",
          "metodoEntrega",
          "horaEntrega",
          "fechaEntrega",
          "declaraOrigen",
          "aceptaPrivacidad",
        ],
      });
      return;
    }

    setEnviando(true);
    setErrorApi(null);
    try {
      const tipoFinal = categoriaSeleccionada?.titulo || "";
      const materialSel = materialesCategoria.find(
        (item) => String(item.id) === String(formulario.materialId),
      );

      const payload = {
        necesidadId: Number(formulario.categoriaId),
        materialId: Number(formulario.materialId),
        tipo: tipoFinal,
        descripcion: formulario.descripcion.trim(),
        fechaPropuesta: pideEntrega ? formulario.fechaEntrega : hoyIso(),
        detalles: {
          donanteNombre: nombreCompletoDonante(formulario),
          tipoDonante: formulario.tipoDonante,
          nombre: formulario.nombre.trim(),
          primerApellido: esPersona ? formulario.primerApellido.trim() : "",
          segundoApellido: esPersona ? formulario.segundoApellido.trim() : "",
          tipoIdentificacion: esPersona
            ? (esCedulaFisica(formulario.identificacion) ? "cedula" : "pasaporte")
            : "juridica",
          numeroIdentificacion: esCedulaFisica(formulario.identificacion)
            ? normalizarCedulaCr(formulario.identificacion)
            : formulario.identificacion.trim(),
          correo: formulario.correo.trim(),
          telefono: formulario.telefono.trim(),
          materialId: Number(formulario.materialId),
          materialNombre: materialSel?.nombre || "",
          cantidadEstimada: formulario.cantidadEstimada.trim(),
          estadoArticulos: formulario.estadoArticulos,
          metodoEntrega: formulario.metodoEntrega,
          provincia: formulario.provincia,
          canton: formulario.canton,
          distrito: formulario.distrito,
          direccion: formulario.direccion.trim(),
          direccionRecoleccion: pideRecoleccion ? formulario.direccion.trim() : "",
          horarios: formulario.horaEntrega ? [formulario.horaEntrega] : [],
          horaEntrega: formulario.horaEntrega,
          fechaEntrega: formulario.fechaEntrega,
          fechaSolicitud: hoyIso(),
          valorEstimado: formulario.valorEstimado.trim(),
          fotos: await Promise.all(
            fotos.map(async (item) => ({
              nombre: item.file.name,
              tipo: item.file.type,
              tamano: item.file.size,
              url: await comprimirFoto(item.file),
            })),
          ),
        },
      };

      const datosEs = await asegurarCamposEnEspanol(payload, ["tipo", "descripcion"]);
      await enviarSolicitudDonacion(datosEs);
      window.dispatchEvent(new Event("donaciones-updated"));
      resetFormulario();
      setEnviado(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrorApi(err instanceof Error ? err.message : "Ocurrió un error al enviar la solicitud. Intente nuevamente.");
      queueFocusFormError({ root: event.currentTarget });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      {showLoading ? <PageLoading message={loadingMessage} /> : null}
      <main
        ref={pageRef}
        className={`voluntariado-page donacion-page${showPrepaint ? " voluntariado-page--prepaint" : ""}`}
        inert={inert}
      >
        <BackToHomeLink homeSection={HOME_SCROLL_SECTIONS.voluntariado} />
        <section className="voluntariado-section">
          <div className="voluntariado-header">
            <h1>{tTitulo}</h1>
            <p>{tSub}</p>
          </div>

          {!enviado ? (
            <>
          <div className="donacion-intro">
            <div className="donacion-intro__encabezado">
              <Package size={20} aria-hidden="true" />
              <h2><ST>¿Qué donaciones recibimos?</ST></h2>
            </div>
            <p>{tIntro}</p>
            {necesidades.length ? (
              <ul className="donacion-intro__cats">
                {necesidades.map((item) => (
                  <li key={item.id}>
                    <strong>{item.titulo}</strong>
                    {item.materiales?.length ? (
                      <span>
                        {(item.materiales || [])
                          .filter((mat) => !mat.estado || mat.estado === "ACTIVA")
                          .slice(0, 4)
                          .map((mat) => mat.nombre)
                          .join(", ")}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mensaje-info">
                <ST>Por ahora no hay categorías de donación material activas.</ST>
              </p>
            )}
          </div>

          <form
              onSubmit={handleSubmit}
              className="formulario-card"
              noValidate
              onFocusCapture={handleFormInteractionCapture}
              onPointerDownCapture={handleFormInteractionCapture}
            >
              <div className="form-secciones">
                <SectionCard paso={1} icon={User} title={tDonante}>
                  <div className="campo full tipo-postulacion">
                    <p className="campo-pregunta">
                      {tQuien}<span className="req">*</span>
                    </p>
                    <div className="tipo-opciones">
                      <label className="radio-card">
                        <input
                          type="radio"
                          name="tipoDonante"
                          value="persona"
                          checked={esPersona}
                          onChange={() => handleTipoDonante("persona")}
                        />
                        <span>{tPersona}</span>
                      </label>
                      <label className="radio-card">
                        <input
                          type="radio"
                          name="tipoDonante"
                          value="organizacion"
                          checked={!esPersona}
                          onChange={() => handleTipoDonante("organizacion")}
                        />
                        <span>{tOrganizacion}</span>
                      </label>
                    </div>
                  </div>

                  {esPersona ? (
                    <>
                      <div className="form-grid--4cols">
                        <div className="campo">
                          <label>
                            {tIdentificacion} <span className="req">*</span>
                          </label>
                          <NumericInput
                            name="identificacion"
                            placeholder={tPhId}
                            value={formulario.identificacion}
                            onChange={handleChange}
                            onBlur={handleIdentificacionBlur}
                            maxLength={9}
                            autoComplete="off"
                          />
                          {errores.identificacion ? (
                            <span className="mensaje-error"><ST>{errores.identificacion}</ST></span>
                          ) : null}
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
                          />
                          {errores.nombre ? <span className="mensaje-error"><ST>{errores.nombre}</ST></span> : null}
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
                          />
                          {errores.primerApellido ? (
                            <span className="mensaje-error"><ST>{errores.primerApellido}</ST></span>
                          ) : null}
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
                          />
                        </div>
                      </div>
                      {consultandoCedula ? (
                        <span className="mensaje-info">Consultando datos de la cédula...</span>
                      ) : null}
                      {!consultandoCedula && avisoCedula ? (
                        <span className={esAvisoCedulaInformativo(avisoCedula) ? "mensaje-info" : "mensaje-error"}>
                          <ST>{avisoCedula}</ST>
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <div className="campo">
                        <label>
                          {tRazonSocial} <span className="req">*</span>
                        </label>
                        <input
                          type="text"
                          name="nombre"
                          placeholder={tRazonSocial}
                          value={formulario.nombre}
                          onChange={handleChange}
                          maxLength={160}
                        />
                        {errores.nombre ? <span className="mensaje-error"><ST>{errores.nombre}</ST></span> : null}
                      </div>
                      <div className="campo">
                        <label>
                          {tIdentificacion} <span className="req">*</span>
                        </label>
                        <input
                          type="text"
                          name="identificacion"
                          placeholder={tPhId}
                          value={formulario.identificacion}
                          onChange={handleChange}
                          maxLength={30}
                          autoComplete="off"
                        />
                        {errores.identificacion ? (
                          <span className="mensaje-error"><ST>{errores.identificacion}</ST></span>
                        ) : null}
                      </div>
                    </>
                  )}

                  <div className="form-grid">
                    <div className="campo">
                      <label>
                        {tCorreo} <span className="req">*</span>
                      </label>
                      <input
                        type="email"
                        name="correo"
                        value={formulario.correo}
                        onChange={handleChange}
                        placeholder="ejemplo@correo.com"
                      />
                      {errores.correo ? <span className="mensaje-error"><ST>{errores.correo}</ST></span> : null}
                    </div>
                    <div className="campo">
                      <label>
                        {tTelefono} <span className="req">*</span>
                      </label>
                      <div className="campo-con-icono">
                        <Phone size={16} className="campo-con-icono__icono" aria-hidden="true" />
                        <NumericInput
                          name="telefono"
                          placeholder="88888888"
                          maxLength={8}
                          value={formulario.telefono}
                          onChange={handleChange}
                        />
                      </div>
                      {errores.telefono ? <span className="mensaje-error"><ST>{errores.telefono}</ST></span> : null}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard paso={2} icon={Package} title={tDetalles} hint={tDetallesHint}>
                  <div className="campo">
                    <label>
                      {tCategoria} <span className="req">*</span>
                    </label>
                    <select name="categoriaId" value={formulario.categoriaId} onChange={handleChange}>
                      <option value="">{tSeleccione}</option>
                      {necesidades.map((item) => (
                        <option key={item.id} value={String(item.id)}>
                          {item.titulo}
                        </option>
                      ))}
                    </select>
                    {errores.categoriaId ? <span className="mensaje-error"><ST>{errores.categoriaId}</ST></span> : null}
                  </div>
                  <div className="campo">
                    <label>
                      {tMaterial} <span className="req">*</span>
                    </label>
                    <select
                      name="materialId"
                      value={formulario.materialId}
                      onChange={handleChange}
                      disabled={!formulario.categoriaId}
                    >
                      <option value="">{tSeleccione}</option>
                      {materialesCategoria.map((item) => (
                        <option key={item.id} value={String(item.id)}>
                          {item.nombre}
                        </option>
                      ))}
                    </select>
                    {errores.materialId ? <span className="mensaje-error"><ST>{errores.materialId}</ST></span> : null}
                  </div>
                  <div className="campo">
                    <label>
                      {tDescripcion} <span className="req">*</span>
                    </label>
                    <textarea
                      name="descripcion"
                      rows={4}
                      value={formulario.descripcion}
                      onChange={handleChange}
                      maxLength={MAX_DESCRIPCION}
                    />
                    <div className="contador-caracteres">
                      {formulario.descripcion.length}/{MAX_DESCRIPCION}
                    </div>
                    {errores.descripcion ? <span className="mensaje-error"><ST>{errores.descripcion}</ST></span> : null}
                  </div>
                  <div className="form-grid">
                    <div className="campo">
                      <label>
                        {tCantidad} <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        name="cantidadEstimada"
                        value={formulario.cantidadEstimada}
                        onChange={handleChange}
                        placeholder={tPhCantidad}
                        maxLength={120}
                      />
                      {errores.cantidadEstimada ? <span className="mensaje-error"><ST>{errores.cantidadEstimada}</ST></span> : null}
                    </div>
                    <div className="campo">
                      <label>
                        {tEstado} <span className="req">*</span>
                      </label>
                      <select name="estadoArticulos" value={formulario.estadoArticulos} onChange={handleChange}>
                        <option value="">{tSeleccione}</option>
                        {ESTADOS_ARTICULOS.map((estado) => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}
                      </select>
                      {errores.estadoArticulos ? <span className="mensaje-error"><ST>{errores.estadoArticulos}</ST></span> : null}
                    </div>
                  </div>
                  <div className="campo">
                    <label>
                      {tValor} <span className="req">*</span>
                    </label>
                    <div className="campo-prefijo">
                      <span className="campo-prefijo__simbolo">₡</span>
                      <input
                        type="text"
                        name="valorEstimado"
                        value={formulario.valorEstimado}
                        onChange={handleChange}
                        inputMode="decimal"
                      />
                    </div>
                    <span className="mensaje-info">{tValorHint}</span>
                    {errores.valorEstimado ? <span className="mensaje-error"><ST>{errores.valorEstimado}</ST></span> : null}
                  </div>
                  <div className="campo">
                    <label>
                      {tFotos} <span className="req">*</span>
                    </label>
                    <div
                      className={`donacion-dropzone${dropActivo ? " donacion-dropzone--activa" : ""}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click();
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDropActivo(true);
                      }}
                      onDragLeave={() => setDropActivo(false)}
                      onDrop={(event) => {
                        event.preventDefault();
                        setDropActivo(false);
                        agregarFotos(event.dataTransfer.files);
                      }}
                    >
                      <UploadCloud size={28} aria-hidden="true" />
                      <p>{tFotosCta}</p>
                      <small>{tFotosHint}</small>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      hidden
                      onChange={(event) => {
                        agregarFotos(event.target.files);
                        event.target.value = "";
                      }}
                    />
                    {fotos.length ? (
                      <div className="donacion-fotos">
                        {fotos.map((foto, index) => (
                          <div key={foto.id} className="donacion-fotos__item">
                            <button
                              type="button"
                              className="donacion-fotos__ver"
                              onClick={() => setFotoVista(index)}
                              aria-label="Ver imagen más grande"
                            >
                              <img src={foto.preview} alt="" />
                            </button>
                            <button
                              type="button"
                              className="donacion-fotos__quitar"
                              onClick={(event) => {
                                event.stopPropagation();
                                quitarFoto(foto.id);
                              }}
                              aria-label="Quitar imagen"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {errores.fotos ? <span className="mensaje-error"><ST>{errores.fotos}</ST></span> : null}
                  </div>
                </SectionCard>

                <SectionCard paso={3} icon={MapPin} title={tUbicacion} hint={tUbicacionHint}>
                  <div className="form-grid">
                    <div className="campo">
                      <label>
                        {tProvincia} <span className="req">*</span>
                      </label>
                      <select name="provincia" value={formulario.provincia} onChange={handleChange}>
                        <option value="">{tSeleccione}</option>
                        {PROVINCIAS_CR.map((provincia) => (
                          <option key={provincia} value={provincia}>{provincia}</option>
                        ))}
                      </select>
                      {errores.provincia ? <span className="mensaje-error"><ST>{errores.provincia}</ST></span> : null}
                    </div>
                    <div className="campo">
                      <label>
                        {tCanton} <span className="req">*</span>
                      </label>
                      <select name="canton" value={formulario.canton} onChange={handleChange} disabled={!formulario.provincia}>
                        <option value="">{tSeleccione}</option>
                        {cantonesDisponibles.map((canton) => (
                          <option key={canton} value={canton}>{canton}</option>
                        ))}
                      </select>
                      {errores.canton ? <span className="mensaje-error"><ST>{errores.canton}</ST></span> : null}
                    </div>
                    <div className="campo">
                      <label>
                        {tDistrito} <span className="req">*</span>
                      </label>
                      <select name="distrito" value={formulario.distrito} onChange={handleChange} disabled={!formulario.canton}>
                        <option value="">{tSeleccione}</option>
                        {distritosDisponibles.map((distrito) => (
                          <option key={distrito} value={distrito}>{distrito}</option>
                        ))}
                      </select>
                      {errores.distrito ? <span className="mensaje-error"><ST>{errores.distrito}</ST></span> : null}
                    </div>
                  </div>
                  <div className="campo">
                    <label>
                      {tSeñas} <span className="req">*</span>
                    </label>
                    <textarea
                      name="direccion"
                      rows={3}
                      value={formulario.direccion}
                      onChange={handleChange}
                      maxLength={500}
                    />
                    {errores.direccion ? <span className="mensaje-error"><ST>{errores.direccion}</ST></span> : null}
                  </div>
                </SectionCard>

                <SectionCard paso={4} icon={Truck} title={tLogistica} hint={tLogisticaHint}>
                  <div className="campo">
                    <p className="campo-pregunta">
                      {tMetodo} <span className="req">*</span>
                    </p>
                    <div className="donacion-entrega">
                      <label className="donacion-entrega__card">
                        <input
                          type="radio"
                          name="metodoEntrega"
                          value="entrega"
                          checked={formulario.metodoEntrega === "entrega"}
                          onChange={handleChange}
                        />
                        <span>
                          <strong>{tEntregaTitulo}</strong>
                          <span>{tEntregaDesc}</span>
                        </span>
                      </label>
                      <label className="donacion-entrega__card">
                        <input
                          type="radio"
                          name="metodoEntrega"
                          value="recoleccion"
                          checked={formulario.metodoEntrega === "recoleccion"}
                          onChange={handleChange}
                        />
                        <span>
                          <strong>{tRecoleccionTitulo}</strong>
                          <span>{tRecoleccionDesc}</span>
                        </span>
                      </label>
                    </div>
                    {errores.metodoEntrega ? <span className="mensaje-error"><ST>{errores.metodoEntrega}</ST></span> : null}
                  </div>
                  {pideRecoleccion ? (
                    <p className="donacion-aviso-recoleccion">{tRecoleccionAviso}</p>
                  ) : null}
                  {pideEntrega ? (
                    <>
                      {cargandoFechasRecepcion ? (
                        <div className="voluntariado-aviso-bloque">
                          <div className="size-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mb-2" />
                          <p className="voluntariado-aviso-bloque__texto">
                            <ST>Consultando fechas de recepción disponibles...</ST>
                          </p>
                        </div>
                      ) : fechasRecepcionDates.length === 0 ? (
                        <div className="voluntariado-aviso-bloque">
                          <CalendarX2 className="voluntariado-aviso-bloque__icono size-8 text-amber-500" />
                          <p className="voluntariado-aviso-bloque__titulo text-amber-900">
                            <ST>Sin fechas de recepción configuradas</ST>
                          </p>
                          <p className="voluntariado-aviso-bloque__texto text-amber-700">
                            <ST>Por ahora no hay días habilitados para entregar donaciones en el centro de acopio. Puede solicitar recolección o consultar más adelante.</ST>
                          </p>
                        </div>
                      ) : (
                        <div className="campo full flex flex-col items-center">
                          <label className="self-start">
                            {tDiaEntregaEntrega}{" "}
                            <span className="req">*</span>
                          </label>
                          {fechaEntregaSeleccionada ? (
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-900 bg-white px-5 py-2 shadow-xs">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                <ST>FECHA SELECCIONADA:</ST>
                              </span>
                              <span className="text-xs font-bold text-slate-950 capitalize">
                                {format(fechaEntregaSeleccionada, "EEEE, dd 'de' MMMM 'de' yyyy", {
                                  locale: localeCalendario,
                                })}
                              </span>
                            </div>
                          ) : null}
                          <div className="flex justify-center my-1 w-full">
                            <Calendar
                              mode="single"
                              selected={fechaEntregaSeleccionada || undefined}
                              onSelect={(date) => {
                                const iso = date ? format(date, "yyyy-MM-dd") : "";
                                setFormulario((prev) => ({
                                  ...prev,
                                  fechaEntrega: iso,
                                  horaEntrega: "",
                                }));
                                limpiarError("fechaEntrega");
                                limpiarError("horaEntrega");
                              }}
                              disabled={isFechaRecepcionDisabled}
                              locale={localeCalendario}
                              modifiers={{ habilitado: fechasRecepcionDates }}
                              modifiersClassNames={{ habilitado: "rdp-day-habilitado" }}
                              captionLayout="dropdown"
                            />
                          </div>
                          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 mt-4 pt-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex size-5 items-center justify-center rounded-full border-2 border-slate-950 bg-white font-bold text-slate-950 text-[11px]">
                                15
                              </span>
                              <span><ST>Fecha disponible para recibir donaciones</ST></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex size-5 items-center justify-center text-slate-400 opacity-40 text-[11px]">
                                15
                              </span>
                              <span><ST>Fecha no disponible</ST></span>
                            </div>
                          </div>
                          {errores.fechaEntrega ? (
                            <span className="mensaje-error text-center block w-full mt-2">
                              <ST>{errores.fechaEntrega}</ST>
                            </span>
                          ) : null}
                        </div>
                      )}

                      {!formulario.fechaEntrega ? (
                        <div className="voluntariado-aviso-bloque mt-4">
                          <CalendarDays className="voluntariado-aviso-bloque__icono size-8" />
                          <p className="voluntariado-aviso-bloque__titulo">
                            <ST>Seleccione una fecha en el calendario</ST>
                          </p>
                          <p className="voluntariado-aviso-bloque__texto">
                            <ST>Al elegir un día habilitado se mostrarán los horarios de recepción de ese día.</ST>
                          </p>
                        </div>
                      ) : (
                        <div className="campo full mt-4">
                          <p className="text-xs font-semibold text-slate-700 mb-3">
                            {tHorarios} <span className="req">*</span>
                          </p>
                          <div className="opciones-disponibilidad-grid">
                            {horariosRecepcionParaFecha.map((horarioStr) => {
                              const esActivo = formulario.horaEntrega === horarioStr;
                              return (
                                <label
                                  key={horarioStr}
                                  className={`opcion-disponibilidad-card ${
                                    esActivo ? "opcion-disponibilidad-card--activa" : ""
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="horaEntrega"
                                    value={horarioStr}
                                    checked={esActivo}
                                    onChange={() => {
                                      setFormulario((prev) => ({ ...prev, horaEntrega: horarioStr }));
                                      limpiarError("horaEntrega");
                                    }}
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
                          {errores.horaEntrega ? (
                            <span className="mensaje-error mt-2 block">
                              <ST>{errores.horaEntrega}</ST>
                            </span>
                          ) : null}
                        </div>
                      )}
                      <span className="mensaje-info">{tHorariosHint}</span>
                    </>
                  ) : null}
                </SectionCard>

                <SectionCard paso={5} icon={FileText} title={tDeclaracion} hint={tDeclaracionHint}>
                  <div className="campo">
                    <label>{tFecha}</label>
                    <input
                      type="date"
                      name="fechaSolicitud"
                      value={formulario.fechaSolicitud}
                      readOnly
                      disabled
                      className="donacion-fecha-fija"
                    />
                  </div>
                  <div className="donacion-checks">
                    <label>
                      <input
                        type="checkbox"
                        name="declaraOrigen"
                        checked={formulario.declaraOrigen}
                        onChange={handleChange}
                      />
                      <span>
                        {tOrigen} <span className="req">*</span>
                      </span>
                    </label>
                    {errores.declaraOrigen ? <span className="mensaje-error"><ST>{errores.declaraOrigen}</ST></span> : null}
                    <label>
                      <input
                        type="checkbox"
                        name="aceptaPrivacidad"
                        checked={formulario.aceptaPrivacidad}
                        onChange={handleChange}
                      />
                      <span>
                        {tPrivacidad} <span className="req">*</span>
                      </span>
                    </label>
                    {errores.aceptaPrivacidad ? <span className="mensaje-error"><ST>{errores.aceptaPrivacidad}</ST></span> : null}
                  </div>
                </SectionCard>
              </div>

              {errorApi ? <p className="form-error" role="alert" data-form-error><ST>{errorApi}</ST></p> : null}

              {!usuario ? (
                <div className="auth-banner">
                  <Lock size={20} strokeWidth={2} className="auth-banner__icon" />
                  <div className="auth-banner__content">
                    <p className="auth-banner__text">{tLoginMsg}</p>
                    <Link
                      to="/login"
                      className="auth-banner__link"
                      onClick={() => sessionStorage.setItem("postLoginRedirect", DONACION_LOGIN_REDIRECT)}
                    >
                      {tLoginLink}
                    </Link>
                  </div>
                </div>
              ) : null}

              <div className="acciones-formulario acciones-formulario--split">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() => navigate({ to: "/" })}
                >
                  {tCancelar}
                </button>
                <button
                  type="submit"
                  className="btn-enviar btn-enviar--compacto"
                  disabled={enviando || !usuario}
                >
                  <Send size={16} aria-hidden="true" />
                  {enviando ? tEnviando : !usuario ? tLoginBtn : tEnviar}
                </button>
              </div>
            </form>

          <section className="donacion-faq" aria-labelledby="donacion-faq-titulo">
            <h2 id="donacion-faq-titulo">
              <HelpCircle size={18} aria-hidden="true" /> {tFaqTitulo}
            </h2>
            <details>
              <summary><ST>¿Qué puedo donar?</ST></summary>
              <p>
                <ST>
                  Únicamente donaciones materiales: bienes, equipos, herramientas e insumos físicos. Revise las categorías activas y los materiales aceptados que aparecen al inicio de esta página.
                </ST>
              </p>
            </details>
            <details>
              <summary><ST>¿Puedo donar dinero?</ST></summary>
              <p>
                <ST>No. Este módulo está destinado únicamente a donaciones materiales.</ST>
              </p>
            </details>
            <details>
              <summary><ST>¿Qué sucede si el artículo que deseo donar no aparece?</ST></summary>
              <p>
                <ST>
                  Las categorías mostradas corresponden a las necesidades actuales del proyecto. Si su artículo no figura, puede comunicarse con Café UNA por los medios institucionales publicados en el sitio.
                </ST>
              </p>
            </details>
            <details>
              <summary><ST>¿Pueden recoger mi donación?</ST></summary>
              <p>
                <ST>
                  Puede solicitar una recolección, pero está sujeta a evaluación y disponibilidad de personal, vehículo, ubicación y características de los artículos. No se aprueba de forma automática.
                </ST>
              </p>
            </details>
            <details>
              <summary><ST>¿Cómo sabré si mi donación fue aceptada?</ST></summary>
              <p>
                <ST>
                  La solicitud será revisada por el personal de Café UNA y se le notificará el resultado mediante correo electrónico.
                </ST>
              </p>
            </details>
          </section>
            </>
          ) : (
            <div className="confirmacion">
              <div className="confirmacion__icono">
                <Check size={28} strokeWidth={2.2} aria-hidden="true" />
              </div>
              <h2><ST>Solicitud enviada correctamente</ST></h2>
              <p>
                <ST>
                  Recibimos tu solicitud de donación en estado Pendiente. El equipo de Café UNA la revisará y te notificará el resultado por correo electrónico.
                </ST>
              </p>
              <button type="button" className="btn-enviar" onClick={() => setEnviado(false)}>
                <ST>Realizar otra solicitud</ST>
              </button>
            </div>
          )}
        </section>
      </main>
      <ImageLightbox
        images={fotos.map((foto) => foto.preview)}
        index={fotoVista}
        onClose={() => setFotoVista(null)}
        onIndexChange={setFotoVista}
        alt="Fotografía de la donación"
      />
    </>
  );
}
