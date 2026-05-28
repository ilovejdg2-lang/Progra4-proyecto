import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import PageLoading from "../../Components/PageLoading/PageLoading";
import { crearSolicitud } from "../../services/voluntariadoService";
import { SectionCard } from "./CalendarioVoluntariado";
import "./SolicitarVoluntariado.css";

const TIPOS_VOLUNTARIADO = [
  "Apoyo General",
  "Capacitaciones",
  "Investigación Académica",
  "Actividades de limpieza y mantenimiento",
  "Otro",
];

const INSTITUCIONES = [
  "Universidad Nacional",
  "Universidad Estatal a Distancia",
  "Universidad de Costa Rica",
  "Instituto Tecnológico",
  "Otra",
];

const PAISES = [
  "Costa Rica",
  "México",
  "Colombia",
  "España",
  "Estados Unidos",
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

function SolicitarVoluntariado() {
  const [usuario, setUsuario] = useState(null);
  const [formulario, setFormulario] = useState(FORM_INICIAL);
  const [horariosSeleccionados, setHorariosSeleccionados] = useState([]);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorApi, setErrorApi] = useState(null);
  const [ready, setReady] = useState(false);

  const esGrupal = formulario.modalidad === "grupal";
  const esTipoOtro = formulario.tipo === "Otro";

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    try {
      setUsuario(storedUser ? JSON.parse(storedUser) : null);
    } catch {
      setUsuario(null);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent("public-route-ready", { detail: { pathname: "/voluntariado/solicitar" } }));
      }, 0);
    }
  }, [ready]);

  const limpiarError = (campo) => {
    if (errores[campo]) {
      setErrores((prev) => {
        const next = { ...prev };
        delete next[campo];
        return next;
      });
    }
  };

  const handleChange = (e) => {
    let valor = e.target.value;

    if (typeof valor === "string") {
      valor = valor.replace(/\s+/g, " ").trimStart();
    }

    if (e.target.name === "correo") {
      valor = valor.toLowerCase();
    }

    setFormulario((prev) => ({
      ...prev,
      [e.target.name]: valor,
    }));

    limpiarError(e.target.name);
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

    const nombre = formulario.nombre?.trim();
    if (!nombre) nuevosErrores.nombre = "El nombre es obligatorio";
    else if (nombre.length < 3) nuevosErrores.nombre = "Mínimo 3 caracteres";

    const identificacion = formulario.identificacion?.trim();
    if (!identificacion) nuevosErrores.identificacion = "La identificación es obligatoria";

    if (!formulario.institucion) nuevosErrores.institucion = "Seleccione una institución";
    if (!formulario.pais) nuevosErrores.pais = "Seleccione un país";

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
    setFormulario(FORM_INICIAL);
    setHorariosSeleccionados([]);
    setErrores({});
    setErrorApi(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usuario) {
      sessionStorage.setItem("postLoginRedirect", "/voluntariado/solicitar");
      setErrorApi("Debe iniciar sesión antes de enviar una solicitud de voluntariado.");
      return;
    }

    if (!validarFormulario()) return;

    const horariosLabel = HORARIOS_PREFERIDOS.filter((h) =>
      horariosSeleccionados.includes(h.id)
    ).map((h) => h.label);

    const tipoFinal = esTipoOtro ? formulario.tipoOtro.trim() : formulario.tipo;

    const datosEnvio = {
      modalidad: formulario.modalidad,
      cantidadParticipantes: esGrupal ? Number(formulario.cantidadParticipantes) : 1,
      tipoVoluntariado: tipoFinal,
      nombre: formulario.nombre.trim(),
      identificacion: formulario.identificacion.trim(),
      institucion: formulario.institucion,
      pais: formulario.pais,
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

  if (!ready) {
    return <PageLoading message="Cargando voluntariado..." />;
  }

  return (
    <div className="voluntariado-page">
      <Link
        to="/"
        className="back-arrow"
        onClick={() => sessionStorage.setItem("scrollToIniciativas", "1")}
      >
        <i className="fas fa-arrow-left" aria-hidden="true" />
        Volver al inicio
      </Link>

      <section id="voluntariado" className="voluntariado-section">
        <div className="voluntariado-header">
          <span className="badge badge--voluntariado">Programa de Voluntariado</span>
          <h2>Únete a nuestras iniciativas de voluntariado</h2>
          <p>
            Complete el siguiente formulario para aplicar al área de
            voluntariado de su interés.
          </p>
        </div>

        {!usuario ? (
          <div className="auth-required-card">
            <div className="auth-required-card__icono">
              <i className="fas fa-lock" aria-hidden="true" />
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
              <SectionCard icon="fas fa-user" title="Información personal">
                <div className="form-grid">
                  <div className="campo full">
                    <label>
                      Nombre completo <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      placeholder="Ingrese su nombre completo"
                      value={formulario.nombre}
                      onChange={handleChange}
                      maxLength={80}
                    />
                    {errores.nombre && <span className="mensaje-error">{errores.nombre}</span>}
                  </div>

                  <div className="campo">
                    <label>
                      Número de identificación <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      name="identificacion"
                      placeholder="Ej. 123456789"
                      value={formulario.identificacion}
                      onChange={handleChange}
                      maxLength={20}
                    />
                    {errores.identificacion && (
                      <span className="mensaje-error">{errores.identificacion}</span>
                    )}
                  </div>

                  <div className="campo">
                    <label>
                      Lugar de residencia <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      name="residencia"
                      placeholder="Ciudad, provincia"
                      value={formulario.residencia}
                      onChange={handleChange}
                    />
                    {errores.residencia && (
                      <span className="mensaje-error">{errores.residencia}</span>
                    )}
                  </div>

                  <div className="campo">
                    <label>
                      Institución educativa <span className="req">*</span>
                    </label>
                    <div className="select-wrap">
                      <select name="institucion" value={formulario.institucion} onChange={handleChange}>
                        <option value="">Seleccione una institución</option>
                        {INSTITUCIONES.map((inst) => (
                          <option key={inst} value={inst}>{inst}</option>
                        ))}
                      </select>
                      <i className="fas fa-chevron-down select-icon" aria-hidden="true" />
                    </div>
                    {errores.institucion && (
                      <span className="mensaje-error">{errores.institucion}</span>
                    )}
                  </div>

                  <div className="campo">
                    <label>
                      País de residencia <span className="req">*</span>
                    </label>
                    <div className="select-wrap">
                      <select name="pais" value={formulario.pais} onChange={handleChange}>
                        <option value="">Seleccione un país</option>
                        {PAISES.map((pais) => (
                          <option key={pais} value={pais}>{pais}</option>
                        ))}
                      </select>
                      <i className="fas fa-chevron-down select-icon" aria-hidden="true" />
                    </div>
                    {errores.pais && <span className="mensaje-error">{errores.pais}</span>}
                  </div>
                </div>
              </SectionCard>

              <SectionCard icon="fas fa-envelope" title="Contacto al solicitante">
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
                  icon="fas fa-users"
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

              <SectionCard icon="fas fa-hand-holding-heart" title="Información del voluntariado">
                <div className="form-grid">
                  <div className="campo">
                    <label>
                      Disponibilidad desde <span className="req">*</span>
                    </label>
                    <input
                      type="date"
                      name="fechaInicio"
                      className="input-fecha-simple"
                      value={formulario.fechaInicio}
                      onChange={handleChange}
                    />
                    {errores.fechaInicio && (
                      <span className="mensaje-error">{errores.fechaInicio}</span>
                    )}
                  </div>

                  <div className="campo">
                    <label>
                      Disponibilidad hasta <span className="req">*</span>
                    </label>
                    <input
                      type="date"
                      name="fechaFin"
                      className="input-fecha-simple"
                      value={formulario.fechaFin}
                      min={formulario.fechaInicio || undefined}
                      onChange={handleChange}
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
                icon="fas fa-seedling"
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
              <i className="fas fa-check" aria-hidden="true" />
            </div>
            <h2>Solicitud enviada</h2>
            <p>Su solicitud fue registrada correctamente.</p>
            <button type="button" className="btn-enviar" onClick={() => setEnviado(false)}>
              Realizar otra solicitud
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
export default SolicitarVoluntariado;
