import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, HandHeart, Lock, Mail, Sprout, User, Users } from "lucide-react";
import BackToHomeLink from "../../Components/BackToHomeLink/BackToHomeLink";
import { HOME_SCROLL_SECTIONS } from "../../lib/homeScrollTarget";
import PageLoading from "../../Components/PageLoading/PageLoading";
import { usePaintPublicPage } from "../../hooks/usePaintPublicPage";
import { getActiveSessionUser } from "../../services/sessionService";
import { crearSolicitud } from "../../services/voluntariadoService";
import { consultarCedula } from "../../services/cedulaService";
import { SectionCard, SelectorFecha } from "./CalendarioVoluntariado";
import "./SolicitarVoluntariado.css";

const TIPOS_VOLUNTARIADO = [
  "Apoyo General",
  "Capacitaciones",
  "Investigación Académica",
  "Actividades de limpieza y mantenimiento",
  "Otro",
];

const HORARIOS_PREFERIDOS = [
  { id: "manana", label: "Mañana (8:00 – 12:00)" },
  { id: "tarde", label: "Tarde (01:00 – 04:30)" },
  { id: "flexible", label: "Horario flexible" },
];

const FORM_INICIAL = {
  modalidad: "individual",
  cantidadParticipantes: "",
  tipo: "",
  tipoOtro: "",
  esNacional: "",
  nombre: "",
  identificacion: "",
  institucion: "",
  pais: "",
  residencia: "",
  correo: "",
  telefono: "",
  fechaInicio: "",
  fechaFin: "",
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

function obtenerCampoCedula(datos, ...claves) {
  if (!datos || typeof datos !== "object") return "";
  for (const clave of claves) {
    const valor = datos[clave];
    if (typeof valor === "string" && valor.trim()) {
      return valor.trim();
    }
  }
  return "";
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

function SolicitarVoluntariado() {
  const [usuario] = useState(() => obtenerUsuarioActual());
  const [formulario, setFormulario] = useState(() => crearFormularioInicial(obtenerUsuarioActual()));
  const [horariosSeleccionados, setHorariosSeleccionados] = useState([]);
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
  } = usePaintPublicPage('voluntariado');

  const esGrupal = formulario.modalidad === "grupal";
  const esTipoOtro = formulario.tipo === "Otro";
  const esNacionalCr = formulario.esNacional === "si";
  const consultaCedulaRef = useRef({ digitos: "", enCurso: false });

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
  }, [formulario.identificacion, esNacionalCr]);

  const limpiarError = (campo) => {
    if (errores[campo]) {
      setErrores((prev) => {
        const next = { ...prev };
        delete next[campo];
        return next;
      });
    }
  };

  const handleFechaChange = (campo) => (valor) => {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
    limpiarError(campo);
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
      residencia: "",
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

  const consultarDatosCedula = async (digitos, { forzar = false } = {}) => {
    if (!esNacionalCr || digitos.length !== 9) return;
    if (consultaCedulaRef.current.enCurso) return;
    if (!forzar && consultaCedulaRef.current.digitos === digitos) return;

    consultaCedulaRef.current = { digitos, enCurso: true };
    setConsultandoCedula(true);
    setAvisoCedula(null);

    try {
      const datos = await consultarCedula(digitos);
      const nombre = obtenerCampoCedula(datos, "nombre", "Nombre");

      if (!nombre) {
        consultaCedulaRef.current = { digitos: "", enCurso: false };
        setNombreAutocargado(false);
        setFormulario((prev) => ({
          ...prev,
          nombre: "",
        }));
        setAvisoCedula("No se encontraron datos para esta cédula. Complete el nombre manualmente.");
        return;
      }

      consultaCedulaRef.current = { digitos, enCurso: false };
      setNombreAutocargado(true);
      setFormulario((prev) => ({
        ...prev,
        identificacion: digitos,
        nombre,
        pais: "Costa Rica",
      }));
      setAvisoCedula("Nombre cargado automáticamente. Puede editarlo si es necesario.");
      limpiarError("nombre");
      limpiarError("identificacion");
    } catch (error) {
      consultaCedulaRef.current = { digitos: "", enCurso: false };
      setNombreAutocargado(false);
      setFormulario((prev) => ({
        ...prev,
        nombre: "",
      }));
      const mensajeBase = error?.message?.trim() || "No se pudo consultar la cédula.";
      const yaIndicaManual = /manualmente|completar el nombre/i.test(mensajeBase);
      const esConexion = error?.cause?.code === "ERR_NETWORK" || /conectar con el servidor/i.test(mensajeBase);
      setAvisoCedula(
        yaIndicaManual
          ? mensajeBase
          : esConexion
            ? `${mensajeBase} Mientras tanto, complete el nombre manualmente.`
            : `${mensajeBase} Complete el nombre manualmente.`,
      );
    } finally {
      setConsultandoCedula(false);
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

    if (!esNacionalCr) {
      return;
    }

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

  const toggleHorario = (id) => {
    setHorariosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    );
    limpiarError("horarios");
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formulario.esNacional) {
      nuevosErrores.esNacional = "Indique si es nacional costarricense";
    }

    const nombre = formulario.nombre?.trim();
    if (!nombre) nuevosErrores.nombre = "El nombre es obligatorio";
    else if (nombre.length < 3) nuevosErrores.nombre = "Mínimo 3 caracteres";

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
      nuevosErrores.pais = "Ingrese el país de residencia";
    }

    const residencia = formulario.residencia?.trim();
    if (!residencia) nuevosErrores.residencia = "El lugar de residencia es obligatorio";

    const correo = formulario.correo?.trim();
    if (!correo) nuevosErrores.correo = "El correo es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      nuevosErrores.correo = "Correo inválido";
    }

    const telefono = formulario.telefono?.trim();
    if (!telefono) nuevosErrores.telefono = "El teléfono es obligatorio";

    if (!formulario.tipo) {
      nuevosErrores.tipo = "Seleccione el tipo de voluntariado";
    } else if (esTipoOtro && !formulario.tipoOtro?.trim()) {
      nuevosErrores.tipoOtro = "Especifique el tipo de voluntariado";
    }

    if (!formulario.fechaInicio) nuevosErrores.fechaInicio = "Seleccione la fecha de inicio";
    if (!formulario.fechaFin) nuevosErrores.fechaFin = "Seleccione la fecha de fin";

    if (formulario.fechaInicio && formulario.fechaFin && formulario.fechaFin < formulario.fechaInicio) {
      nuevosErrores.fechaFin = "La fecha fin debe ser posterior al inicio";
    }

    if (horariosSeleccionados.length === 0) {
      nuevosErrores.horarios = "Seleccione al menos un horario";
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
    setHorariosSeleccionados([]);
    setErrores({});
    setErrorApi(null);
    setAvisoCedula(null);
    setNombreAutocargado(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usuario) {
      sessionStorage.setItem("postLoginRedirect", "/voluntariado/solicitar");
      setErrorApi("Debe iniciar sesión antes de enviar una solicitud de voluntariado.");
      return;
    }

    if (!validarFormulario()) return;

    if (esNacionalCr && !formulario.nombre?.trim()) {
      setAvisoCedula("Ingrese su nombre completo o verifique la cédula.");
      return;
    }

    const horariosLabel = HORARIOS_PREFERIDOS.filter((h) =>
      horariosSeleccionados.includes(h.id)
    ).map((h) => h.label);

    const tipoFinal = esTipoOtro ? formulario.tipoOtro.trim() : formulario.tipo;

    const datosEnvio = {
      modalidad: formulario.modalidad,
      cantidadParticipantes: esGrupal ? Number(formulario.cantidadParticipantes) : 1,
      tipoVoluntariado: tipoFinal,
      nombre: formulario.nombre.trim(),
      identificacion: esNacionalCr
        ? normalizarCedulaCr(formulario.identificacion)
        : formulario.identificacion.trim(),
      institucion: formulario.institucion.trim(),
      pais: formulario.pais.trim(),
      residencia: formulario.residencia.trim(),
      email: formulario.correo.trim(),
      telefono: formulario.telefono.trim(),
      periodoDisponibilidad: { inicio: formulario.fechaInicio, fin: formulario.fechaFin },
      horariosPreferidos: horariosLabel,
    };

    setEnviando(true);
    setErrorApi(null);

    try {
      await crearSolicitud({
        userId: String(usuario.id || usuario.email || usuario.username),
        nombre: datosEnvio.nombre,
        email: datosEnvio.email,
        telefono: datosEnvio.telefono,
        tipoVoluntariado: datosEnvio.tipoVoluntariado,
        identificacion: datosEnvio.identificacion,
        institucion: datosEnvio.institucion,
        pais: datosEnvio.pais,
        modalidad: datosEnvio.modalidad,
        cantidadParticipantes: datosEnvio.cantidadParticipantes,
        residencia: datosEnvio.residencia,
        horario: horariosLabel.join(", "),
        dias: `${formulario.fechaInicio} - ${formulario.fechaFin}`,
        area: tipoFinal,
        descripcion: `Periodo: ${formulario.fechaInicio} - ${formulario.fechaFin}.${
          esGrupal ? ` Cantidad de participantes: ${formulario.cantidadParticipantes}.` : ""
        }`,
        motivacion: "",
      });

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
        className={`voluntariado-page${showPrepaint ? ' voluntariado-page--prepaint' : ''}`}
        inert={inert}
      >
      <BackToHomeLink homeSection={HOME_SCROLL_SECTIONS.voluntariado} />

      <section id="voluntariado" className="voluntariado-section">
        <div className="voluntariado-header">
          <span className="badge badge--voluntariado">Programa de Voluntariado</span>
          <h1>Únete a nuestras iniciativas de voluntariado</h1>
          <p>
            Complete el siguiente formulario para aplicar al área de
            voluntariado de su interés.
          </p>
        </div>

        {!usuario ? (
          <div className="auth-required-card">
            <div className="auth-required-card__icono">
              <Lock size={28} strokeWidth={1.8} aria-hidden="true" />
            </div>
            <h2>Inicie sesión para enviar su solicitud</h2>
            <p>
              Para registrar y consultar el estado de sus solicitudes de voluntariado,
              primero debe ingresar con su cuenta.
            </p>
            <Link
              to="/login"
              className="btn-enviar auth-required-card__btn"
              onClick={() => sessionStorage.setItem("postLoginRedirect", "/voluntariado/solicitar")}
            >
              Iniciar sesión
            </Link>
          </div>
        ) : !enviado ? (
          <form onSubmit={handleSubmit} className="formulario-card" noValidate>
            <div className="tipo-postulacion">
              <p>
                ¿Cómo desea participar? <span className="req">*</span>
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
                  <span className="radio-custom" />
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
                  <span className="radio-custom" />
                  <span>Grupal</span>
                </label>
              </div>
            </div>

            <div className="form-secciones">
              <SectionCard icon={User} title="Información personal">
                <div className="form-grid">
                  <div className="campo full">
                    <p className="campo-pregunta">
                      ¿Es nacional costarricense? <span className="req">*</span>
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
                        <span className="radio-custom" />
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
                        <span className="radio-custom" />
                        <span>No</span>
                      </label>
                    </div>
                    {errores.esNacional && (
                      <span className="mensaje-error">{errores.esNacional}</span>
                    )}
                  </div>

                  <div className="campo full">
                    <label>
                      {esNacionalCr ? "Número de cédula" : "Documento de identificación"}{" "}
                      <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      name="identificacion"
                      placeholder={esNacionalCr ? "Cédula de 9 dígitos" : "Pasaporte o documento de identidad"}
                      value={formulario.identificacion}
                      onChange={handleChange}
                      onBlur={esNacionalCr ? handleIdentificacionBlur : undefined}
                      maxLength={esNacionalCr ? 9 : 30}
                      inputMode={esNacionalCr ? "numeric" : "text"}
                      autoComplete="off"
                      disabled={!formulario.esNacional}
                    />
                    {consultandoCedula && (
                      <span className="mensaje-info">Consultando datos de la cédula...</span>
                    )}
                    {!consultandoCedula && avisoCedula && (
                      <span className={esAvisoCedulaInformativo(avisoCedula) ? "mensaje-info" : "mensaje-error"}>
                        {avisoCedula}
                      </span>
                    )}
                    {errores.identificacion && (
                      <span className="mensaje-error">{errores.identificacion}</span>
                    )}
                  </div>

                  <div className="campo">
                    <label>
                      Nombre completo <span className="req">*</span>
                    </label>
                    {esNacionalCr ? (
                      <>
                        <input
                          type="text"
                          name="nombre"
                          placeholder={
                            consultandoCedula
                              ? "Consultando..."
                              : nombreAutocargado
                                ? ""
                                : "Ingrese su nombre completo"
                          }
                          value={formulario.nombre}
                          onChange={handleChange}
                          maxLength={80}
                          disabled={!formulario.esNacional}
                        />
                        {nombreAutocargado && (
                          <span className="mensaje-info">
                            Puede corregir el nombre si no coincide.
                          </span>
                        )}
                        {!formulario.nombre?.trim() && !consultandoCedula && formulario.identificacion.length === 9 && (
                          <span className="mensaje-info">
                            Si no se cargan los datos, complete el nombre manualmente.
                          </span>
                        )}
                      </>
                    ) : (
                      <input
                        type="text"
                        name="nombre"
                        placeholder="Ingrese su nombre completo"
                        value={formulario.nombre}
                        onChange={handleChange}
                        maxLength={80}
                        disabled={!formulario.esNacional}
                      />
                    )}
                    {errores.nombre && <span className="mensaje-error">{errores.nombre}</span>}
                  </div>

                  <div className="campo">
                    <label>
                      Institución educativa <span className="req">*</span>
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
                      Lugar de residencia <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      name="residencia"
                      placeholder="Ciudad, cantón o provincia"
                      value={formulario.residencia}
                      onChange={handleChange}
                      disabled={!formulario.esNacional}
                    />
                    {errores.residencia && (
                      <span className="mensaje-error">{errores.residencia}</span>
                    )}
                  </div>

                  <div className="campo">
                    <label>
                      País de residencia <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      name="pais"
                      placeholder="Ej. Costa Rica"
                      value={formulario.pais}
                      onChange={handleChange}
                      readOnly={esNacionalCr}
                      className={esNacionalCr ? "input-solo-lectura" : ""}
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
                          Correo electrónico <span className="req">*</span>
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
                          Número de teléfono <span className="req">*</span>
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
                  title="Participantes"
                  hint="Indique cuántas personas asistirán"
                >
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
                </SectionCard>
              )}

              <SectionCard icon={HandHeart} title="Información del voluntariado">
                <div className="form-grid">
                  <div className="campo">
                    <label>
                      Disponibilidad desde <span className="req">*</span>
                    </label>
                    <SelectorFecha
                      name="fechaInicio"
                      value={formulario.fechaInicio}
                      onChange={handleFechaChange("fechaInicio")}
                      placeholder="Seleccionar fecha de inicio"
                    />
                    {errores.fechaInicio && (
                      <span className="mensaje-error">{errores.fechaInicio}</span>
                    )}
                  </div>

                  <div className="campo">
                    <label>
                      Disponibilidad hasta <span className="req">*</span>
                    </label>
                    <SelectorFecha
                      name="fechaFin"
                      value={formulario.fechaFin}
                      onChange={handleFechaChange("fechaFin")}
                      min={formulario.fechaInicio || undefined}
                      placeholder="Seleccionar fecha de fin"
                    />
                    {errores.fechaFin && (
                      <span className="mensaje-error">{errores.fechaFin}</span>
                    )}
                  </div>
                </div>

                <div className="campo">
                  <label>
                    Horario preferido <span className="req">*</span>
                  </label>
                  <div className="checkbox-lista checkbox-lista--compacta">
                    {HORARIOS_PREFERIDOS.map((h) => (
                      <label key={h.id} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={horariosSeleccionados.includes(h.id)}
                          onChange={() => toggleHorario(h.id)}
                        />
                        <span>{h.label}</span>
                      </label>
                    ))}
                  </div>
                  {errores.horarios && (
                    <span className="mensaje-error">{errores.horarios}</span>
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

            <div className="acciones-formulario">
              <button type="submit" className="btn-enviar" disabled={enviando}>
                {enviando ? "Enviando..." : "Enviar Solicitud"}
              </button>
            </div>
          </form>
        ) : (
          <div className="confirmacion">
            <div className="confirmacion__icono">
              <Check size={28} strokeWidth={2.2} aria-hidden="true" />
            </div>
            <h2>Solicitud enviada</h2>
            <p>Su solicitud fue registrada correctamente.</p>
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
