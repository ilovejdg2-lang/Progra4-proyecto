import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import {
  Check,
  FileText,
  Lock,
  Package,
  Phone,
  Send,
  Truck,
  UploadCloud,
  User,
} from "lucide-react";
import BackToHomeLink from "../../Components/BackToHomeLink/BackToHomeLink";
import { NumericInput } from "../../Components/NumericInput/NumericInput";
import { HOME_SCROLL_SECTIONS } from "../../lib/homeScrollTarget";
import PageLoading from "../../Components/PageLoading/PageLoading";
import { usePaintPublicPage } from "../../hooks/usePaintPublicPage";
import { getActiveSessionUser } from "../../services/sessionService";
import { consultarCedulaDetallada } from "../../services/cedulaService";
import {
  enviarSolicitudDonacion,
  obtenerNecesidadesPublicas,
} from "../../services/donacionesService";
import { queueFocusFormError } from "../../lib/formFocus";
import { filtrarEnteros } from "../../lib/numericInput";
import {
  limitarPalabras,
  MAX_PALABRAS_TITULO,
} from "../../lib/formLimits";
import { useTraducir } from "../../hooks/useTraducir";
import { ST } from "../../Components/T/ST";
import { ImageLightbox } from "../../Components/ImageLightbox/ImageLightbox";
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
const CATEGORIA_OTRA = "__otra__";
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
  categoriaOtra: "",
  descripcion: "",
  cantidadEstimada: "",
  estadoArticulos: "",
  metodoEntrega: "",
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

function esFinDeSemana(iso) {
  const fecha = parseIsoLocal(iso);
  if (!fecha) return false;
  const dia = fecha.getDay();
  return dia === 0 || dia === 6;
}

function proximoDiaHabilIso(base = new Date()) {
  const fecha = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  while (fecha.getDay() === 0 || fecha.getDay() === 6) {
    fecha.setDate(fecha.getDate() + 1);
  }
  return isoLocal(fecha);
}

function minutosDeHora(valor) {
  const partes = String(valor || "").split(":");
  const horas = Number(partes[0]);
  const minutos = Number(partes[1]);
  if (!Number.isFinite(horas) || !Number.isFinite(minutos)) return null;
  return horas * 60 + minutos;
}

const HORA_MINIMA = 8 * 60;
const HORA_MAXIMA = 17 * 60;

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
    "Tu apoyo nos ayuda a seguir creando un impacto positivo. Completa el formulario para registrar tu donación.",
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
  const tOtra = useTraducir("Otra");
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
  const tRecoleccionTitulo = useTraducir("Solicito la recolección a domicilio");
  const tRecoleccionDesc = useTraducir("La organización se encargará de recoger la donación.");
  const tDireccion = useTraducir("Dirección de recolección");
  const tDireccionHint = useTraducir("Solo es necesaria si solicitás recolección a domicilio.");
  const tHorarios = useTraducir("Hora de entrega o recolección");
  const tHorariosHint = useTraducir("Se recibe de lunes a viernes de 8:00 a.m. a 5:00 p.m.");
  const tDiaEntrega = useTraducir("Día de entrega o recolección");
  const tDiaEntregaEntrega = useTraducir("Día de entrega");
  const tDiaEntregaRecoleccion = useTraducir("Día de recolección");
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
  const tOpcional = useTraducir("(opcional)");

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

    if (
      name === "nombre" ||
      name === "primerApellido" ||
      name === "segundoApellido"
    ) {
      valor = limitarPalabras(String(valor), MAX_PALABRAS_TITULO);
    }

    if (name === "fechaEntrega") {
      if (valor && esFinDeSemana(valor)) {
        setFormulario((prev) => ({ ...prev, fechaEntrega: "" }));
        setErrores((prev) => ({
          ...prev,
          fechaEntrega: "Solo se pueden escoger días de lunes a viernes.",
        }));
        return;
      }
    }

    if (name === "categoriaId") {
      setFormulario((prev) => ({
        ...prev,
        categoriaId: valor,
        categoriaOtra: valor === CATEGORIA_OTRA ? prev.categoriaOtra : "",
      }));
      limpiarError("categoriaId");
      limpiarError("categoriaOtra");
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
    if (formulario.categoriaId === CATEGORIA_OTRA && !formulario.categoriaOtra.trim()) {
      nuevos.categoriaOtra = "Especifique la categoría";
    }
    if (!formulario.descripcion.trim()) nuevos.descripcion = "La descripción es obligatoria";
    if (!formulario.cantidadEstimada.trim()) nuevos.cantidadEstimada = "Indique la cantidad o volumen estimado";
    if (!formulario.estadoArticulos) nuevos.estadoArticulos = "Seleccione el estado de los artículos";
    if (fotos.length < 1) nuevos.fotos = "Agregue al menos una fotografía";
    if (!formulario.metodoEntrega) nuevos.metodoEntrega = "Seleccione el método de entrega";
    if (pideRecoleccion && !formulario.direccionRecoleccion.trim()) {
      nuevos.direccionRecoleccion = "Indique la dirección de recolección";
    }
    if (!formulario.horaEntrega) {
      nuevos.horaEntrega = "Indique la hora de entrega o recolección";
    } else {
      const minutos = minutosDeHora(formulario.horaEntrega);
      if (minutos == null || minutos < HORA_MINIMA || minutos > HORA_MAXIMA) {
        nuevos.horaEntrega = "La hora debe estar entre 8:00 a.m. y 5:00 p.m.";
      }
    }
    if (!formulario.fechaEntrega) {
      nuevos.fechaEntrega = "Seleccione el día de entrega o recolección";
    } else if (esFinDeSemana(formulario.fechaEntrega)) {
      nuevos.fechaEntrega = "Solo se pueden escoger días de lunes a viernes.";
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
          "categoriaOtra",
          "descripcion",
          "cantidadEstimada",
          "estadoArticulos",
          "fotos",
          "metodoEntrega",
          "direccionRecoleccion",
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
      const tipoFinal =
        formulario.categoriaId === CATEGORIA_OTRA
          ? formulario.categoriaOtra.trim()
          : categoriaSeleccionada?.titulo || formulario.categoriaId;

      const payload = {
        necesidadId:
          formulario.categoriaId && formulario.categoriaId !== CATEGORIA_OTRA
            ? Number(formulario.categoriaId)
            : undefined,
        tipo: tipoFinal,
        descripcion: formulario.descripcion.trim(),
        fechaPropuesta: formulario.fechaEntrega,
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
          cantidadEstimada: formulario.cantidadEstimada.trim(),
          estadoArticulos: formulario.estadoArticulos,
          metodoEntrega: formulario.metodoEntrega,
          direccionRecoleccion: pideRecoleccion ? formulario.direccionRecoleccion.trim() : "",
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
                      <option value={CATEGORIA_OTRA}>{tOtra}</option>
                    </select>
                    {errores.categoriaId ? <span className="mensaje-error"><ST>{errores.categoriaId}</ST></span> : null}
                  </div>
                  {formulario.categoriaId === CATEGORIA_OTRA ? (
                    <div className="campo">
                      <input
                        type="text"
                        name="categoriaOtra"
                        value={formulario.categoriaOtra}
                        onChange={handleChange}
                        placeholder={tOtra}
                        maxLength={120}
                      />
                      {errores.categoriaOtra ? <span className="mensaje-error"><ST>{errores.categoriaOtra}</ST></span> : null}
                    </div>
                  ) : null}
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

                <SectionCard paso={3} icon={Truck} title={tLogistica} hint={tLogisticaHint}>
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
                  <div className="campo">
                    <label>{tDireccion}</label>
                    <textarea
                      name="direccionRecoleccion"
                      rows={3}
                      value={formulario.direccionRecoleccion}
                      onChange={handleChange}
                      disabled={!pideRecoleccion}
                    />
                    <span className="mensaje-info">{tDireccionHint}</span>
                    {errores.direccionRecoleccion ? (
                      <span className="mensaje-error"><ST>{errores.direccionRecoleccion}</ST></span>
                    ) : null}
                  </div>
                  <div className="form-grid">
                    <div className="campo">
                      <label>
                        {formulario.metodoEntrega === "recoleccion"
                          ? tDiaEntregaRecoleccion
                          : formulario.metodoEntrega === "entrega"
                            ? tDiaEntregaEntrega
                            : tDiaEntrega}{" "}
                        <span className="req">*</span>
                      </label>
                      <input
                        type="date"
                        name="fechaEntrega"
                        min={proximoDiaHabilIso()}
                        value={formulario.fechaEntrega}
                        onChange={handleChange}
                      />
                      {errores.fechaEntrega ? (
                        <span className="mensaje-error"><ST>{errores.fechaEntrega}</ST></span>
                      ) : null}
                    </div>
                    <div className="campo">
                      <label>
                        {tHorarios} <span className="req">*</span>
                      </label>
                      <input
                        type="time"
                        name="horaEntrega"
                        min="08:00"
                        max="17:00"
                        step="60"
                        value={formulario.horaEntrega}
                        onChange={handleChange}
                      />
                      {errores.horaEntrega ? (
                        <span className="mensaje-error"><ST>{errores.horaEntrega}</ST></span>
                      ) : null}
                    </div>
                  </div>
                  <span className="mensaje-info">{tHorariosHint}</span>
                </SectionCard>

                <SectionCard paso={4} icon={FileText} title={tDeclaracion} hint={tDeclaracionHint}>
                  <div className="form-grid">
                    <div className="campo">
                      <label>
                        {tValor} <span className="mensaje-info">{tOpcional}</span>
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
                    </div>
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
          ) : (
            <div className="confirmacion">
              <div className="confirmacion__icono">
                <Check size={28} strokeWidth={2.2} aria-hidden="true" />
              </div>
              <h2><ST>Solicitud enviada correctamente</ST></h2>
              <p>
                <ST>
                  Recibimos tu solicitud de donación en estado Pendiente. El equipo de Café UNA la revisará y podés consultarla en tu perfil.
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
