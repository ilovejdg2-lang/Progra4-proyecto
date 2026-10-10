import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Check, MapPin, UploadCloud } from "lucide-react";

import BackToHomeLink from "../../Components/BackToHomeLink/BackToHomeLink";
import { IconoSitio } from "../../Components/IconoSitio/IconoSitio";
import PageLoading from "../../Components/PageLoading/PageLoading";
import { ST } from "../../Components/T/ST";
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
  TERMINOS_TEXTO,
  validarEnlaceUbicacion,
  validarFormularioPropuesta,
} from "../../lib/propuestaProductor";
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
  facebook: "",
  instagram: "",
  whatsapp: "",
  sitioWeb: "",
  correo: "",
  telefono: "",
  aceptaTerminos: false,
};

function nuevaClave() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `clave-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function SectionCard({ lugar, paso, title, hint, children }) {
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
        {lugar ? <IconoSitio lugar={lugar} size={20} className="section-card__icon-inline" /> : null}
        {hint ? <span className="section-card__hint">{hint}</span> : null}
      </div>
      <div className="section-card__body">{children}</div>
    </div>
  );
}

export default function PropuestaProductor() {
  const navigate = useNavigate();
  const { ref, showLoading, showPrepaint, inert, loadingMessage } = usePaintPublicPage("productores");
  const tEnviar = useTraducir("Enviar propuesta");
  const tEnviando = useTraducir("Enviando propuesta...");
  const tLoginBtn = useTraducir("Inicie sesión para enviar");
  const [usuario, setUsuario] = useState(() => getActiveSessionUser());
  const [form, setForm] = useState(INICIAL);
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState("");
  const [errores, setErrores] = useState({});
  const [errorApi, setErrorApi] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);
  const claveRef = useRef(nuevaClave());
  const previewRef = useRef("");
  const enviandoRef = useRef(false);

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
      return { ...prev, [campo]: valor };
    });
    setErrores((prev) => {
      if (!prev[campo]) return prev;
      const next = { ...prev };
      delete next[campo];
      return next;
    });
  };

  const elegirImagen = (event) => {
    const file = event.target.files?.[0] || null;
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
      setConfirmacion(respuesta);
    } catch (error) {
      setErrorApi(error?.message || "No se pudo enviar la propuesta. Podés intentar de nuevo.");
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  };

  const pagina = `voluntariado-page${showPrepaint ? " voluntariado-page--prepaint" : ""}`;

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
          <div className="voluntariado-header">
            <h1><ST>Propuesta de productor</ST></h1>
            <p><ST>Contanos sobre tu emprendimiento para que el equipo de Café UNA pueda revisarlo.</ST></p>
          </div>

          <form
            className="formulario-card"
            onSubmit={enviar}
            noValidate
            onFocusCapture={redirigirSiNoHaySesion}
            onPointerDownCapture={redirigirSiNoHaySesion}
          >
            <div className="form-secciones">
              <SectionCard
                paso={1}
                lugar="productor.emprendimiento"
                title={<ST>Información del emprendimiento</ST>}
                hint={<ST>El nombre y qué ofrece el emprendimiento.</ST>}
              >
                <div className="campo">
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
                <div className="campo">
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
              </SectionCard>

              <SectionCard
                paso={2}
                lugar="productor.imagen"
                title={<ST>Imagen</ST>}
                hint={<ST>JPG, JPEG, PNG o WebP. Máximo 5 MB. Se recomienda una imagen de buena calidad, preferiblemente cuadrada.</ST>}
              >
                <div className="campo">
                  <label htmlFor="imagen">
                    <ST>Imagen representativa</ST>
                    <span className="req">*</span>
                  </label>
                  <div className="documento-upload-wrapper">
                    {!archivo ? (
                      <label className="documento-upload-dropzone" htmlFor="imagen">
                        <input
                          id="imagen"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                          aria-invalid={Boolean(errores.imagen)}
                          onChange={elegirImagen}
                        />
                        <div className="documento-upload-dropzone__icon">
                          <UploadCloud size={22} />
                        </div>
                        <span className="documento-upload-dropzone__texto">
                          <ST>Hacé clic aquí para elegir la imagen</ST>
                        </span>
                        <span className="documento-upload-dropzone__hint">
                          <ST>JPG, JPEG, PNG o WebP (máx. 5 MB)</ST>
                        </span>
                      </label>
                    ) : (
                      <div className="documento-preview-card">
                        <div className="documento-preview__info">
                          {preview ? <img src={preview} alt="" className="propuesta-imagen-mini" /> : null}
                          <div>
                            <p className="documento-preview__nombre">{archivo.name}</p>
                            <p className="documento-preview__tamano">{(archivo.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <label className="propuesta-reemplazar">
                          <ST>Reemplazar</ST>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                            onChange={elegirImagen}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  {errores.imagen ? <span className="mensaje-error"><ST>{errores.imagen}</ST></span> : null}
                </div>
              </SectionCard>

              <SectionCard
                paso={3}
                lugar="productor.ubicacion"
                title={<ST>Ubicación</ST>}
                hint={<ST>Indique dónde se encuentra el emprendimiento.</ST>}
              >
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
                    value={form.enlaceUbicacion}
                    aria-invalid={Boolean(errores.enlaceUbicacion)}
                    onChange={(event) => cambiar("enlaceUbicacion", event.target.value)}
                  />
                  {errores.enlaceUbicacion ? <span className="mensaje-error"><ST>{errores.enlaceUbicacion}</ST></span> : null}
                  {form.enlaceUbicacion && !validarEnlaceUbicacion(form.enlaceUbicacion) ? (
                    <a className="auth-banner__link" href={form.enlaceUbicacion} target="_blank" rel="noopener noreferrer">
                      <MapPin size={16} aria-hidden="true" /> <ST>Abrir ubicación</ST>
                    </a>
                  ) : null}
                </div>
              </SectionCard>

              <SectionCard
                paso={4}
                lugar="productor.redes"
                title={<ST>Redes sociales</ST>}
                hint={<ST>Opcionales, pero recomendadas.</ST>}
              >
                <div className="form-grid">
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
                    <span className="mensaje-info"><ST>Número con código de país.</ST></span>
                    {errores.whatsapp ? <span className="mensaje-error"><ST>{errores.whatsapp}</ST></span> : null}
                  </div>
                  <div className="campo">
                    <label htmlFor="sitioWeb"><ST>Sitio web</ST></label>
                    <input id="sitioWeb" inputMode="url" value={form.sitioWeb} onChange={(event) => cambiar("sitioWeb", event.target.value)} />
                    {errores.sitioWeb ? <span className="mensaje-error"><ST>{errores.sitioWeb}</ST></span> : null}
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                paso={5}
                lugar="productor.contacto"
                title={<ST>Contacto</ST>}
                hint={<ST>Se utilizará para comunicar el resultado de la propuesta, aunque sea distinto del correo de tu cuenta.</ST>}
              >
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
                    <span className="mensaje-info"><ST>Formato local de Costa Rica o internacional.</ST></span>
                    {errores.telefono ? <span className="mensaje-error"><ST>{errores.telefono}</ST></span> : null}
                  </div>
                </div>
              </SectionCard>

              <SectionCard paso={6} lugar="productor.autorizacion" title={<ST>Autorización</ST>}>
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
              </SectionCard>
            </div>

            {errorApi ? <p className="form-error" role="alert" data-form-error><ST>{errorApi}</ST></p> : null}
            <div className="acciones-formulario">
              <button type="submit" className="btn-enviar" disabled={enviando || !usuario}>
                {enviando ? tEnviando : !usuario ? tLoginBtn : tEnviar}
              </button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
