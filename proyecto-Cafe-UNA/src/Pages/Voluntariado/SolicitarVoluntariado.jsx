import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  HandHeart,
  Lock,
  Mail,
  Sprout,
  User,
  Users,
} from "lucide-react";
import { format, isBefore, parseISO, startOfDay } from "date-fns";
import BackToHomeLink from "../../Components/BackToHomeLink/BackToHomeLink";
import { HOME_SCROLL_SECTIONS } from "../../lib/homeScrollTarget";
import PageLoading from "../../Components/PageLoading/PageLoading";
import { usePaintPublicPage } from "../../hooks/usePaintPublicPage";
import { getActiveSessionUser } from "../../services/sessionService";
import { crearSolicitud } from "../../services/voluntariadoService";
import { consultarCedulaDetallada } from "../../services/cedulaService";
import { DatePickerWithRange } from "./DatePickerWithRange";
import logoCafe from "/logo.webp";
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
  fechaInicio: "",
  fechaFin: "",
  horarioDetallado: "",
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

function validarFechasVoluntariado(fechaInicio, fechaFin) {
  const errores = {};
  const hoy = startOfDay(new Date());

  if (!fechaInicio) {
    errores.fechaInicio = "Seleccione la fecha de inicio";
  } else if (isBefore(startOfDay(parseISO(fechaInicio)), hoy)) {
    errores.fechaInicio = "La fecha de inicio no puede ser anterior a hoy";
  }

  if (!fechaFin) {
    errores.fechaFin = "Seleccione la fecha de finalización";
  } else if (
    fechaInicio &&
    isBefore(startOfDay(parseISO(fechaFin)), startOfDay(parseISO(fechaInicio)))
  ) {
    errores.fechaFin = "La fecha de finalización no puede ser anterior a la fecha de inicio";
  }

  return errores;
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
  const [usuario] = useState(() => obtenerUsuarioActual());
  const [formulario, setFormulario] = useState(() => crearFormularioInicial(obtenerUsuarioActual()));
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
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

  const handleRangeChange = (range) => {
    const fechaInicioStr = range?.from ? format(range.from, "yyyy-MM-dd") : "";
    const fechaFinStr = range?.to ? format(range.to, "yyyy-MM-dd") : "";
    const erroresFechas = validarFechasVoluntariado(fechaInicioStr, fechaFinStr);

    setDateRange(range);
    setFormulario((prev) => ({
      ...prev,
      fechaInicio: fechaInicioStr,
      fechaFin: fechaFinStr,
    }));

    setErrores((prev) => {
      const next = { ...prev };
      delete next.fechaInicio;
      delete next.fechaFin;

      if (erroresFechas.fechaInicio) {
        next.fechaInicio = erroresFechas.fechaInicio;
      }
      if (erroresFechas.fechaFin) {
        next.fechaFin = erroresFechas.fechaFin;
      }

      return next;
    });
  };

  const handleChange = (e) => {
    let valor = e.target.value;

    if (typeof valor === "string") {
      valor = valor.replace(/\s+/g, " ").trimStart();
    }

    if (e.target.name === "correo") {
      valor = valor.toLowerCase();
    }

    if (e.target.name === "identificacion") {
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
        limpiarError(e.target.name);
        return;
      }

      valor = valor.replace(/\s+/g, " ").trimStart();
    }

    setFormulario((prev) => ({
      ...prev,
      [e.target.name]: valor,
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
      setErrores((prev) => {
        const next = { ...prev };
        delete next.cantidadParticipantes;
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

    Object.assign(
      nuevosErrores,
      validarFechasVoluntariado(formulario.fechaInicio, formulario.fechaFin)
    );

    if (!formulario.horarioDetallado?.trim()) {
      nuevosErrores.horarioDetallado = "Describa los días y horas disponibles";
    }

    if (esGrupal) {
      const cantidad = Number(formulario.cantidadParticipantes);
      if (!formulario.cantidadParticipantes || cantidad < 2) {
        nuevosErrores.cantidadParticipantes = "Ingrese la cantidad (mínimo 2)";
      } else if (cantidad > 100) {
        nuevosErrores.cantidadParticipantes = "Máximo 100 participantes";
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const resetFormulario = () => {
    setFormulario(crearFormularioInicial(usuario));
    setDateRange({ from: undefined, to: undefined });
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
      return;
    }

    if (!validarFormulario()) return;

    if (esNacionalCr && !formulario.nombre?.trim()) {
      setAvisoCedula("Ingrese su nombre o verifique la cédula.");
      return;
    }

    const tipoFinal = esTipoOtro ? formulario.tipoOtro.trim() : formulario.tipo;

    const datosEnvio = {
      nombre: formulario.nombre.trim(),
      primerApellido: formulario.primerApellido.trim(),
      segundoApellido: formulario.segundoApellido.trim(),
      email: formulario.correo.trim(),
      telefono: formulario.telefono.trim(),
      tipoVoluntariado: tipoFinal,
      identificacion: esNacionalCr
        ? normalizarCedulaCr(formulario.identificacion)
        : formulario.identificacion.trim(),
      institucion: formulario.institucion.trim(),
      pais: formulario.pais.trim(),
      modalidad: formulario.modalidad,
      cantidadParticipantes: esGrupal ? Number(formulario.cantidadParticipantes) : 1,
      residencia: "",
      horario: formulario.horarioDetallado.trim(),
      dias: `${formulario.fechaInicio} - ${formulario.fechaFin}`,
      area: tipoFinal,
      descripcion: `Período: ${formulario.fechaInicio} - ${formulario.fechaFin}.${
        esGrupal ? ` Cantidad de participantes: ${formulario.cantidadParticipantes}.` : ""
      }`,
      motivacion: "",
    };

    setEnviando(true);
    setErrorApi(null);

    try {
      await crearSolicitud(datosEnvio);
      window.dispatchEvent(new Event("voluntariado-updated"));
      resetFormulario();
      setEnviado(true);
    } catch (err) {
      setErrorApi("Ocurrió un error al enviar la solicitud. Intente nuevamente.");
      console.error(err);
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
            <img src={logoCafe} alt="Logo CAFÉ-UNA" className="voluntariado-header__logo" />
            <span className="badge--voluntariado">Programa de Voluntariado</span>
            <h1>Únete a nuestras iniciativas</h1>
            <p>Complete el siguiente formulario para aplicar al área de voluntariado de su interés.</p>
          </div>

          {!enviado ? (
            <form
              onSubmit={handleSubmit}
              className="formulario-card"
              noValidate
              onFocusCapture={handleFormInteractionCapture}
              onPointerDownCapture={handleFormInteractionCapture}
            >
              <div className="campo full tipo-postulacion">
                <p className="campo-pregunta">
                  ¿Cómo desea participar?<span className="req">*</span>
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
                    <span>Individual</span>
                  </label>
                  <label className="radio-card">
                    <input
                      type="radio"
                      name="modalidad"
                      value="grupal"
                      checked={formulario.modalidad === "grupal"}
                      onChange={() => handleModalidad("grupal")}
                    />
                    <span>Grupal</span>
                  </label>
                </div>
              </div>

              <div className="form-secciones">
                <SectionCard icon={User} title="Información personal">
                  <div className="campo full">
                    <p className="campo-pregunta">
                      ¿Es nacional costarricense?<span className="req">*</span>
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
                        <span>Sí</span>
                      </label>
                      <label className="radio-card">
                        <input
                          type="radio"
                          name="esNacional"
                          value="no"
                          checked={formulario.esNacional === "no"}
                          onChange={() => handleEsNacional("no")}
                        />
                        <span>No</span>
                      </label>
                    </div>
                    {errores.esNacional && (
                      <span className="mensaje-error">{errores.esNacional}</span>
                    )}
                  </div>

                  <div className="form-grid--4cols">
                    <div className="campo">
                      <label>
                        {esNacionalCr ? "Cédula" : "Identificación"}{" "}
                        <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        name="identificacion"
                        placeholder={esNacionalCr ? "9 dígitos" : "Pasaporte / ID"}
                        value={formulario.identificacion}
                        onChange={handleChange}
                        onBlur={esNacionalCr ? handleIdentificacionBlur : undefined}
                        maxLength={esNacionalCr ? 9 : 30}
                        inputMode={esNacionalCr ? "numeric" : "text"}
                        autoComplete="off"
                        disabled={!formulario.esNacional}
                      />
                    </div>

                    <div className="campo">
                      <label>
                        Nombre <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        placeholder={consultandoCedula ? "Consultando..." : "Nombre"}
                        value={formulario.nombre}
                        onChange={handleChange}
                        maxLength={80}
                        disabled={!formulario.esNacional}
                      />
                    </div>

                    <div className="campo">
                      <label>
                        Primer apellido <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        name="primerApellido"
                        placeholder={consultandoCedula ? "Consultando..." : "1° Apellido"}
                        value={formulario.primerApellido}
                        onChange={handleChange}
                        maxLength={80}
                        disabled={!formulario.esNacional}
                      />
                    </div>

                    <div className="campo">
                      <label>Segundo apellido</label>
                      <input
                        type="text"
                        name="segundoApellido"
                        placeholder={consultandoCedula ? "Consultando..." : "2° Apellido"}
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
                      {avisoCedula}
                    </span>
                  )}
                  {(errores.identificacion || errores.nombre || errores.primerApellido) && (
                    <span className="mensaje-error">
                      {errores.identificacion || errores.nombre || errores.primerApellido}
                    </span>
                  )}

                  <div className="form-grid">
                    <div className="campo">
                      <label>
                        Institución educativa<span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        name="institucion"
                        placeholder="Ej. Universidad Nacional"
                        value={formulario.institucion}
                        onChange={handleChange}
                        maxLength={120}
                        disabled={!formulario.esNacional}
                      />
                      {errores.institucion && (
                        <span className="mensaje-error">{errores.institucion}</span>
                      )}
                    </div>

                    <div className="campo">
                      <label>
                        País de residencia<span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        name="pais"
                        placeholder="Ej. Costa Rica"
                        value={formulario.pais}
                        onChange={handleChange}
                        readOnly={esNacionalCr}
                        disabled={!formulario.esNacional}
                      />
                      {errores.pais && <span className="mensaje-error">{errores.pais}</span>}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard icon={Mail} title="Contacto al solicitante">
                  <div className="form-grid">
                    <div className="campo">
                      <label>
                        Correo electrónico<span className="req">*</span>
                      </label>
                      <input
                        type="email"
                        name="correo"
                        placeholder="correo@ejemplo.com"
                        value={formulario.correo}
                        onChange={handleChange}
                      />
                      {errores.correo && <span className="mensaje-error">{errores.correo}</span>}
                    </div>

                    <div className="campo">
                      <label>
                        Número de teléfono<span className="req">*</span>
                      </label>
                      <input
                        type="tel"
                        name="telefono"
                        placeholder="88888888"
                        value={formulario.telefono}
                        onChange={handleChange}
                      />
                      {errores.telefono && (
                        <span className="mensaje-error">{errores.telefono}</span>
                      )}
                    </div>
                  </div>
                </SectionCard>

                {esGrupal && (
                  <SectionCard
                    icon={Users}
                    title="Información del grupo"
                    hint="Datos del grupo y responsable"
                  >
                    <div className="form-grid">
                      <div className="campo">
                        <label>
                          Cantidad de participantes <span className="req">*</span>
                        </label>
                        <input
                          type="number"
                          name="cantidadParticipantes"
                          min="2"
                          max="100"
                          placeholder="Ej. 15"
                          value={formulario.cantidadParticipantes}
                          onChange={handleChange}
                        />
                        {errores.cantidadParticipantes && (
                          <span className="mensaje-error">{errores.cantidadParticipantes}</span>
                        )}
                      </div>
                    </div>
                  </SectionCard>
                )}

                <SectionCard icon={HandHeart} title="Información del voluntariado">
                  <div className="campo full">
                    <p className="campo-pregunta">
                      Período de voluntariado (Desde — Hasta) <span className="req">*</span>
                    </p>
                    <DatePickerWithRange
                      dateRange={dateRange}
                      setDateRange={handleRangeChange}
                      error={errores.fechaInicio || errores.fechaFin}
                    />
                    {(errores.fechaInicio || errores.fechaFin) && (
                      <span className="mensaje-error">
                        {errores.fechaInicio || errores.fechaFin}
                      </span>
                    )}
                  </div>

                  <div className="campo full">
                    <p className="campo-pregunta" id="horario-detallado-label">
                      Horario preferido y disponibilidad detallada <span className="req">*</span>
                    </p>
                    <p className="mensaje-info">
                      El horario para realizar el voluntariado es de 8:00 a. m. a 5:00 p. m., con un
                      período de almuerzo de 12:00 p. m. a 1:00 p. m.
                    </p>
                    <textarea
                      name="horarioDetallado"
                      rows={3}
                      aria-labelledby="horario-detallado-label"
                      placeholder="Describa el horario detallado de su voluntariado por días y horas asignadas. Ejemplo: Lunes (8am - 12pm), Martes (1pm - 5pm), Miércoles (9am - 11am)."
                      value={formulario.horarioDetallado}
                      onChange={handleChange}
                    />
                    {errores.horarioDetallado && (
                      <span className="mensaje-error">{errores.horarioDetallado}</span>
                    )}
                  </div>
                </SectionCard>

                <SectionCard
                  icon={Sprout}
                  title="Tipo de voluntariado"
                  hint="Seleccione una única opción"
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
                        <span>{tipo}</span>
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
                        <span className="mensaje-error">{errores.tipoOtro}</span>
                      )}
                    </div>
                  )}

                  {errores.tipo && <span className="mensaje-error">{errores.tipo}</span>}
                </SectionCard>
              </div>

              {errorApi && <p className="form-error">{errorApi}</p>}

              {!usuario ? (
                <div className="auth-banner">
                  <Lock size={20} strokeWidth={2} className="auth-banner__icon" />
                  <div className="auth-banner__content">
                    <p className="auth-banner__text">
                      Debe iniciar sesión para enviar su solicitud de voluntariado.
                    </p>
                    <Link
                      to="/login"
                      className="auth-banner__link"
                      onClick={() =>
                        sessionStorage.setItem("postLoginRedirect", VOLUNTARIADO_LOGIN_REDIRECT)
                      }
                    >
                      Iniciar sesión →
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
                  {enviando ? "Enviando..." : !usuario ? "Inicie sesión para enviar" : "Enviar Solicitud"}
                </button>
              </div>
            </form>
          ) : (
            <div className="confirmacion">
              <div className="confirmacion__icono">
                <Check size={28} strokeWidth={2.2} aria-hidden="true" />
              </div>
              <h2>Solicitud enviada correctamente</h2>
              <p>
                Tu solicitud de voluntariado fue recibida y está siendo revisada por
                el equipo de Café UNA. Recibirás información en tu correo electrónico.
              </p>
              <button type="button" className="btn-enviar" onClick={() => setEnviado(false)}>
                Realizar otra solicitud
              </button>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default SolicitarVoluntariado;