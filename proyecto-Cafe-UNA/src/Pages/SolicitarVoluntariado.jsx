
import { useState } from "react";
import "./SolicitarVoluntariado.css";

const tiposVoluntariado = [
  "Voluntariado de Apoyo General",
  "Voluntariado de Actividades de Limpieza",
  "Voluntariado de Capacitaciones",
  "Voluntariado de Investigación Académica",
];

function SolicitarVoluntariado() {

  const [formulario, setFormulario] = useState({
    modalidad: "individual",
  });

  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {

    let valor = e.target.value;

    // Sanitizar espacios
    if (typeof valor === "string") {
      valor = valor.replace(/\s+/g, " ").trimStart();
    }

    // Correo en minúscula
    if (e.target.name === "correo") {
      valor = valor.toLowerCase();
    }

    setFormulario({
      ...formulario,
      [e.target.name]: valor,
    });
  };

  const validarFormulario = () => {

    let nuevosErrores = {};

    // =========================
    // NOMBRE
    // =========================

    const nombre = formulario.nombre?.trim();

    if (!nombre) {
      nuevosErrores.nombre = "El nombre es obligatorio";
    } else if (nombre.length < 3) {
      nuevosErrores.nombre = "Mínimo 3 caracteres";
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(nombre)) {
      nuevosErrores.nombre = "Solo letras y espacios";
    } else if (nombre.split(" ").length < 2) {
      nuevosErrores.nombre = "Ingrese nombre y apellido";
    }

    // =========================
    // EMAIL
    // =========================

    const correo = formulario.correo?.trim();

    if (!correo) {
      nuevosErrores.correo = "El correo es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      nuevosErrores.correo = "Correo inválido";
    }

    // =========================
    // IDENTIFICACIÓN
    // =========================

    const identificacion = formulario.identificacion?.trim();

    if (!identificacion) {
      nuevosErrores.identificacion = "La identificación es obligatoria";
    } else if (!/^\d+$/.test(identificacion)) {
      nuevosErrores.identificacion = "Solo números";
    } else if (identificacion.length < 9) {
      nuevosErrores.identificacion = "Debe tener mínimo 9 dígitos";
    }

    // =========================
    // TELÉFONO
    // =========================

    const telefono = formulario.telefono?.trim();

    if (!telefono) {
      nuevosErrores.telefono = "El teléfono es obligatorio";
    } else if (!/^(\+506)?\d{8}$/.test(telefono)) {
      nuevosErrores.telefono = "Número inválido";
    }

    // =========================
    // INSTITUCIÓN
    // =========================

    if (!formulario.institucion) {
      nuevosErrores.institucion = "Seleccione una institución";
    }

    // =========================
    // PAÍS
    // =========================

    if (!formulario.pais) {
      nuevosErrores.pais = "Seleccione un país";
    }

    // =========================
    // MODALIDAD GRUPAL
    // =========================

    if (
      formulario.modalidad === "grupal" &&
      !formulario.cantidadParticipantes
    ) {
      nuevosErrores.cantidadParticipantes =
        "Ingrese la cantidad de participantes";
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!validarFormulario()) return;

    setEnviando(true);
    setError(null);

    try {

      await crearSolicitud({
        userId: "anonimo",

        nombre: formulario.nombre,
        email: formulario.correo,
        telefono: formulario.telefono,
        tipoVoluntariado: formulario.tipo,

        identificacion: formulario.identificacion,
        institucion: formulario.institucion,
        pais: formulario.pais,

        modalidad: formulario.modalidad,
        cantidadParticipantes:
          formulario.cantidadParticipantes || 1,

        descripcion: formulario.experiencia ?? "",
        motivacion: formulario.motivacion ?? "",
        residencia: formulario.residencia ?? "",
        horario: formulario.horario ?? "",
        dias: formulario.dias ?? "",
        area: formulario.area ?? "",
      });

      setEnviado(true);

    } catch (err) {

      setError(
        "Ocurrió un error al enviar la solicitud."
      );

      console.error(err);

    } finally {
      setEnviando(false);
    }
  };

  return (

    <section
      id="voluntariado"
      className="voluntariado-section"
    >

      <div className="voluntariado-header">

        <span className="badge badge--voluntariado">
          Programa de Voluntariado
        </span>

        <h2>
          Únete a nuestras iniciativas de voluntariado
        </h2>

        <p>
          Complete el siguiente formulario para aplicar
          al área de voluntariado de su interés.
        </p>

      </div>

      {!enviado ? (

        <form
          onSubmit={handleSubmit}
          className="formulario-card"
        >

          {/* =========================
              MODALIDAD
          ========================= */}

          <div className="tipo-postulacion">

            <p>¿Cómo desea participar?</p>

            <div className="tipo-opciones">

              <label className="radio-card">

                <input
                  type="radio"
                  name="modalidad"
                  value="individual"
                  checked={
                    formulario.modalidad === "individual"
                  }
                  onChange={handleChange}
                />

                <span className="radio-custom"></span>

                <span>Individual</span>

              </label>

              <label className="radio-card">

                <input
                  type="radio"
                  name="modalidad"
                  value="grupal"
                  checked={
                    formulario.modalidad === "grupal"
                  }
                  onChange={handleChange}
                />

                <span className="radio-custom"></span>

                <span>Grupal</span>

              </label>

            </div>

          </div>

          {/* =========================
              CANTIDAD PARTICIPANTES
          ========================= */}

          {formulario.modalidad === "grupal" && (

            <div className="campo cantidad-grupo">

              <label>
                Cantidad de participantes <span>*</span>
              </label>

              <input
                type="number"
                name="cantidadParticipantes"
                min="2"
                max="100"
                placeholder="Ej: 15"
                value={
                  formulario.cantidadParticipantes || ""
                }
                onChange={handleChange}
              />

              {errores.cantidadParticipantes && (
                <span className="mensaje-error">
                  {errores.cantidadParticipantes}
                </span>
              )}

            </div>
          )}

          {/* =========================
              INFORMACIÓN PERSONAL
          ========================= */}

          <div className="form-section">

            <div className="section-title">
              <span></span>
              <h3>INFORMACIÓN PERSONAL</h3>
            </div>

            <div className="form-grid">

              <div className="campo full">

                <label>
                  Tipo de voluntariado <span>*</span>
                </label>

                <select
                  name="tipo"
                  value={formulario.tipo || ""}
                  onChange={handleChange}
                  required
                >

                  <option value="">
                    Seleccione una opción
                  </option>

                  {tiposVoluntariado.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}

                </select>

              </div>

              {/* NOMBRE */}

              <div className="campo full">

                <label>
                  Nombre completo <span>*</span>
                </label>

                <input
                  type="text"
                  name="nombre"
                  placeholder="Ingrese su nombre completo"
                  value={formulario.nombre || ""}
                  onChange={handleChange}
                  maxLength={80}
                />

                {errores.nombre && (
                  <span className="mensaje-error">
                    {errores.nombre}
                  </span>
                )}

              </div>

              {/* IDENTIFICACIÓN */}

              <div className="campo">

                <label>
                  Número de identificación <span>*</span>
                </label>

                <input
                  type="text"
                  name="identificacion"
                  placeholder="Ej: 123456789"
                  value={formulario.identificacion || ""}
                  onChange={handleChange}
                  maxLength={12}
                />

                {errores.identificacion && (
                  <span className="mensaje-error">
                    {errores.identificacion}
                  </span>
                )}

              </div>

              {/* EMAIL */}

              <div className="campo">

                <label>
                  Correo electrónico <span>*</span>
                </label>

                <input
                  type="email"
                  name="correo"
                  placeholder="correo@ejemplo.com"
                  value={formulario.correo || ""}
                  onChange={handleChange}
                />

                {errores.correo && (
                  <span className="mensaje-error">
                    {errores.correo}
                  </span>
                )}

              </div>

              {/* TELÉFONO */}

              <div className="campo">

                <label>
                  Número de teléfono <span>*</span>
                </label>

                <input
                  type="tel"
                  name="telefono"
                  placeholder="88888888"
                  value={formulario.telefono || ""}
                  onChange={handleChange}
                />

                {errores.telefono && (
                  <span className="mensaje-error">
                    {errores.telefono}
                  </span>
                )}

              </div>

              {/* RESIDENCIA */}

              <div className="campo">

                <label>
                  Lugar de residencia <span>*</span>
                </label>

                <input
                  type="text"
                  name="residencia"
                  placeholder="Ciudad, provincia"
                  value={formulario.residencia || ""}
                  onChange={handleChange}
                />

              </div>

              {/* INSTITUCIÓN */}

              <div className="campo">

                <label>
                  Institución educativa <span>*</span>
                </label>

                <select
                  name="institucion"
                  value={formulario.institucion || ""}
                  onChange={handleChange}
                >

                  <option value="">
                    Seleccione una institución
                  </option>

                  <option value="Universidad Nacional">
                    Universidad Nacional
                  </option>

                  <option value="UCR">
                    Universidad de Costa Rica
                  </option>

                  <option value="TEC">
                    Instituto Tecnológico
                  </option>

                </select>

                {errores.institucion && (
                  <span className="mensaje-error">
                    {errores.institucion}
                  </span>
                )}

              </div>

              {/* PAÍS */}

              <div className="campo">

                <label>
                  País de residencia <span>*</span>
                </label>

                <select
                  name="pais"
                  value={formulario.pais || ""}
                  onChange={handleChange}
                >

                  <option value="">
                    Seleccione un país
                  </option>

                  <option value="Costa Rica">
                    Costa Rica
                  </option>

                  <option value="Nicaragua">
                    Nicaragua
                  </option>

                  <option value="Panamá">
                    Panamá
                  </option>

                  <option value="Honduras">
                    Honduras
                  </option>

                </select>

                {errores.pais && (
                  <span className="mensaje-error">
                    {errores.pais}
                  </span>
                )}

              </div>

            </div>
          </div>

          {/* =========================
              INFORMACIÓN VOLUNTARIADO
          ========================= */}

          <div className="form-section">

            <div className="section-title">
              <span></span>
              <h3>INFORMACIÓN DEL VOLUNTARIADO</h3>
            </div>

            <div className="form-grid">

              <div className="campo">

                <label>Horario disponible</label>

                <select
                  name="horario"
                  value={formulario.horario || ""}
                  onChange={handleChange}
                >

                  <option value="">
                    Seleccione un horario
                  </option>

                  <option value="mañana">
                    Mañanas
                  </option>

                  <option value="tarde">
                    Tardes
                  </option>

                  <option value="noche">
                    Noches
                  </option>

                </select>

              </div>

              <div className="campo">

                <label>Días disponibles</label>

                <select
                  name="dias"
                  value={formulario.dias || ""}
                  onChange={handleChange}
                >

                  <option value="">
                    Seleccione los días
                  </option>

                  <option value="lunes-viernes">
                    Lunes a Viernes
                  </option>

                  <option value="fines-semana">
                    Fines de semana
                  </option>

                </select>

              </div>

              <div className="campo">

                <label>Área de interés</label>

                <select
                  name="area"
                  value={formulario.area || ""}
                  onChange={handleChange}
                >

                  <option value="">
                    Seleccione un área
                  </option>

                  <option value="campo">
                    Trabajo de campo
                  </option>

                  <option value="eventos">
                    Eventos
                  </option>

                  <option value="investigacion">
                    Investigación
                  </option>

                </select>

              </div>

            </div>

            <div className="campo">

              <label>Experiencia previa</label>

              <textarea
                name="experiencia"
                placeholder="Describa brevemente su experiencia..."
                value={formulario.experiencia || ""}
                onChange={handleChange}
              />

            </div>

            <div className="campo">

              <label>
                ¿Por qué desea ser voluntario?
              </label>

              <textarea
                name="motivacion"
                placeholder="Comparta su motivación..."
                value={formulario.motivacion || ""}
                onChange={handleChange}
              />

            </div>

          </div>

          {error && (
            <p className="form-error">{error}</p>
          )}

          <div className="acciones-formulario">

            <button
              type="submit"
              className="btn-enviar"
              disabled={enviando}
            >

              {enviando
                ? "Enviando..."
                : "Enviar Solicitud"}

            </button>

          </div>

        </form>

      ) : (

        <div className="confirmacion">

          <div className="confirmacion__icono">
            ✓
          </div>

          <h2>Solicitud enviada</h2>

          <p>
            Su solicitud fue registrada correctamente.
          </p>

          <button
            className="btn-enviar"
            onClick={() => {
              setFormulario({});
              setEnviado(false);
            }}
          >
            Realizar otra solicitud
          </button>

        </div>
      )}

    </section>
  );
}

export default SolicitarVoluntariado;