import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Globe,
  HelpCircle,
  Info,
  Lock,
  MapPin,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";

import BackToHomeLink from "../../Components/BackToHomeLink/BackToHomeLink";
import { NumericInput } from "../../Components/NumericInput/NumericInput";
import PageLoading from "../../Components/PageLoading/PageLoading";
import { usePaintPublicPage } from "../../hooks/usePaintPublicPage";
import { getActiveSessionUser } from "../../services/sessionService";
import { consultarCedulaDetallada } from "../../services/cedulaService";
import { crearSolicitudVisita } from "../../services/visitasService";
import { queueFocusFormError } from "../../lib/formFocus";
import { filtrarEnteros } from "../../lib/numericInput";
import { limitarPalabras, MAX_PALABRAS_TITULO } from "../../lib/formLimits";
import { ST } from "../../Components/T/ST";
import { useTraducir } from "../../hooks/useTraducir";
import "../Voluntariado/SolicitarVoluntariado.css";

function SectionCard({ icon: Icon, paso, title, hint, children }) {
  return (
    <div className="section-card">
      <div className="section-card__header">
        {paso ? (
          <span className="section-card__paso" aria-hidden="true">
            {paso}
          </span>
        ) : null}
        <h4>
          {paso ? (
            <span className="sr-only">
              <ST>Paso</ST> {paso}.{" "}
            </span>
          ) : null}
          {title}
        </h4>
        {Icon ? <Icon size={20} className="section-card__icon-inline" aria-hidden="true" /> : null}
        {hint ? <span className="section-card__hint">{hint}</span> : null}
      </div>
      <div className="section-card__body">{children}</div>
    </div>
  );
}

const PAISES_LATAM = [
  "Costa Rica",
  "Alemania",
  "Argentina",
  "Brasil",
  "Canadá",
  "Chile",
  "Colombia",
  "España",
  "Estados Unidos",
  "Francia",
  "Guatemala",
  "Honduras",
  "Italia",
  "México",
  "Nicaragua",
  "Panamá",
  "Perú",
  "Reino Unido",
  "Otro País",
];

const TIPOS_GRUPO = [
  "Estudiantes",
  "Universidad",
  "Empresa",
  "Institución pública",
  "Organización",
  "Otro",
];

const BLOQUES_HORARIOS = [
  "Mañana (8:00 a. m. – 11:30 a. m.)",
  "Tarde (1:00 p. m. – 4:30 p. m.)",
  "Jornada completa (8:00 a. m. – 4:30 p. m.)",
];

const DURACIONES = [
  "1 hora",
  "2 horas",
  "Medio día (4 horas)",
  "Día completo (8 horas)",
];

const AREAS_VISITA = [
  "Finca Experimental / Cafetal principal",
  "Beneficio / Planta de procesamiento",
  "Laboratorio de Catación",
  "Recorrido general completo",
];

const MOTIVOS = [
  "Gira académica",
  "Investigación",
  "Capacitación",
  "Turismo educativo",
  "Conocer el proyecto",
  "Otro",
];

const FORM_INICIAL = {
  esNacional: "si",
  identificacion: "",
  nombre: "",
  primerApellido: "",
  segundoApellido: "",
  correo: "",
  telefono: "",
  institucion: "",

  tipoVisitante: "Nacional",
  paisProcedencia: "Costa Rica",
  ciudadProvincia: "",
  cantidadVisitantes: 2,
  tipoGrupo: "Estudiantes",
  tipoGrupoOtro: "",

  fechaVisita: "",
  horaPreferida: BLOQUES_HORARIOS[0],
  fechaAlternativa: "",
  duracionEstimada: DURACIONES[1],
  areaVisita: AREAS_VISITA[0],

  motivoVisita: MOTIVOS[0],
  motivoOtro: "",
  requiereAccesibilidad: false,
  requiereParqueoBus: false,
  requiereGuia: true,
  observaciones: "",
};

function normalizarCedulaCr(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

function esAvisoCedulaInformativo(mensaje) {
  return /cargad[oa]s?\s+autom[aá]ticamente/i.test(mensaje) || /datos cargados/i.test(mensaje);
}

function obtenerUsuarioActual() {
  return getActiveSessionUser();
}

function obtenerCorreoUsuario(user) {
  return String(user?.email || user?.correo || "").trim().toLowerCase();
}

function crearFormularioInicial(user) {
  return {
    ...FORM_INICIAL,
    correo: obtenerCorreoUsuario(user),
  };
}

const VISITA_LOGIN_REDIRECT = "/solicitar-visita";

export function SolicitarVisita() {
  const navigate = useNavigate();

  const tTitulo = useTraducir("Solicitud de Visitas Grupales");
  const tSub = useTraducir(
    "Complete el siguiente formulario para solicitar un recorrido guiado en la Finca Experimental y proyecto Café-UNA.",
  );
  const tInfoResponsable = useTraducir("Información del Encargado / Responsable");
  const tInfoResponsableHint = useTraducir("Datos personales y de contacto de la persona a cargo de la visita");

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
  const tInstitucion = useTraducir("Institución, empresa o universidad");
  const tPhInstitucion = useTraducir("Ej. Universidad Nacional");
  const tCorreo = useTraducir("Correo electrónico");
  const tTelefono = useTraducir("Teléfono / WhatsApp");

  const tInfoGrupo = useTraducir("Información del Grupo y Procedencia");
  const tInfoGrupoHint = useTraducir("Detalles sobre el origen y cantidad de integrantes");
  const tTipoVisitante = useTraducir("Tipo de visitante");
  const tPaisProcedencia = useTraducir("País de procedencia");
  const tCiudadProvincia = useTraducir("Ciudad o provincia");
  const tCantParticipantes = useTraducir("Cantidad de visitantes (Mínimo 2)");
  const tTipoGrupoLabel = useTraducir("Tipo de grupo");

  const tLogistica = useTraducir("Logística y Programación de la Visita");
  const tLogisticaHint = useTraducir("Fechas, horarios y áreas de interés en la finca experimental");
  const tFechaSolicitada = useTraducir("Fecha solicitada");
  const tBloqueHora = useTraducir("Bloque de hora preferido");
  const tFechaAlternativa = useTraducir("Fecha alternativa (Opcional)");
  const tDuracionEstimada = useTraducir("Duración estimada");
  const tAreaVisitaLabel = useTraducir("Lugar o área a visitar");

  const tMotivoSeccion = useTraducir("Motivo y Necesidades Especiales");
  const tMotivoHint = useTraducir("Objetivo de la visita y requerimientos de apoyo logístico");
  const tMotivoPrincipal = useTraducir("Motivo principal de la visita");
  const tObservaciones = useTraducir("Observaciones o requerimientos adicionales");

  const tLoginMsg = useTraducir("Debe iniciar sesión para enviar su solicitud de visita grupal.");
  const tLoginLink = useTraducir("Iniciar sesión →");
  const tEnviar = useTraducir("Enviar Solicitud de Visita");
  const tEnviando = useTraducir("Enviando...");
  const tLoginBtn = useTraducir("Inicie sesión para enviar");

  const [usuario] = useState(() => obtenerUsuarioActual());
  const [formulario, setFormulario] = useState(() => crearFormularioInicial(obtenerUsuarioActual()));

  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState("");
  const [errorApi, setErrorApi] = useState(null);
  const [modalExito, setModalExito] = useState(false);
  const [solicitudCreada, setSolicitudCreada] = useState(null);

  const [consultandoCedula, setConsultandoCedula] = useState(false);
  const [avisoCedula, setAvisoCedula] = useState(null);
  const [nombreAutocargado, setNombreAutocargado] = useState(false);

  const {
    ref: pageRef,
    showLoading,
    showPrepaint,
    inert,
    loadingMessage,
  } = usePaintPublicPage("visitas");

  const esNacionalCr = formulario.esNacional === "si";
  const consultaCedulaRef = useRef({ digitos: "", enCurso: false });

  const redirectToLogin = useCallback(() => {
    sessionStorage.setItem("postLoginRedirect", VISITA_LOGIN_REDIRECT);
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
        paisProcedencia: "Costa Rica",
        tipoVisitante: "Nacional",
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

  const handleChange = (e) => {
    let valor = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    const name = e.target.name;

    if (typeof valor === "string") {
      valor = valor.replace(/\s+/g, " ").trimStart();
    }

    if (name === "correo") {
      valor = String(valor).toLowerCase();
    }

    if (name === "telefono") {
      valor = filtrarEnteros(String(valor)).slice(0, 8);
    }

    if (name === "cantidadVisitantes") {
      valor = filtrarEnteros(String(valor));
    }

    if (name === "identificacion") {
      if (esNacionalCr) {
        valor = String(valor).replace(/\D/g, "").slice(0, 9);
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
      valor = String(valor).slice(0, 30);
    }

    if (
      name === "nombre" ||
      name === "primerApellido" ||
      name === "segundoApellido" ||
      name === "institucion" ||
      name === "ciudadProvincia" ||
      name === "tipoGrupoOtro" ||
      name === "motivoOtro"
    ) {
      valor = limitarPalabras(String(valor), MAX_PALABRAS_TITULO);
    }

    if (name === "tipoVisitante" && valor === "Nacional") {
      setFormulario((prev) => ({
        ...prev,
        [name]: valor,
        paisProcedencia: "Costa Rica",
      }));
      limpiarError(name);
      limpiarError("paisProcedencia");
      return;
    }

    setFormulario((prev) => ({
      ...prev,
      [name]: valor,
    }));

    limpiarError(name);
  };

  const handleEsNacional = (valor) => {
    setFormulario((prev) => ({
      ...prev,
      esNacional: valor,
      nombre: "",
      primerApellido: "",
      segundoApellido: "",
      tipoVisitante: valor === "si" ? "Nacional" : "Internacional",
      paisProcedencia: valor === "si" ? "Costa Rica" : prev.paisProcedencia === "Costa Rica" ? "" : prev.paisProcedencia,
      identificacion: valor === "si" ? normalizarCedulaCr(prev.identificacion) : prev.identificacion,
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

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formulario.esNacional) {
      nuevosErrores.esNacional = "Indique si es nacional costarricense";
    }

    const nombre = formulario.nombre?.trim();
    if (!nombre) nuevosErrores.nombre = "El nombre del encargado es obligatorio";
    else if (nombre.length < 2) nuevosErrores.nombre = "Mínimo 2 caracteres";

    const primerApellido = formulario.primerApellido?.trim();
    if (esNacionalCr && !primerApellido) {
      nuevosErrores.primerApellido = "El primer apellido es obligatorio";
    }

    const identificacion = formulario.identificacion?.trim();
    if (!identificacion) {
      nuevosErrores.identificacion = "La identificación es obligatoria";
    } else if (esNacionalCr) {
      const digitos = normalizarCedulaCr(identificacion);
      if (digitos.length !== 9) {
        nuevosErrores.identificacion = "La cédula costarricense debe tener 9 dígitos";
      }
    }

    const correo = formulario.correo?.trim();
    if (!correo) nuevosErrores.correo = "El correo electrónico es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      nuevosErrores.correo = "Correo electrónico inválido";
    }

    const telefono = formulario.telefono?.trim();
    if (!telefono) nuevosErrores.telefono = "El número de teléfono es obligatorio";

    if (formulario.tipoVisitante === "Internacional" && !formulario.paisProcedencia?.trim()) {
      nuevosErrores.paisProcedencia = "El país de procedencia es obligatorio para visitantes internacionales";
    }

    if (!formulario.ciudadProvincia?.trim()) {
      nuevosErrores.ciudadProvincia = "La ciudad o provincia es obligatoria";
    }

    const cant = Number(formulario.cantidadVisitantes);
    if (isNaN(cant) || cant < 2) {
      nuevosErrores.cantidadVisitantes = "La solicitud de visita es exclusivamente para grupos de mínimo 2 personas";
    }

    if (formulario.tipoGrupo === "Otro" && !formulario.tipoGrupoOtro?.trim()) {
      nuevosErrores.tipoGrupoOtro = "Especifique el tipo de grupo";
    }

    if (!formulario.fechaVisita) {
      nuevosErrores.fechaVisita = "Seleccione la fecha solicitada para la visita";
    }

    if (!formulario.horaPreferida) {
      nuevosErrores.horaPreferida = "Seleccione un bloque de horario preferido";
    }

    if (formulario.motivoVisita === "Otro" && !formulario.motivoOtro?.trim()) {
      nuevosErrores.motivoOtro = "Especifique el motivo de la visita";
    }

    setErrores(nuevosErrores);
    return nuevosErrores;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usuario) {
      sessionStorage.setItem("postLoginRedirect", VISITA_LOGIN_REDIRECT);
      setErrorApi("Debe iniciar sesión antes de enviar una solicitud de visita grupal.");
      queueFocusFormError({ root: e.currentTarget });
      return;
    }

    const nuevosErrores = validarFormulario();
    if (Object.keys(nuevosErrores).length > 0) {
      queueFocusFormError({
        errors: nuevosErrores,
        root: e.currentTarget,
        fieldOrder: [
          "esNacional",
          "identificacion",
          "nombre",
          "primerApellido",
          "correo",
          "telefono",
          "tipoVisitante",
          "paisProcedencia",
          "ciudadProvincia",
          "cantidadVisitantes",
          "tipoGrupo",
          "tipoGrupoOtro",
          "fechaVisita",
          "horaPreferida",
          "motivoVisita",
          "motivoOtro",
        ],
      });
      return;
    }

    setCargando(true);
    setErrorGlobal("");
    setErrorApi(null);

    const encargadoNombreCompleto = [
      formulario.nombre?.trim(),
      formulario.primerApellido?.trim(),
      formulario.segundoApellido?.trim(),
    ].filter(Boolean).join(" ");

    const payload = {
      encargadoNombre: encargadoNombreCompleto,
      encargadoIdentificacion: esNacionalCr ? normalizarCedulaCr(formulario.identificacion) : formulario.identificacion.trim(),
      encargadoEmail: formulario.correo.trim(),
      encargadoTelefono: formulario.telefono.trim(),
      encargadoInstitucion: formulario.institucion.trim() || undefined,
      tipoVisitante: formulario.tipoVisitante,
      paisProcedencia: formulario.tipoVisitante === "Internacional" ? formulario.paisProcedencia.trim() : "Costa Rica",
      ciudadProvincia: formulario.ciudadProvincia.trim(),
      cantidadVisitantes: Number(formulario.cantidadVisitantes),
      tipoGrupo: formulario.tipoGrupo,
      tipoGrupoOtro: formulario.tipoGrupo === "Otro" ? formulario.tipoGrupoOtro.trim() : undefined,
      fechaVisita: formulario.fechaVisita,
      horaPreferida: formulario.horaPreferida,
      fechaAlternativa: formulario.fechaAlternativa || undefined,
      duracionEstimada: formulario.duracionEstimada || undefined,
      areaVisita: formulario.areaVisita || undefined,
      motivoVisita: formulario.motivoVisita,
      motivoOtro: formulario.motivoVisita === "Otro" ? formulario.motivoOtro.trim() : undefined,
      requiereAccesibilidad: Boolean(formulario.requiereAccesibilidad),
      requiereParqueoBus: Boolean(formulario.requiereParqueoBus),
      requiereGuia: Boolean(formulario.requiereGuia),
      observaciones: formulario.observaciones.trim() || undefined,
    };

    try {
      const res = await crearSolicitudVisita(payload);
      setSolicitudCreada(res);
      setModalExito(true);
    } catch (err) {
      const msg = err.message || "Ocurrió un error al registrar la solicitud.";
      setErrorGlobal(msg);
      setErrorApi(msg);
    } finally {
      setCargando(false);
    }
  };

  const hoyStr = new Date().toISOString().split("T")[0];

  return (
    <>
      {showLoading ? <PageLoading message={loadingMessage} /> : null}
      <main
        ref={pageRef}
        className={`voluntariado-page${showPrepaint ? " voluntariado-page--prepaint" : ""}`}
        inert={inert}
      >
        <BackToHomeLink homeSection="voluntariado" />

        <section id="visitas-grupales" className="voluntariado-section">
          <div className="voluntariado-header">
            <h1>{tTitulo}</h1>
            <p>{tSub}</p>
          </div>

          {!usuario ? (
            <div className="auth-banner" role="region" aria-label="Aviso de inicio de sesión">
              <div className="auth-banner__content">
                <Lock className="auth-banner__icon" aria-hidden="true" />
                <p className="auth-banner__text">
                  <ST>{tLoginMsg}</ST>
                </p>
              </div>
              <button
                type="button"
                onClick={redirectToLogin}
                className="auth-banner__link"
              >
                <ST>{tLoginLink}</ST>
              </button>
            </div>
          ) : null}

          {errorApi && (
            <div className="rounded-xl bg-red-50 p-4 border border-red-200 text-xs text-red-700 mb-6">
              <ST>{errorApi}</ST>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="formulario-card"
            noValidate
            onFocusCapture={handleFormInteractionCapture}
            onPointerDownCapture={handleFormInteractionCapture}
          >
            <div className="form-secciones">
              {/* Sección 1: Información del Encargado */}
              <SectionCard
                icon={User}
                paso={1}
                title={tInfoResponsable}
                hint={tInfoResponsableHint}
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
                    {errores.identificacion && (
                      <span className="mensaje-error"><ST>{errores.identificacion}</ST></span>
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
                    {errores.nombre && (
                      <span className="mensaje-error"><ST>{errores.nombre}</ST></span>
                    )}
                  </div>

                  <div className="campo">
                    <label>
                      {tPrimerApellido} {esNacionalCr ? <span className="req">*</span> : null}
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
                    {errores.primerApellido && (
                      <span className="mensaje-error"><ST>{errores.primerApellido}</ST></span>
                    )}
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

                {avisoCedula && (
                  <p
                    className={`mt-2 text-xs font-semibold ${
                      esAvisoCedulaInformativo(avisoCedula) ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    <ST>{avisoCedula}</ST>
                  </p>
                )}

                <div className="form-grid--3cols mt-4">
                  <div className="campo">
                    <label>
                      {tCorreo} <span className="req">*</span>
                    </label>
                    <input
                      type="email"
                      name="correo"
                      placeholder="ejemplo@correo.com"
                      value={formulario.correo}
                      onChange={handleChange}
                    />
                    {errores.correo && (
                      <span className="mensaje-error"><ST>{errores.correo}</ST></span>
                    )}
                  </div>

                  <div className="campo">
                    <label>
                      {tTelefono} <span className="req">*</span>
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      placeholder="+506 8888-8888"
                      value={formulario.telefono}
                      onChange={handleChange}
                    />
                    {errores.telefono && (
                      <span className="mensaje-error"><ST>{errores.telefono}</ST></span>
                    )}
                  </div>

                  <div className="campo">
                    <label>{tInstitucion}</label>
                    <input
                      type="text"
                      name="institucion"
                      placeholder={tPhInstitucion}
                      value={formulario.institucion}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </SectionCard>

              {/* Sección 2: Información del Grupo y Procedencia */}
              <SectionCard
                icon={Users}
                paso={2}
                title={tInfoGrupo}
                hint={tInfoGrupoHint}
              >
                <div className="form-grid--3cols">
                  <div className="campo">
                    <label>
                      {tTipoVisitante} <span className="req">*</span>
                    </label>
                    <select
                      name="tipoVisitante"
                      value={formulario.tipoVisitante}
                      onChange={handleChange}
                    >
                      <option value="Nacional">Nacional</option>
                      <option value="Internacional">Internacional</option>
                    </select>
                  </div>

                  {formulario.tipoVisitante === "Internacional" && (
                    <div className="campo">
                      <label>
                        {tPaisProcedencia} <span className="req">*</span>
                      </label>
                      <select
                        name="paisProcedencia"
                        value={formulario.paisProcedencia}
                        onChange={handleChange}
                      >
                        <option value="">Seleccione país...</option>
                        {PAISES_LATAM.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      {errores.paisProcedencia && (
                        <span className="mensaje-error"><ST>{errores.paisProcedencia}</ST></span>
                      )}
                    </div>
                  )}

                  <div className="campo">
                    <label>
                      {tCiudadProvincia} <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      name="ciudadProvincia"
                      placeholder="Ej. Heredia, San José..."
                      value={formulario.ciudadProvincia}
                      onChange={handleChange}
                    />
                    {errores.ciudadProvincia && (
                      <span className="mensaje-error"><ST>{errores.ciudadProvincia}</ST></span>
                    )}
                  </div>

                  <div className="campo">
                    <label>
                      {tCantParticipantes} <span className="req">*</span>
                    </label>
                    <NumericInput
                      name="cantidadVisitantes"
                      placeholder="Ej. 15"
                      value={formulario.cantidadVisitantes}
                      onChange={handleChange}
                    />
                    {errores.cantidadVisitantes && (
                      <span className="mensaje-error"><ST>{errores.cantidadVisitantes}</ST></span>
                    )}
                  </div>

                  <div className="campo">
                    <label>
                      {tTipoGrupoLabel} <span className="req">*</span>
                    </label>
                    <select
                      name="tipoGrupo"
                      value={formulario.tipoGrupo}
                      onChange={handleChange}
                    >
                      {TIPOS_GRUPO.map((tg) => (
                        <option key={tg} value={tg}>
                          {tg}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formulario.tipoGrupo === "Otro" && (
                    <div className="campo">
                      <label>
                        Especifique tipo de grupo <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        name="tipoGrupoOtro"
                        placeholder="Ej. Grupo de productores"
                        value={formulario.tipoGrupoOtro}
                        onChange={handleChange}
                      />
                      {errores.tipoGrupoOtro && (
                        <span className="mensaje-error"><ST>{errores.tipoGrupoOtro}</ST></span>
                      )}
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* Sección 3: Logística y Programación */}
              <SectionCard
                icon={Calendar}
                paso={3}
                title={tLogistica}
                hint={tLogisticaHint}
              >
                <div className="form-grid--3cols">
                  <div className="campo">
                    <label>
                      {tFechaSolicitada} <span className="req">*</span>
                    </label>
                    <input
                      type="date"
                      name="fechaVisita"
                      min={hoyStr}
                      value={formulario.fechaVisita}
                      onChange={handleChange}
                    />
                    {errores.fechaVisita && (
                      <span className="mensaje-error"><ST>{errores.fechaVisita}</ST></span>
                    )}
                  </div>

                  <div className="campo">
                    <label>
                      {tBloqueHora} <span className="req">*</span>
                    </label>
                    <select
                      name="horaPreferida"
                      value={formulario.horaPreferida}
                      onChange={handleChange}
                    >
                      {BLOQUES_HORARIOS.map((bh) => (
                        <option key={bh} value={bh}>
                          {bh}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="campo">
                    <label>{tFechaAlternativa}</label>
                    <input
                      type="date"
                      name="fechaAlternativa"
                      min={hoyStr}
                      value={formulario.fechaAlternativa}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="campo">
                    <label>{tDuracionEstimada}</label>
                    <select
                      name="duracionEstimada"
                      value={formulario.duracionEstimada}
                      onChange={handleChange}
                    >
                      {DURACIONES.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="campo col-span-2">
                    <label>{tAreaVisitaLabel}</label>
                    <select
                      name="areaVisita"
                      value={formulario.areaVisita}
                      onChange={handleChange}
                    >
                      {AREAS_VISITA.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </SectionCard>

              {/* Sección 4: Motivo y Requerimientos Especiales */}
              <SectionCard
                icon={Building2}
                paso={4}
                title={tMotivoSeccion}
                hint={tMotivoHint}
              >
                <div className="space-y-4">
                  <div className="campo">
                    <label>
                      {tMotivoPrincipal} <span className="req">*</span>
                    </label>
                    <select
                      name="motivoVisita"
                      value={formulario.motivoVisita}
                      onChange={handleChange}
                    >
                      {MOTIVOS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formulario.motivoVisita === "Otro" && (
                    <div className="campo">
                      <label>
                        Especifique el motivo <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        name="motivoOtro"
                        placeholder="Motivo de la visita..."
                        value={formulario.motivoOtro}
                        onChange={handleChange}
                      />
                      {errores.motivoOtro && (
                        <span className="mensaje-error"><ST>{errores.motivoOtro}</ST></span>
                      )}
                    </div>
                  )}

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      <ST>Necesidades especiales y logística</ST>
                    </h5>

                    <label className="flex items-center justify-between gap-3 text-sm text-slate-700 cursor-pointer">
                      <span><ST>¿Requieren accesibilidad física o motriz?</ST></span>
                      <input
                        type="checkbox"
                        name="requiereAccesibilidad"
                        className="size-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        checked={formulario.requiereAccesibilidad}
                        onChange={handleChange}
                      />
                    </label>

                    <label className="flex items-center justify-between gap-3 text-sm text-slate-700 cursor-pointer">
                      <span><ST>¿Necesitan espacio de parqueo para autobús/buseta?</ST></span>
                      <input
                        type="checkbox"
                        name="requiereParqueoBus"
                        className="size-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        checked={formulario.requiereParqueoBus}
                        onChange={handleChange}
                      />
                    </label>

                    <label className="flex items-center justify-between gap-3 text-sm text-slate-700 cursor-pointer">
                      <span><ST>¿Requieren personal de guía institucional?</ST></span>
                      <input
                        type="checkbox"
                        name="requiereGuia"
                        className="size-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        checked={formulario.requiereGuia}
                        onChange={handleChange}
                      />
                    </label>
                  </div>

                  <div className="campo">
                    <label>{tObservaciones}</label>
                    <textarea
                      rows={3}
                      name="observaciones"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white"
                      placeholder="Detalles sobre el grupo o temas específicos a profundizar..."
                      value={formulario.observaciones}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="formulario-card__acciones mt-6">
              <button
                type="submit"
                disabled={cargando}
                className="btn-enviar-voluntariado"
              >
                {cargando ? (
                  <ST>{tEnviando}</ST>
                ) : !usuario ? (
                  <ST>{tLoginBtn}</ST>
                ) : (
                  <ST>{tEnviar}</ST>
                )}
              </button>
            </div>
          </form>
        </section>
      </main>

      {/* Confirmation Modal */}
      {modalExito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mb-4">
              <CheckCircle2 className="size-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              <ST>¡Solicitud Enviada Correctamente!</ST>
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              <ST>
                Su solicitud de visita grupal ha ingresado en <strong>Estado Pendiente de revisión administrativa</strong>.
              </ST>
            </p>
            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 border border-slate-200">
              <p><strong><ST>Encargado:</ST></strong> {solicitudCreada?.encargadoNombre}</p>
              <p><strong><ST>Fecha Visita:</ST></strong> {solicitudCreada?.fechaVisita}</p>
              <p><strong><ST>Participantes:</ST></strong> {solicitudCreada?.cantidadVisitantes}</p>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              <ST>Se ha enviado un correo de acuse de recibo a</ST> <strong>{solicitudCreada?.encargadoEmail}</strong>.
            </p>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setModalExito(false);
                  window.location.href = "/";
                }}
                className="w-full rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <ST>Volver al Inicio</ST>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SolicitarVisita;
