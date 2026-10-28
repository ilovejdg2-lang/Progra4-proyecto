import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, MapPin, Store } from "lucide-react";

import BackToHomeLink from "../../Components/BackToHomeLink/BackToHomeLink";
import PageLoading from "../../Components/PageLoading/PageLoading";
import { ST } from "../../Components/T/ST";
import { ImageFilePicker } from "../../Components/ui/ImageFilePicker";
import { SelectFiltro } from "../../Components/ui/SelectFiltro";
import { usePaintPublicPage } from "../../hooks/usePaintPublicPage";
import { HOME_SCROLL_SECTIONS } from "../../lib/homeScrollTarget";
import { useTraducir } from "../../hooks/useTraducir";
import {
  cantonesDeProvincia,
  distritosDeCanton,
  PROVINCIAS_CR,
} from "../../lib/costaRicaDivisiones";
import {
  AYUDA_DESCRIPCION,
  DESCRIPCION_MAX,
  DIRECCION_MAX,
  NOMBRE_MAX,
  PASOS_PROPUESTA,
  TERMINOS_TEXTO,
  validarEnlaceUbicacion,
  validarFormularioPropuesta,
  validarPasoPropuesta,
} from "../../lib/propuestaProductor";
import CampoUbicacionMapa from "../../Components/Productores/CampoUbicacionMapa";
import {
  archivoADataUrl,
  dataUrlAArchivo,
  eliminarBorradorPropuesta,
  guardarBorradorPropuesta,
  leerBorradorPropuesta,
} from "../../lib/propuestaProductorDraft";
import { crearPropuestaProductor } from "../../services/propuestasProductoresService";
import { getActiveSessionUser, SESSION_UPDATED_EVENT } from "../../services/sessionService";
import { rutaMisPropuestas } from "./MisPropuestas";
import "../Donaciones/SolicitarDonacion.css";
import "../Voluntariado/SolicitarVoluntariado.css";
import "./propuesta.css";

const INICIAL = {
  nombre: "",
  descripcion: "",
  provincia: "",
  canton: "",
  distrito: "",
  direccion: "",
  enlaceUbicacion: "",
  latitud: "",
  longitud: "",
  facebook: "",
  instagram: "",
  whatsapp: "",
  sitioWeb: "",
  correo: "",
  telefono: "",
  aceptaTerminos: false,
};

const TOTAL_PASOS = PASOS_PROPUESTA.length;

function nuevaClave() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `clave-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function idUsuario(usuario) {
  if (!usuario) return "";
  return String(usuario.id ?? usuario.Id ?? usuario.userId ?? "").trim();
}

function valorRevision(valor) {
  const texto = String(valor ?? "").trim();
  return texto || "—";
}

export default function PropuestaProductor() {
  const navigate = useNavigate();
  const { ref, showLoading, showPrepaint, inert, loadingMessage } = usePaintPublicPage("productores");
  const tEnviar = useTraducir("Enviar propuesta");
  const tEnviando = useTraducir("Enviando propuesta...");
  const tLoginBtn = useTraducir("Inicie sesión para enviar");
  const tContinuar = useTraducir("Continuar");
  const tAnterior = useTraducir("Anterior");
  const [usuario, setUsuario] = useState(() => getActiveSessionUser());
  const [form, setForm] = useState(INICIAL);
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState("");
  const [errores, setErrores] = useState({});
  const [errorApi, setErrorApi] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);
  const [paso, setPaso] = useState(0);
  const [listoBorrador, setListoBorrador] = useState(false);
  const claveRef = useRef(nuevaClave());
  const previewRef = useRef("");
  const enviandoRef = useRef(false);
  const formRef = useRef(form);
  const archivoRef = useRef(archivo);
  const pasoRef = useRef(paso);
  const usuarioIdRef = useRef(idUsuario(usuario));

  formRef.current = form;
  archivoRef.current = archivo;
  pasoRef.current = paso;
  usuarioIdRef.current = idUsuario(usuario);

  useEffect(() => {
    const sync = () => setUsuario(getActiveSessionUser());
    window.addEventListener(SESSION_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SESSION_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelado = false;
    const userId = idUsuario(usuario);

    async function recuperar() {
      if (!userId) {
        setListoBorrador(true);
        return;
      }
      const draft = leerBorradorPropuesta(userId);
      if (!draft) {
        if (!cancelado) setListoBorrador(true);
        return;
      }
      if (draft.form && typeof draft.form === "object") {
        setForm({ ...INICIAL, ...draft.form, aceptaTerminos: Boolean(draft.form.aceptaTerminos) });
      }
      if (typeof draft.paso === "number" && draft.paso >= 0 && draft.paso < TOTAL_PASOS) {
        setPaso(draft.paso);
      }
      if (draft.claveIdempotencia) claveRef.current = String(draft.claveIdempotencia);
      if (draft.imagen?.dataUrl) {
        const file = await dataUrlAArchivo(draft.imagen);
        if (!cancelado && file) {
          if (previewRef.current) URL.revokeObjectURL(previewRef.current);
          const url = URL.createObjectURL(file);
          previewRef.current = url;
          setArchivo(file);
          setPreview(url);
        }
      }
      if (!cancelado) setListoBorrador(true);
    }

    setListoBorrador(false);
    recuperar();
    return () => {
      cancelado = true;
    };
  }, [usuario]);

  useEffect(() => {
    if (!listoBorrador) return;
    const userId = usuarioIdRef.current;
    if (!userId) return;

    const timer = window.setTimeout(() => {
      const base = {
        form: formRef.current,
        paso: pasoRef.current,
        claveIdempotencia: claveRef.current,
      };
      const archivoActual = archivoRef.current;
      if (!archivoActual) {
        guardarBorradorPropuesta(userId, { ...base, imagen: null });
        return;
      }
      const previo = leerBorradorPropuesta(userId);
      guardarBorradorPropuesta(userId, { ...base, imagen: previo?.imagen ?? null });
      const snapshot = archivoActual;
      void archivoADataUrl(snapshot).then((imagen) => {
        if (archivoRef.current !== snapshot) return;
        guardarBorradorPropuesta(userId, {
          form: formRef.current,
          paso: pasoRef.current,
          claveIdempotencia: claveRef.current,
          imagen,
        });
      });
    }, 280);

    return () => window.clearTimeout(timer);
  }, [form, paso, archivo, listoBorrador, usuario]);

  const irAlLogin = useCallback(() => {
    sessionStorage.setItem("postLoginRedirect", "/productores/propuesta");
    navigate({ to: "/login" });
  }, [navigate]);

  const redirigirSiNoHaySesion = useCallback(
    (event) => {
      if (usuario) return;
      event.preventDefault();
      event.stopPropagation();
      irAlLogin();
    },
    [usuario, irAlLogin],
  );

  const cambiar = (campo, valor) => {
    setForm((prev) => {
      if (campo === "provincia") return { ...prev, provincia: valor, canton: "", distrito: "" };
      if (campo === "canton") return { ...prev, canton: valor, distrito: "" };
      if (campo === "enlaceUbicacion") {
        return { ...prev, enlaceUbicacion: valor, latitud: "", longitud: "" };
      }
      return { ...prev, [campo]: valor };
    });
    setErrores((prev) => {
      if (!prev[campo]) return prev;
      const next = { ...prev };
      delete next[campo];
      return next;
    });
  };

  const elegirImagen = (file) => {
    setArchivo(file);
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = file ? URL.createObjectURL(file) : "";
    previewRef.current = url;
    setPreview(url);
    setErrores((prev) => {
      if (!prev.imagen) return prev;
      const next = { ...prev };
      delete next.imagen;
      return next;
    });
  };

  const irAPaso = (indice) => {
    if (indice < 0 || indice >= TOTAL_PASOS) return;
    if (indice > paso) {
      for (let i = paso; i < indice; i += 1) {
        const validacion = validarPasoPropuesta(i, form, archivo);
        if (Object.keys(validacion).length > 0) {
          setErrores(validacion);
          setPaso(i);
          setErrorApi("Revisá los campos marcados antes de continuar.");
          return;
        }
      }
    }
    setErrores({});
    setErrorApi("");
    setPaso(indice);
  };

  const anterior = () => {
    if (paso <= 0) return;
    setErrores({});
    setErrorApi("");
    setPaso((p) => p - 1);
  };

  const continuar = () => {
    const validacion = validarPasoPropuesta(paso, form, archivo);
    setErrores(validacion);
    if (Object.keys(validacion).length > 0) {
      setErrorApi("Revisá los campos marcados antes de continuar.");
      return;
    }
    setErrorApi("");
    setPaso((p) => Math.min(p + 1, TOTAL_PASOS - 1));
  };

  const enviar = async (event) => {
    event.preventDefault();
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    if (!usuario) {
      enviandoRef.current = false;
      irAlLogin();
      return;
    }
    const validacion = validarFormularioPropuesta(form, archivo);
    setErrores(validacion);
    if (Object.keys(validacion).length > 0) {
      enviandoRef.current = false;
      const orden = [0, 1, 2, 3];
      const primero = orden.find((i) => Object.keys(validarPasoPropuesta(i, form, archivo)).length > 0);
      if (primero != null) setPaso(primero);
      setErrorApi("Revisá los campos marcados antes de enviar.");
      return;
    }
    setEnviando(true);
    setErrorApi("");
    const datos = new FormData();
    datos.append("claveIdempotencia", claveRef.current);
    datos.append("nombre", form.nombre.trim());
    datos.append("descripcion", form.descripcion.trim());
    datos.append("provincia", form.provincia);
    datos.append("canton", form.canton);
    datos.append("distrito", form.distrito);
    datos.append("direccion", form.direccion.trim());
    datos.append("enlaceUbicacion", form.enlaceUbicacion.trim());
    if (form.latitud && form.longitud) {
      datos.append("latitud", String(form.latitud).trim());
      datos.append("longitud", String(form.longitud).trim());
    }
    datos.append("facebook", form.facebook.trim());
    datos.append("instagram", form.instagram.trim());
    datos.append("whatsapp", form.whatsapp.trim());
    datos.append("sitioWeb", form.sitioWeb.trim());
    datos.append("correo", form.correo.trim());
    datos.append("telefono", form.telefono.trim());
    datos.append("aceptaTerminos", "true");
    datos.append("imagen", archivo);
    try {
      const respuesta = await crearPropuestaProductor(datos);
      if (!respuesta?.id || !respuesta?.fechaEnvio) {
        throw new Error("El servidor no confirmó el registro de la propuesta.");
      }
      eliminarBorradorPropuesta(idUsuario(usuario));
      setConfirmacion(respuesta);
    } catch (error) {
      setErrorApi(error?.message || "No se pudo enviar la propuesta. Podés intentar de nuevo.");
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  };

  const pagina = `voluntariado-page propuesta-page${showPrepaint ? " voluntariado-page--prepaint" : ""}`;
  const metaPaso = PASOS_PROPUESTA[paso];

  if (confirmacion) {
    return (
      <>
        {showLoading ? <PageLoading message={loadingMessage} /> : null}
        <main ref={ref} className={pagina} inert={inert}>
          <BackToHomeLink homeSection={HOME_SCROLL_SECTIONS.voluntariado} />
          <section className="voluntariado-section">
            <div className="confirmacion">
              <div className="confirmacion__icono">
                <Check size={28} strokeWidth={2.2} aria-hidden="true" />
              </div>
              <h2><ST>Propuesta enviada</ST></h2>
              <p><ST>{confirmacion.mensaje}</ST></p>
              <p>
                <ST>Número de propuesta:</ST> {confirmacion.id}
                <br />
                <ST>Fecha de envío:</ST>{" "}
                {new Date(confirmacion.fechaEnvio).toLocaleString("es-CR", {
                  dateStyle: "short",
                  timeStyle: "short",
                  timeZone: "America/Costa_Rica",
                })}
                <br />
                <ST>Estado:</ST> <ST>{confirmacion.estado}</ST>
              </p>
              <Link className="btn-enviar" to={rutaMisPropuestas(usuario)}>
                <ST>Mis propuestas</ST>
              </Link>
            </div>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      {showLoading ? <PageLoading message={loadingMessage} /> : null}
      <main ref={ref} className={pagina} inert={inert}>
        <BackToHomeLink homeSection={HOME_SCROLL_SECTIONS.voluntariado} />
        <section className="voluntariado-section">
          <nav className="propuesta-breadcrumb" aria-label="breadcrumb">
            <Link to="/"><ST>Inicio</ST></Link>
            <span aria-hidden="true">/</span>
            <Link to="/productores"><ST>Productores</ST></Link>
            <span aria-hidden="true">/</span>
            <span><ST>Registro</ST></span>
          </nav>

          <div className="voluntariado-header">
            <h1><ST>Propuesta de productor</ST></h1>
            <p><ST>Contanos sobre tu emprendimiento para que el equipo de Café UNA pueda revisarlo.</ST></p>
          </div>

          <div className="donacion-intro">
            <div className="donacion-intro__encabezado">
              <Store size={20} aria-hidden="true" />
              <h2><ST>Promoción del emprendimiento</ST></h2>
            </div>
            <p>
              <ST>
                Café UNA usa este espacio para dar a conocer tu emprendimiento: quiénes son, qué producen y cómo contactarlos. La publicación busca promover tu proyecto. Café UNA no vende tus productos ni comercializa en tu nombre.
              </ST>
            </p>
          </div>

          <div className="propuesta-wizard">
            <aside className="propuesta-wizard__nav" aria-label="Progreso del registro">
              <p className="propuesta-wizard__nav-label"><ST>Tu registro</ST></p>
              <ol className="propuesta-wizard__steps">
                {PASOS_PROPUESTA.map((item, index) => {
                  const activo = index === paso;
                  const hecho = index < paso;
                  return (
                    <li key={item.id} className={`propuesta-wizard__step${activo ? " is-active" : ""}${hecho ? " is-done" : ""}`}>
                      <button
                        type="button"
                        className="propuesta-wizard__step-btn"
                        aria-current={activo ? "step" : undefined}
                        onClick={() => irAPaso(index)}
                      >
                        <span className="propuesta-wizard__step-num" aria-hidden="true">
                          {hecho ? <Check size={14} strokeWidth={2.5} /> : index + 1}
                        </span>
                        <span className="propuesta-wizard__step-text"><ST>{item.titulo}</ST></span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </aside>

            <form
              className="formulario-card propuesta-wizard__panel"
              onSubmit={enviar}
              noValidate
              onFocusCapture={redirigirSiNoHaySesion}
              onPointerDownCapture={redirigirSiNoHaySesion}
            >
              <p className="propuesta-wizard__paso-meta">
                <ST>Paso</ST> {paso + 1} <ST>de</ST> {TOTAL_PASOS}
              </p>
              <h2 className="propuesta-wizard__titulo"><ST>{metaPaso.titulo}</ST></h2>
              <p className="propuesta-wizard__hint"><ST>{metaPaso.hint}</ST></p>

              {paso === 0 ? (
                <div className="propuesta-wizard__campos">
                  <div className="form-grid">
                    <div className="campo full">
                      <label htmlFor="nombre">
                        <ST>Nombre del emprendimiento o empresa</ST>
                        <span className="req">*</span>
                      </label>
                      <input
                        id="nombre"
                        maxLength={NOMBRE_MAX}
                        placeholder="Cafetal Don Juan"
                        value={form.nombre}
                        aria-invalid={Boolean(errores.nombre)}
                        aria-describedby={errores.nombre ? "nombre-error" : undefined}
                        onChange={(event) => cambiar("nombre", event.target.value)}
                      />
                      {errores.nombre ? <span className="mensaje-error" id="nombre-error"><ST>{errores.nombre}</ST></span> : null}
                    </div>
                    <div className="campo full">
                      <label htmlFor="descripcion">
                        <ST>Descripción del negocio o producto</ST>
                        <span className="req">*</span>
                      </label>
                      <textarea
                        id="descripcion"
                        rows={6}
                        maxLength={DESCRIPCION_MAX}
                        value={form.descripcion}
                        aria-invalid={Boolean(errores.descripcion)}
                        aria-describedby="descripcion-ayuda"
                        onChange={(event) => cambiar("descripcion", event.target.value)}
                      />
                      <span className="mensaje-info" id="descripcion-ayuda">
                        <ST>{AYUDA_DESCRIPCION}</ST> ({form.descripcion.trim().length}/{DESCRIPCION_MAX})
                      </span>
                      {errores.descripcion ? <span className="mensaje-error"><ST>{errores.descripcion}</ST></span> : null}
                    </div>
                  </div>
                  <div className="campo">
                    <label htmlFor="imagen">
                      <ST>Imagen representativa</ST>
                      <span className="req">*</span>
                    </label>
                    <div className="documento-upload-wrapper">
                      {archivo ? (
                        <div className="documento-preview-card">
                          <div className="documento-preview__info">
                            {preview ? <img src={preview} alt="Vista previa de la imagen seleccionada" className="propuesta-imagen-mini" /> : null}
                            <div>
                              <p className="documento-preview__nombre">{archivo.name}</p>
                              <p className="documento-preview__tamano">{(archivo.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button type="button" className="propuesta-reemplazar" disabled={enviando} onClick={() => elegirImagen(null)}>
                            <ST>Quitar imagen</ST>
                          </button>
                        </div>
                      ) : null}
                      <ImageFilePicker
                        id="imagen"
                        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                        hint="JPG, JPEG, PNG o WebP (máx. 5 MB)"
                        onSelect={elegirImagen}
                        disabled={enviando}
                        required
                        error={errores.imagen}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {paso === 1 ? (
                <div className="propuesta-wizard__campos">
                  <div className="form-grid">
                    <div className="campo">
                      <label htmlFor="provincia">
                        <ST>Provincia</ST>
                        <span className="req">*</span>
                      </label>
                      <SelectFiltro id="provincia" name="provincia" value={form.provincia} onChange={(event) => cambiar(event.target.name, event.target.value)}>
                        <option value=""><ST>Seleccione una opción</ST></option>
                        {PROVINCIAS_CR.map((provincia) => (
                          <option key={provincia} value={provincia}>{provincia}</option>
                        ))}
                      </SelectFiltro>
                      {errores.provincia ? <span className="mensaje-error"><ST>{errores.provincia}</ST></span> : null}
                    </div>
                    <div className="campo">
                      <label htmlFor="canton">
                        <ST>Cantón</ST>
                        <span className="req">*</span>
                      </label>
                      <SelectFiltro
                        id="canton"
                        name="canton"
                        value={form.canton}
                        disabled={!form.provincia}
                        onChange={(event) => cambiar(event.target.name, event.target.value)}
                      >
                        <option value=""><ST>Seleccione una opción</ST></option>
                        {cantonesDeProvincia(form.provincia).map((canton) => (
                          <option key={canton} value={canton}>{canton}</option>
                        ))}
                      </SelectFiltro>
                      {errores.canton ? <span className="mensaje-error"><ST>{errores.canton}</ST></span> : null}
                    </div>
                    <div className="campo">
                      <label htmlFor="distrito">
                        <ST>Distrito</ST>
                        <span className="req">*</span>
                      </label>
                      <SelectFiltro
                        id="distrito"
                        name="distrito"
                        value={form.distrito}
                        disabled={!form.canton}
                        onChange={(event) => cambiar(event.target.name, event.target.value)}
                      >
                        <option value=""><ST>Seleccione una opción</ST></option>
                        {distritosDeCanton(form.provincia, form.canton).map((distrito) => (
                          <option key={distrito} value={distrito}>{distrito}</option>
                        ))}
                      </SelectFiltro>
                      {errores.distrito ? <span className="mensaje-error"><ST>{errores.distrito}</ST></span> : null}
                    </div>
                  </div>
                  <div className="campo">
                    <label htmlFor="direccion">
                      <ST>Dirección o señas adicionales</ST>
                      <span className="req">*</span>
                    </label>
                    <textarea
                      id="direccion"
                      name="direccion"
                      rows={3}
                      maxLength={DIRECCION_MAX}
                      value={form.direccion}
                      aria-invalid={Boolean(errores.direccion)}
                      onChange={(event) => cambiar("direccion", event.target.value)}
                    />
                    {errores.direccion ? <span className="mensaje-error"><ST>{errores.direccion}</ST></span> : null}
                  </div>
                  <div className="campo">
                    <label htmlFor="enlaceUbicacion">
                      <ST>Enlace de Google Maps o Waze</ST>
                      <span className="req">*</span>
                    </label>
                    <input
                      id="enlaceUbicacion"
                      inputMode="url"
                      placeholder="Enlace de un lugar en Costa Rica (Maps o Waze)"
                      value={form.enlaceUbicacion}
                      aria-invalid={Boolean(errores.enlaceUbicacion)}
                      onChange={(event) => cambiar("enlaceUbicacion", event.target.value)}
                      onBlur={(event) => {
                        const valor = event.target.value.trim();
                        if (!valor) return;
                        const errorEnlace = validarEnlaceUbicacion(valor);
                        if (errorEnlace) {
                          setErrores((prev) => ({ ...prev, enlaceUbicacion: errorEnlace }));
                        }
                      }}
                    />
                    {errores.enlaceUbicacion ? <span className="mensaje-error"><ST>{errores.enlaceUbicacion}</ST></span> : null}
                    {form.enlaceUbicacion && !validarEnlaceUbicacion(form.enlaceUbicacion) ? (
                      <a className="auth-banner__link" href={form.enlaceUbicacion} target="_blank" rel="noopener noreferrer">
                        <MapPin size={16} aria-hidden="true" /> <ST>Abrir ubicación</ST>
                      </a>
                    ) : null}
                    <CampoUbicacionMapa
                      enlaceUbicacion={form.enlaceUbicacion}
                      latitud={form.latitud}
                      longitud={form.longitud}
                      onChangeCoords={({ latitud, longitud }) => {
                        setForm((prev) => ({ ...prev, latitud, longitud }));
                      }}
                    />
                  </div>
                </div>
              ) : null}

              {paso === 2 ? (
                <div className="propuesta-wizard__campos">
                  <div className="form-grid">
                    <div className="campo">
                      <label htmlFor="correo">
                        <ST>Correo electrónico de contacto</ST>
                        <span className="req">*</span>
                      </label>
                      <input
                        id="correo"
                        type="email"
                        autoComplete="email"
                        value={form.correo}
                        aria-invalid={Boolean(errores.correo)}
                        onChange={(event) => cambiar("correo", event.target.value)}
                      />
                      {errores.correo ? <span className="mensaje-error"><ST>{errores.correo}</ST></span> : null}
                    </div>
                    <div className="campo">
                      <label htmlFor="telefono">
                        <ST>Teléfono de contacto</ST>
                        <span className="req">*</span>
                      </label>
                      <input
                        id="telefono"
                        type="tel"
                        autoComplete="tel"
                        placeholder="8888 8888"
                        value={form.telefono}
                        aria-invalid={Boolean(errores.telefono)}
                        onChange={(event) => cambiar("telefono", event.target.value)}
                      />
                      {errores.telefono ? <span className="mensaje-error"><ST>{errores.telefono}</ST></span> : null}
                    </div>
                    <div className="campo">
                      <label htmlFor="facebook">Facebook</label>
                      <input id="facebook" inputMode="url" value={form.facebook} onChange={(event) => cambiar("facebook", event.target.value)} />
                      {errores.facebook ? <span className="mensaje-error"><ST>{errores.facebook}</ST></span> : null}
                    </div>
                    <div className="campo">
                      <label htmlFor="instagram">Instagram</label>
                      <input id="instagram" inputMode="url" value={form.instagram} onChange={(event) => cambiar("instagram", event.target.value)} />
                      {errores.instagram ? <span className="mensaje-error"><ST>{errores.instagram}</ST></span> : null}
                    </div>
                    <div className="campo">
                      <label htmlFor="whatsapp">WhatsApp</label>
                      <input id="whatsapp" inputMode="tel" placeholder="+506 8888 8888" value={form.whatsapp} onChange={(event) => cambiar("whatsapp", event.target.value)} />
                      {errores.whatsapp ? <span className="mensaje-error"><ST>{errores.whatsapp}</ST></span> : null}
                    </div>
                    <div className="campo">
                      <label htmlFor="sitioWeb"><ST>Sitio web</ST></label>
                      <input id="sitioWeb" inputMode="url" value={form.sitioWeb} onChange={(event) => cambiar("sitioWeb", event.target.value)} />
                      {errores.sitioWeb ? <span className="mensaje-error"><ST>{errores.sitioWeb}</ST></span> : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {paso === 3 ? (
                <div className="propuesta-wizard__campos">
                  <div className="propuesta-revision">
                    <section>
                      <div className="propuesta-revision__cabecera">
                        <h3><ST>Emprendimiento</ST></h3>
                        <button type="button" className="propuesta-revision__editar" onClick={() => irAPaso(0)}>
                          <ST>Editar</ST>
                        </button>
                      </div>
                      <dl>
                        <div>
                          <dt><ST>Nombre</ST></dt>
                          <dd>{valorRevision(form.nombre)}</dd>
                        </div>
                        <div>
                          <dt><ST>Descripción</ST></dt>
                          <dd className="propuesta-revision__largo">{valorRevision(form.descripcion)}</dd>
                        </div>
                        <div>
                          <dt><ST>Imagen</ST></dt>
                          <dd>
                            {archivo ? (
                              <span className="propuesta-revision__imagen">
                                {preview ? <img src={preview} alt="" className="propuesta-imagen-mini" /> : null}
                                {archivo.name}
                              </span>
                            ) : (
                              "—"
                            )}
                          </dd>
                        </div>
                      </dl>
                    </section>
                    <section>
                      <div className="propuesta-revision__cabecera">
                        <h3><ST>Ubicación</ST></h3>
                        <button type="button" className="propuesta-revision__editar" onClick={() => irAPaso(1)}>
                          <ST>Editar</ST>
                        </button>
                      </div>
                      <dl>
                        <div>
                          <dt><ST>Provincia</ST></dt>
                          <dd>{valorRevision(form.provincia)}</dd>
                        </div>
                        <div>
                          <dt><ST>Cantón</ST></dt>
                          <dd>{valorRevision(form.canton)}</dd>
                        </div>
                        <div>
                          <dt><ST>Distrito</ST></dt>
                          <dd>{valorRevision(form.distrito)}</dd>
                        </div>
                        <div>
                          <dt><ST>Dirección</ST></dt>
                          <dd className="propuesta-revision__largo">{valorRevision(form.direccion)}</dd>
                        </div>
                        <div>
                          <dt><ST>Enlace</ST></dt>
                          <dd className="propuesta-revision__largo">{valorRevision(form.enlaceUbicacion)}</dd>
                        </div>
                      </dl>
                    </section>
                    <section>
                      <div className="propuesta-revision__cabecera">
                        <h3><ST>Contacto</ST></h3>
                        <button type="button" className="propuesta-revision__editar" onClick={() => irAPaso(2)}>
                          <ST>Editar</ST>
                        </button>
                      </div>
                      <dl>
                        <div>
                          <dt><ST>Correo</ST></dt>
                          <dd>{valorRevision(form.correo)}</dd>
                        </div>
                        <div>
                          <dt><ST>Teléfono</ST></dt>
                          <dd>{valorRevision(form.telefono)}</dd>
                        </div>
                        <div>
                          <dt>Facebook</dt>
                          <dd className="propuesta-revision__largo">{valorRevision(form.facebook)}</dd>
                        </div>
                        <div>
                          <dt>Instagram</dt>
                          <dd className="propuesta-revision__largo">{valorRevision(form.instagram)}</dd>
                        </div>
                        <div>
                          <dt>WhatsApp</dt>
                          <dd>{valorRevision(form.whatsapp)}</dd>
                        </div>
                        <div>
                          <dt><ST>Sitio web</ST></dt>
                          <dd className="propuesta-revision__largo">{valorRevision(form.sitioWeb)}</dd>
                        </div>
                      </dl>
                    </section>
                  </div>

                  <div className="donacion-checks">
                    <label htmlFor="aceptaTerminos">
                      <input
                        id="aceptaTerminos"
                        type="checkbox"
                        checked={form.aceptaTerminos}
                        onChange={(event) => cambiar("aceptaTerminos", event.target.checked)}
                      />
                      <span>
                        <ST>{TERMINOS_TEXTO}</ST>
                        <span className="req">*</span>
                      </span>
                    </label>
                    {errores.aceptaTerminos ? <span className="mensaje-error"><ST>{errores.aceptaTerminos}</ST></span> : null}
                  </div>
                </div>
              ) : null}

              <p className="propuesta-wizard__obligatorios">
                <span className="req">*</span> <ST>Campos obligatorios</ST>
              </p>

              {errorApi ? <p className="form-error" role="alert" data-form-error><ST>{errorApi}</ST></p> : null}

              <div className="propuesta-wizard__acciones">
                <button
                  type="button"
                  className="propuesta-wizard__btn-atras"
                  onClick={anterior}
                  disabled={paso === 0 || enviando}
                >
                  {tAnterior}
                </button>
                {paso < TOTAL_PASOS - 1 ? (
                  <button type="button" className="propuesta-wizard__btn-seguir" onClick={continuar} disabled={enviando}>
                    {tContinuar}
                    <ArrowRight size={18} aria-hidden="true" />
                  </button>
                ) : (
                  <button type="submit" className="propuesta-wizard__btn-seguir" disabled={enviando || !usuario}>
                    {enviando ? tEnviando : !usuario ? tLoginBtn : tEnviar}
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
