import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { Package, UploadCloud, X } from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import BackToHomeLink from "../../Components/BackToHomeLink/BackToHomeLink";
import AvisoSedeFinca from "../../Components/AvisoSedeFinca/AvisoSedeFinca";
import { NumericInput } from "../../Components/NumericInput/NumericInput";
import { PublicPageHeader } from "../../Components/Public/PublicPageHeader";
import {
  CalendarPicker,
  ChoiceCard,
  ChoiceGroup,
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
import { getActiveSessionUser } from "../../services/sessionService";
import { consultarCedulaDetallada } from "../../services/cedulaService";
import {
  enviarSolicitudDonacion,
  obtenerFechasRecepcionDisponibles,
  obtenerNecesidadesPublicas,
} from "../../services/donacionesService";
import { obtenerSeccion } from "../../services/informacionService";
import { sedeDesdeHomeLocation, SEDE_FINCA_NOMBRE } from "../../lib/sedeFinca";
import { useIdioma } from "../../lib/useIdioma";
import { queueFocusFormError } from "../../lib/formFocus";
import { filtrarEnteros } from "../../lib/numericInput";
import {
  limitarPalabras,
  MAX_PALABRAS_TITULO,
} from "../../lib/formLimits";
import { useTraducir } from "../../hooks/useTraducir";
import { useCatalogo } from "../../hooks/useCatalogo";
import { TIPOS_CATALOGO } from "../../services/catalogosService";
import { ST } from "../../Components/T/ST";
import { SelectFiltro } from "../../Components/ui/SelectFiltro";
import { ImageLightbox } from "../../Components/ImageLightbox/ImageLightbox";
import {
  cantonesDeProvincia,
  distritosDeCanton,
  PROVINCIAS_CR,
} from "../../lib/costaRicaDivisiones";
import { asegurarCamposEnEspanol } from "../../lib/traducir";
import { obtenerOpcionesPaises } from "../../lib/paises";
import {
  digitosConsultables,
  esperaConsultaIdentificacion,
  LIMITE_IDENTIFICACION,
  limpiarIdentificacion,
  placeholderIdentificacion,
  validarIdentificacion,
} from "../../lib/identificacionPersona";
import "./SolicitarDonacion.css";

/** Respaldo si no carga el catálogo de Ajustes. */
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
  tipoDocumento: "cedula",
  nacionalidad: "",
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

function leerComoDataUrl(file) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(new Error("No se pudo leer la imagen."));
    lector.readAsDataURL(file);
  });
}

async function comprimirFoto(file) {
  const origen = await leerComoDataUrl(file);
  const imagen = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo leer la imagen."));
    img.src = origen;
  });
  const max = 720;
  const escala = Math.min(1, max / Math.max(imagen.width, imagen.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(imagen.width * escala));
  canvas.height = Math.max(1, Math.round(imagen.height * escala));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");
  ctx.drawImage(imagen, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
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
  const estadosArticulos = useCatalogo(TIPOS_CATALOGO.estadoArticulo, ESTADOS_ARTICULOS);
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const search = useRouterState({ select: (state) => state.location.search });
  const necesidadInicial = leerNecesidadDesdeUrl(params, search);

  const tTitulo = useTraducir("Solicitud de donación");
  const tSub = useTraducir("Contanos qué querés donar y cómo preferís entregarlo.");
  const tCedula = useTraducir("Cédula");
  const tDimex = useTraducir("DIMEX");
  const tPasaporte = useTraducir("Pasaporte");
  const tElegiPais = useTraducir("Elegí el país");
  const tPhNombre = useTraducir("Nombre");
  const tPh1 = useTraducir("1° Apellido");
  const tPh2 = useTraducir("2° Apellido");
  const tPhId = useTraducir("Cédula, jurídica o pasaporte");
  const tRazonSocial = useTraducir("Razón social");
  const tConsultando = useTraducir("Consultando...");
  const tPhCantidad = useTraducir("3 cajas, 5 unidades");
  const tSeleccione = useTraducir("Elegí una opción");
  const tFotosHint = useTraducir("JPG, PNG o WEBP. Máximo 5 imágenes de 10 MB cada una.");
  const tFotosCta = useTraducir("Arrastrá las fotos acá o tocá para elegirlas");
  const tEntregaDesc = useTraducir(`Llevaré los artículos a la ${SEDE_FINCA_NOMBRE}.`);
  const tRecoleccionDesc = useTraducir("La organización evaluará si puede recoger la donación.");
  const tHorariosHint = useTraducir(
    `Elegí un día habilitado y uno de los turnos en los que la ${SEDE_FINCA_NOMBRE} recibe donaciones.`,
  );
  const tRecoleccionAviso = useTraducir(
    "La solicitud de recolección está sujeta a disponibilidad de personal, vehículo institucional, ubicación, cantidad y características de los artículos. Elegir esta opción no garantiza que la recolección sea aprobada.",
  );
  const tIntro = useTraducir(
    "En Café UNA recibimos donaciones de materiales, equipos, herramientas e insumos que puedan contribuir al desarrollo de las actividades del proyecto. Antes de completar la solicitud, revisá las categorías y materiales que necesitamos actualmente.",
  );
  const tOrigen = useTraducir("Certifico que los artículos son de mi propiedad y de origen lícito.");
  const tPrivacidad = useTraducir("Acepto la Política de privacidad.");
  const tEnviar = useTraducir("Enviar solicitud");
  const tEnviando = useTraducir("Enviando...");
  const tLoginBtn = useTraducir("Iniciá sesión para enviar");
  const { idioma } = useIdioma();
  const localeCalendario = idioma === "en" ? enUS : es;

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
  const [sedeFinca, setSedeFinca] = useState(() => sedeDesdeHomeLocation(null));

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
  useLayoutEffect(() => {
    fotosRef.current = fotos;
  });
  const esPersona = formulario.tipoDonante === "persona";
  const tipoDocumento = formulario.tipoDocumento;
  const tPhIdentificacion = useTraducir(placeholderIdentificacion(tipoDocumento));
  const esPasaporte = esPersona && tipoDocumento === "pasaporte";
  const etiquetaDocumento = tipoDocumento === "dimex" ? tDimex : tipoDocumento === "pasaporte" ? tPasaporte : tCedula;
  const opcionesPais = useMemo(() => obtenerOpcionesPaises(idioma), [idioma]);
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
    if (!esPersona || !digitosConsultables(tipoDocumento, digitos)) return;
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
        setAvisoCedula("No se encontraron datos para esta identificación. Completá los datos manualmente.");
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
      setAvisoCedula("Datos cargados automáticamente. Podés editarlos si hace falta.");
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
      const mensajeBase = error?.message?.trim() || "No se pudo consultar la identificación.";
      const yaIndicaManual = /manualmente|completar el nombre/i.test(mensajeBase);
      const esConexion = error?.cause?.code === "ERR_NETWORK" || /conectar con el servidor/i.test(mensajeBase);
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
  }, [esPersona, tipoDocumento]);

  useEffect(() => {
    if (!esPersona) return;
    const digitos = digitosConsultables(tipoDocumento, formulario.identificacion);
    if (!digitos) return;
    if (consultaCedulaRef.current.enCurso) return;
    if (consultaCedulaRef.current.digitos === digitos) return;
    const timeoutId = window.setTimeout(() => {
      consultarDatosCedula(digitos);
    }, esperaConsultaIdentificacion(tipoDocumento));
    return () => window.clearTimeout(timeoutId);
  }, [formulario.identificacion, esPersona, tipoDocumento, consultarDatosCedula]);

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
      } else {
        valor = String(valor).slice(0, 30);
      }
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
      tipoDocumento: "cedula",
      nacionalidad: "",
      identificacion: "",
    }));
    limpiarError("nombre");
    limpiarError("primerApellido");
    limpiarError("identificacion");
    limpiarError("nacionalidad");
  };

  const handleTipoDocumento = (event) => {
    const valor = event.target.value;
    consultaCedulaRef.current = { digitos: "", enCurso: false };
    setAvisoCedula(null);
    setFormulario((prev) => ({
      ...prev,
      tipoDocumento: valor,
      nacionalidad: valor === "pasaporte" ? prev.nacionalidad : "",
      identificacion: "",
      nombre: "",
      primerApellido: "",
      segundoApellido: "",
    }));
    limpiarError("identificacion");
    limpiarError("nacionalidad");
  };

  const handleIdentificacionBlur = async () => {
    if (!esPersona || esPasaporte || !formulario.identificacion) return;
    const digitos = digitosConsultables(tipoDocumento, formulario.identificacion);
    if (!digitos) {
      setAvisoCedula(validarIdentificacion(tipoDocumento, formulario.identificacion));
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
      if (!formulario.nombre.trim()) nuevos.nombre = "Ingresá el nombre";
      else if (formulario.nombre.trim().length < 2) nuevos.nombre = "Escribí al menos 2 caracteres";
      if (!formulario.primerApellido.trim()) nuevos.primerApellido = "Ingresá el primer apellido";
    } else if (!formulario.nombre.trim()) {
      nuevos.nombre = "Ingresá la razón social";
    }
    if (esPersona) {
      const errorIdentificacion = validarIdentificacion(tipoDocumento, formulario.identificacion);
      if (errorIdentificacion) nuevos.identificacion = errorIdentificacion;
      if (esPasaporte && !formulario.nacionalidad) {
        nuevos.nacionalidad = "Elegí el país de origen del pasaporte.";
      }
    } else if (!formulario.identificacion.trim()) {
      nuevos.identificacion = "Ingresá la identificación";
    }
    const correo = formulario.correo.trim();
    if (!correo) nuevos.correo = "Ingresá el correo electrónico";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) nuevos.correo = "Ingresá un correo electrónico válido";
    if (!formulario.telefono.trim()) nuevos.telefono = "Ingresá el teléfono";
    if (!formulario.categoriaId) nuevos.categoriaId = "Elegí la categoría de la donación";
    if (!formulario.materialId) nuevos.materialId = "Elegí el material o artículo";
    if (!formulario.descripcion.trim()) nuevos.descripcion = "Describí los artículos que querés donar";
    if (!formulario.cantidadEstimada.trim()) nuevos.cantidadEstimada = "Indicá la cantidad o volumen estimado";
    if (!formulario.estadoArticulos) nuevos.estadoArticulos = "Elegí el estado de los artículos";
    const valorNum = Number(String(formulario.valorEstimado).replace(/[^\d.]/g, ""));
    if (!formulario.valorEstimado.trim() || !Number.isFinite(valorNum) || valorNum <= 0) {
      nuevos.valorEstimado = "Indicá un valor estimado mayor a 0";
    }
    if (fotos.length < 1) nuevos.fotos = "Agregá al menos una fotografía";
    if (fotos.length > MAX_FOTOS) nuevos.fotos = "Máximo 5 imágenes.";
    if (!formulario.provincia) nuevos.provincia = "Elegí la provincia";
    if (!formulario.canton) nuevos.canton = "Elegí el cantón";
    if (!formulario.distrito) nuevos.distrito = "Elegí el distrito";
    if (!formulario.direccion.trim()) nuevos.direccion = "Indicá la dirección o señas";
    if (!formulario.metodoEntrega) nuevos.metodoEntrega = "Elegí el método de entrega";
    if (pideEntrega) {
      if (!formulario.fechaEntrega) {
        nuevos.fechaEntrega = "Elegí un día habilitado para entregar la donación";
      } else if (!fechasRecepcionMap.has(formulario.fechaEntrega)) {
        nuevos.fechaEntrega = "Esa fecha no está habilitada para recibir donaciones.";
      }
      if (!formulario.horaEntrega) {
        nuevos.horaEntrega = "Elegí un horario de recepción";
      } else if (
        horariosRecepcionParaFecha.length > 0 &&
        !horariosRecepcionParaFecha.includes(formulario.horaEntrega)
      ) {
        nuevos.horaEntrega = "Elegí un horario disponible para esa fecha";
      }
    }
    if (!formulario.declaraOrigen) nuevos.declaraOrigen = "Certificá el origen lícito de los artículos";
    if (!formulario.aceptaPrivacidad) nuevos.aceptaPrivacidad = "Aceptá la política de privacidad";
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
    const formEl = event.currentTarget;
    if (!usuario) {
      sessionStorage.setItem("postLoginRedirect", DONACION_LOGIN_REDIRECT);
      setErrorApi("Tenés que iniciar sesión antes de enviar una solicitud de donación.");
      queueFocusFormError({ root: formEl });
      return;
    }

    const nuevosErrores = validarFormulario();
    if (Object.keys(nuevosErrores).length > 0) {
      queueFocusFormError({
        errors: nuevosErrores,
        root: formEl,
        idPrefix: "donacion-",
        fieldOrder: [
          "nombre",
          "primerApellido",
          "identificacion",
          "nacionalidad",
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
          tipoIdentificacion: esPersona ? tipoDocumento : "juridica",
          numeroIdentificacion: formulario.identificacion.trim(),
          nacionalidad: esPasaporte ? formulario.nacionalidad : "",
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
      setErrorApi(err instanceof Error ? err.message : "Ocurrió un error al enviar la solicitud. Intentá de nuevo.");
      queueFocusFormError({ root: formEl });
    } finally {
      setEnviando(false);
    }
  };

  const placeholderCarga = (valor) => (consultandoCedula ? tConsultando : valor);
  const materialesActivosDe = (item) =>
    (item.materiales || []).filter((mat) => !mat.estado || mat.estado === "ACTIVA");

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

          <PublicPageHeader title={tTitulo} lead={tSub} titleId="donacion-titulo" />

          {!enviado ? (
            <>
              <div className="pub-panel pub-form donacion-intro">
                <FormSection
                  title="¿Qué donaciones recibimos?"
                  hint="Café UNA recibe únicamente donaciones materiales: bienes, equipos, herramientas e insumos físicos."
                >
                  <p className="donacion-intro__texto">{tIntro}</p>
                  {necesidades.length ? (
                    <ul className="donacion-intro__cats">
                      {necesidades.map((item) => (
                        <li key={item.id}>
                          <Package size={18} aria-hidden="true" />
                          <div>
                            <strong><ST>{item.titulo}</ST></strong>
                            {materialesActivosDe(item).length ? (
                              <span>
                                <ST>
                                  {materialesActivosDe(item)
                                    .slice(0, 4)
                                    .map((mat) => mat.nombre)
                                    .join(", ")}
                                </ST>
                              </span>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <FormNote>
                      <p>
                        <ST>Por ahora no hay categorías de donación material activas.</ST>
                      </p>
                    </FormNote>
                  )}
                </FormSection>
              </div>

              <form
                onSubmit={handleSubmit}
                className="pub-panel pub-form"
                noValidate
                aria-labelledby="donacion-titulo"
                onFocusCapture={handleFormInteractionCapture}
                onPointerDownCapture={handleFormInteractionCapture}
              >
                <FormSection title="Datos del donante">
                  <ChoiceGroup legend="¿Quién realizará la donación?" required columns={2}>
                    <ChoiceCard
                      name="tipoDonante"
                      value="persona"
                      checked={esPersona}
                      onChange={() => handleTipoDonante("persona")}
                      title="Persona"
                    />
                    <ChoiceCard
                      name="tipoDonante"
                      value="organizacion"
                      checked={!esPersona}
                      onChange={() => handleTipoDonante("organizacion")}
                      title="Organización"
                    />
                  </ChoiceGroup>

                  {/* Field ids (donacion-nombre, donacion-identificacion) repeat across the exclusive persona/organización and cédula/pasaporte branches; only one renders at a time. */}
                  <FormGrid>
                    {esPersona ? (
                      <>
                        <Field id="donacion-tipo-documento" label="Tipo de identificación" required>
                          {(c) => (
                            <SelectFiltro
                              {...c}
                              name="tipoDocumento"
                              value={tipoDocumento}
                              onChange={handleTipoDocumento}
                            >
                              <option value="cedula">{tCedula}</option>
                              <option value="dimex">{tDimex}</option>
                              <option value="pasaporte">{tPasaporte}</option>
                            </SelectFiltro>
                          )}
                        </Field>
                        {esPasaporte ? (
                          <Field
                            id="donacion-nacionalidad"
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
                          id="donacion-identificacion"
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
                        <Field id="donacion-nombre" label="Nombre" required error={errores.nombre}>
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
                          id="donacion-primerApellido"
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
                        <Field id="donacion-segundoApellido" label="Segundo apellido">
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
                      </>
                    ) : (
                      <>
                        <Field id="donacion-nombre" label="Razón social" required error={errores.nombre}>
                          {(c) => (
                            <input
                              {...c}
                              className="pub-input"
                              type="text"
                              name="nombre"
                              placeholder={tRazonSocial}
                              value={formulario.nombre}
                              onChange={handleChange}
                              maxLength={160}
                            />
                          )}
                        </Field>
                        <Field
                          id="donacion-identificacion"
                          label="Identificación"
                          required
                          error={errores.identificacion}
                        >
                          {(c) => (
                            <input
                              {...c}
                              className="pub-input"
                              type="text"
                              name="identificacion"
                              placeholder={tPhId}
                              value={formulario.identificacion}
                              onChange={handleChange}
                              maxLength={30}
                              autoComplete="off"
                            />
                          )}
                        </Field>
                      </>
                    )}
                    <Field id="donacion-correo" label="Correo electrónico" required error={errores.correo}>
                      {(c) => (
                        <input
                          {...c}
                          className="pub-input"
                          type="email"
                          name="correo"
                          value={formulario.correo}
                          onChange={handleChange}
                          placeholder="ejemplo@correo.com"
                        />
                      )}
                    </Field>
                    <Field id="donacion-telefono" label="Teléfono" required error={errores.telefono}>
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

                  {esPersona ? (
                    <div aria-live="polite">
                      {consultandoCedula ? (
                        <p className="pub-form-status">
                          <ST>Consultando datos de la identificación...</ST>
                        </p>
                      ) : avisoCedula ? (
                        <p
                          className={`pub-form-status ${
                            esAvisoCedulaInformativo(avisoCedula)
                              ? "pub-form-status--ok"
                              : "pub-form-status--problem"
                          }`}
                        >
                          <ST>{avisoCedula}</ST>
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </FormSection>

                <FormSection title="Detalles de la donación" hint="Contanos sobre los artículos que querés donar.">
                  <FormGrid>
                    <Field
                      id="donacion-categoriaId"
                      label="Categoría de la donación"
                      required
                      error={errores.categoriaId}
                    >
                      {(c) => (
                        <SelectFiltro {...c} name="categoriaId" value={formulario.categoriaId} onChange={handleChange}>
                          <option value="">{tSeleccione}</option>
                          {necesidades.map((item) => (
                            <option key={item.id} value={String(item.id)}>
                              {item.titulo}
                            </option>
                          ))}
                        </SelectFiltro>
                      )}
                    </Field>
                    <Field
                      id="donacion-materialId"
                      label="Material o artículo"
                      required
                      error={errores.materialId}
                    >
                      {(c) => (
                        <SelectFiltro
                          {...c}
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
                        </SelectFiltro>
                      )}
                    </Field>
                  </FormGrid>

                  <Field
                    id="donacion-descripcion"
                    label="Descripción detallada de los artículos"
                    required
                    error={errores.descripcion}
                  >
                    {(c) => (
                      <>
                        <textarea
                          {...c}
                          className="pub-textarea"
                          name="descripcion"
                          rows={4}
                          value={formulario.descripcion}
                          onChange={handleChange}
                          maxLength={MAX_DESCRIPCION}
                        />
                        <p className="pub-field__counter">
                          {formulario.descripcion.length}/{MAX_DESCRIPCION}
                        </p>
                      </>
                    )}
                  </Field>

                  <FormGrid>
                    <Field
                      id="donacion-cantidadEstimada"
                      label="Cantidad o volumen estimado"
                      required
                      error={errores.cantidadEstimada}
                    >
                      {(c) => (
                        <input
                          {...c}
                          className="pub-input"
                          type="text"
                          name="cantidadEstimada"
                          value={formulario.cantidadEstimada}
                          onChange={handleChange}
                          placeholder={tPhCantidad}
                          maxLength={120}
                        />
                      )}
                    </Field>
                    <Field
                      id="donacion-estadoArticulos"
                      label="Estado de los artículos"
                      required
                      error={errores.estadoArticulos}
                    >
                      {(c) => (
                        <SelectFiltro
                          {...c}
                          name="estadoArticulos"
                          value={formulario.estadoArticulos}
                          onChange={handleChange}
                        >
                          <option value="">{tSeleccione}</option>
                          {estadosArticulos.map((estado) => (
                            <option key={estado} value={estado}>
                              {estado}
                            </option>
                          ))}
                        </SelectFiltro>
                      )}
                    </Field>
                    <Field
                      id="donacion-valorEstimado"
                      label="Valor estimado de la donación"
                      required
                      hint="Indicá el valor aproximado total de los artículos que ofrecés."
                      error={errores.valorEstimado}
                      wide
                    >
                      {(c) => (
                        <div className="pub-input-affix">
                          <span className="pub-input-affix__symbol" aria-hidden="true">₡</span>
                          <input
                            {...c}
                            className="pub-input"
                            type="text"
                            name="valorEstimado"
                            value={formulario.valorEstimado}
                            onChange={handleChange}
                            inputMode="decimal"
                          />
                        </div>
                      )}
                    </Field>
                  </FormGrid>

                  <Field
                    id="donacion-fotos"
                    label="Fotografías de los artículos"
                    required
                    hint={tFotosHint}
                    error={errores.fotos}
                  >
                    {(c) => (
                      <>
                        <div
                          className={`pub-dropzone${dropActivo ? " pub-dropzone--dragging" : ""}`}
                          role="button"
                          tabIndex={0}
                          data-error-field="fotos"
                          aria-invalid={c["aria-invalid"]}
                          aria-describedby={c["aria-describedby"]}
                          onClick={() => fileInputRef.current?.click()}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              fileInputRef.current?.click();
                            }
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
                          <UploadCloud size={24} aria-hidden="true" />
                          <span className="pub-dropzone__title">{tFotosCta}</span>
                        </div>
                        <input
                          id={c.id}
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
                          <ul className="donacion-fotos">
                            {fotos.map((foto, index) => (
                              <li key={foto.id} className="donacion-fotos__item">
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
                                  <X size={16} aria-hidden="true" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </>
                    )}
                  </Field>
                </FormSection>

                <FormSection title="Ubicación de la donación" hint="Indicá dónde se encuentran físicamente los artículos.">
                  <FormGrid cols={3}>
                    <Field id="donacion-provincia" label="Provincia" required error={errores.provincia}>
                      {(c) => (
                        <SelectFiltro {...c} name="provincia" value={formulario.provincia} onChange={handleChange}>
                          <option value="">{tSeleccione}</option>
                          {PROVINCIAS_CR.map((provincia) => (
                            <option key={provincia} value={provincia}>{provincia}</option>
                          ))}
                        </SelectFiltro>
                      )}
                    </Field>
                    <Field id="donacion-canton" label="Cantón" required error={errores.canton}>
                      {(c) => (
                        <SelectFiltro
                          {...c}
                          name="canton"
                          value={formulario.canton}
                          onChange={handleChange}
                          disabled={!formulario.provincia}
                        >
                          <option value="">{tSeleccione}</option>
                          {cantonesDisponibles.map((canton) => (
                            <option key={canton} value={canton}>{canton}</option>
                          ))}
                        </SelectFiltro>
                      )}
                    </Field>
                    <Field id="donacion-distrito" label="Distrito" required error={errores.distrito}>
                      {(c) => (
                        <SelectFiltro
                          {...c}
                          name="distrito"
                          value={formulario.distrito}
                          onChange={handleChange}
                          disabled={!formulario.canton}
                        >
                          <option value="">{tSeleccione}</option>
                          {distritosDisponibles.map((distrito) => (
                            <option key={distrito} value={distrito}>{distrito}</option>
                          ))}
                        </SelectFiltro>
                      )}
                    </Field>
                  </FormGrid>
                  <Field
                    id="donacion-direccion"
                    label="Dirección o señas adicionales"
                    required
                    error={errores.direccion}
                  >
                    {(c) => (
                      <textarea
                        {...c}
                        className="pub-textarea"
                        name="direccion"
                        rows={3}
                        value={formulario.direccion}
                        onChange={handleChange}
                        maxLength={500}
                      />
                    )}
                  </Field>
                </FormSection>

                <FormSection title="Logística de entrega" hint="Indicá cómo preferís entregar los artículos.">
                  <ChoiceGroup
                    legend="Método de entrega preferido"
                    required
                    columns={2}
                    error={errores.metodoEntrega}
                  >
                    <ChoiceCard
                      name="metodoEntrega"
                      value="entrega"
                      checked={formulario.metodoEntrega === "entrega"}
                      onChange={handleChange}
                      title="Lo entregaré personalmente"
                      description={tEntregaDesc}
                    />
                    <ChoiceCard
                      name="metodoEntrega"
                      value="recoleccion"
                      checked={formulario.metodoEntrega === "recoleccion"}
                      onChange={handleChange}
                      title="Solicito recolección"
                      description={tRecoleccionDesc}
                    />
                  </ChoiceGroup>

                  {pideRecoleccion ? (
                    <FormNote>
                      <p>{tRecoleccionAviso}</p>
                    </FormNote>
                  ) : null}

                  {pideEntrega ? (
                    <>
                      <FormNote>
                        <p>{tHorariosHint}</p>
                      </FormNote>

                      {cargandoFechasRecepcion ? (
                        <FormPlaceholder loading title="Consultando fechas de recepción disponibles..." />
                      ) : fechasRecepcionDates.length === 0 ? (
                        <FormPlaceholder title="Sin fechas de recepción configuradas">
                          Por ahora no hay días habilitados para entregar donaciones en la Finca Experimental Santa Lucía. Podés solicitar recolección o consultar más adelante.
                        </FormPlaceholder>
                      ) : (
                        <div className="pub-field">
                          <span id="donacion-dia-entrega" className="pub-field__label">
                            <ST>Día de entrega</ST>
                            <span className="pub-field__req" aria-hidden="true"> *</span>
                          </span>
                          <div>
                            <CalendarPicker
                              id="donacion-fechaEntrega"
                              label="Calendario de fechas de recepción"
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
                              enabledDates={fechasRecepcionDates}
                              legend="Fecha disponible para recibir donaciones"
                              invalid={Boolean(errores.fechaEntrega)}
                              describedBy={errores.fechaEntrega ? "donacion-fecha-error" : undefined}
                            />
                          </div>
                          <FieldError id="donacion-fecha-error">{errores.fechaEntrega}</FieldError>
                        </div>
                      )}

                      {!formulario.fechaEntrega ? (
                        <FormPlaceholder title="Elegí una fecha en el calendario">
                          Al elegir un día habilitado vas a ver los horarios de recepción de ese día.
                        </FormPlaceholder>
                      ) : horariosRecepcionParaFecha.length === 0 ? (
                        <FormPlaceholder title="Sin horarios para esta fecha">
                          Elegí otro día habilitado para ver los horarios de recepción.
                        </FormPlaceholder>
                      ) : (
                        <ChoiceGroup
                          legend="Horario de recepción"
                          required
                          slots
                          error={errores.horaEntrega}
                        >
                          {horariosRecepcionParaFecha.map((horarioStr) => (
                            <ChoiceCard
                              key={horarioStr}
                              variant="slot"
                              name="horaEntrega"
                              value={horarioStr}
                              checked={formulario.horaEntrega === horarioStr}
                              onChange={() => {
                                setFormulario((prev) => ({ ...prev, horaEntrega: horarioStr }));
                                limpiarError("horaEntrega");
                              }}
                              title={horarioStr}
                            />
                          ))}
                        </ChoiceGroup>
                      )}
                    </>
                  ) : null}
                </FormSection>

                <FormSection
                  title="Declaración y confirmación"
                  hint="Revisá la información y aceptá los términos para completar tu solicitud."
                >
                  <FormGrid>
                    <Field id="donacion-fechaSolicitud" label="Fecha de la solicitud">
                      {(c) => (
                        <input
                          {...c}
                          className="pub-input"
                          type="date"
                          name="fechaSolicitud"
                          value={formulario.fechaSolicitud}
                          readOnly
                          disabled
                        />
                      )}
                    </Field>
                  </FormGrid>
                  <ChoiceGroup label="Declaraciones" type="checkbox" columns={1}>
                    <div className="donacion-declaracion">
                      <ChoiceCard
                        type="checkbox"
                        name="declaraOrigen"
                        checked={formulario.declaraOrigen}
                        onChange={handleChange}
                        title={
                          <>
                            {tOrigen}
                            <span className="pub-field__req" aria-hidden="true"> *</span>
                          </>
                        }
                        aria-invalid={errores.declaraOrigen ? "true" : undefined}
                        aria-describedby={errores.declaraOrigen ? "donacion-declaraOrigen-error" : undefined}
                      />
                      <FieldError id="donacion-declaraOrigen-error">{errores.declaraOrigen}</FieldError>
                    </div>
                    <div className="donacion-declaracion">
                      <ChoiceCard
                        type="checkbox"
                        name="aceptaPrivacidad"
                        checked={formulario.aceptaPrivacidad}
                        onChange={handleChange}
                        title={
                          <>
                            {tPrivacidad}
                            <span className="pub-field__req" aria-hidden="true"> *</span>
                          </>
                        }
                        aria-invalid={errores.aceptaPrivacidad ? "true" : undefined}
                        aria-describedby={
                          errores.aceptaPrivacidad ? "donacion-aceptaPrivacidad-error" : undefined
                        }
                      />
                      <FieldError id="donacion-aceptaPrivacidad-error">{errores.aceptaPrivacidad}</FieldError>
                    </div>
                  </ChoiceGroup>
                </FormSection>

                <AvisoSedeFinca sede={sedeFinca} contexto="donacion" />

                <FormAlert>{errorApi}</FormAlert>

                <SubmitFooter
                  label={!usuario ? tLoginBtn : tEnviar}
                  busyLabel={tEnviando}
                  busy={enviando}
                  disabled={!usuario}
                />
              </form>
            </>
          ) : (
            <FormSuccess
              title="Solicitud enviada"
              summary="Recibimos tu solicitud de donación en estado Pendiente. El equipo de Café UNA la va a revisar y te avisamos el resultado por correo electrónico."
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
