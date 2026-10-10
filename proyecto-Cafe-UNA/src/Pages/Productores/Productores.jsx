import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Globe, MapPin, Sprout, X } from "lucide-react";

import { FacebookIcon, InstagramIcon } from "../../Components/Footer/SocialIcons";
import PageLoading from "../../Components/PageLoading/PageLoading";
import { ST } from "../../Components/T/ST";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { usePaintPublicPage } from "../../hooks/usePaintPublicPage";
import { urlImagenPublica } from "../../lib/propuestaProductor";
import { obtenerProductoresPublicos } from "../../services/propuestasProductoresService";
import { getActiveSessionUser, SESSION_UPDATED_EVENT } from "../../services/sessionService";
import { rutaMisPropuestas } from "./MisPropuestas";
import "./propuesta.css";

function enlacePublico(valor) {
  const texto = String(valor || "").trim();
  if (!texto) return "";
  try {
    const url = new URL(texto);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.href;
  } catch {
    return "";
  }
}

function lugarCorto(item) {
  const zona = String(item?.distrito || item?.canton || "").trim();
  const provincia = String(item?.provincia || "").trim();
  if (zona && provincia && zona.toLowerCase() !== provincia.toLowerCase()) {
    return `${zona}, ${provincia}`;
  }
  return zona || provincia || String(item?.direccion || "").trim();
}

function IconoWhatsApp({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.5-4.2A8 8 0 1 1 20 11.5z" />
      <path d="M9.2 9.4c.2-.4.4-.4.7-.4h.6c.2 0 .4 0 .5.4.2.5.6 1.6.6 1.7.1.2 0 .4-.1.5l-.3.4c-.1.1-.2.3-.1.5.2.4.7 1.1 1.4 1.5.6.3 1 .4 1.2.2l.5-.5c.2-.2.3-.2.6-.1.2.1 1.4.7 1.6.8.2.1.4.2.4.4.1.3 0 1.5-.7 1.8-.6.3-1.4.2-2.3-.1-1.3-.5-2.6-1.5-3.6-2.8-.8-1.1-1.5-2.4-1.6-2.8-.2-.5 0-1.1.2-1.5z" />
    </svg>
  );
}

function redesVisibles(item) {
  return [
    { id: "instagram", etiqueta: "Instagram", href: enlacePublico(item?.instagram), icono: <InstagramIcon size={16} /> },
    { id: "facebook", etiqueta: "Facebook", href: enlacePublico(item?.facebook), icono: <FacebookIcon size={16} /> },
    { id: "whatsapp", etiqueta: "WhatsApp", href: enlacePublico(item?.whatsapp), icono: <IconoWhatsApp /> },
    { id: "sitio", etiqueta: "Sitio web", href: enlacePublico(item?.sitioWeb), icono: <Globe size={16} aria-hidden="true" /> },
  ].filter((red) => red.href);
}

function DetalleProductor({ productor, onClose }) {
  const tituloId = useId();
  const cerrarRef = useRef(null);
  const lugar = lugarCorto(productor);
  const mapa = enlacePublico(productor?.enlaceUbicacion);
  const redes = redesVisibles(productor);
  useBodyScrollLock(true);

  useEffect(() => {
    cerrarRef.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="productor-dialog">
      <div className="productor-dialog__fondo" onClick={onClose} />
      <div
        className="productor-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
      >
        <button
          ref={cerrarRef}
          type="button"
          className="productor-dialog__cerrar"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <X size={18} aria-hidden="true" />
        </button>
        <img src={urlImagenPublica(productor.imagenUrl)} alt={productor.nombre || ""} />
        <div className="productor-dialog__contenido">
          <h2 id={tituloId}>{productor.nombre}</h2>
          <section>
            <h3><ST>Sobre el emprendimiento</ST></h3>
            <p>{productor.descripcion}</p>
          </section>
          {lugar || mapa ? (
            <section>
              <h3><ST>Ubicación</ST></h3>
              {lugar ? (
                <p className="productor-dialog__lugar">
                  <MapPin size={16} aria-hidden="true" />
                  <span>{lugar}</span>
                </p>
              ) : null}
              {mapa ? (
                <a className="productor-dialog__mapa" href={mapa} target="_blank" rel="noopener noreferrer">
                  <ST>Abrir en Google Maps</ST>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </a>
              ) : null}
            </section>
          ) : null}
          {redes.length > 0 ? (
            <section>
              <h3><ST>Encuéntranos en</ST></h3>
              <div className="productor-dialog__redes">
                {redes.map((red) => (
                  <a key={red.id} href={red.href} target="_blank" rel="noopener noreferrer">
                    {red.icono}
                    <ST>{red.etiqueta}</ST>
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function Productores() {
  const navigate = useNavigate();
  const { ref, showLoading, showPrepaint, inert, loadingMessage } = usePaintPublicPage("productores");
  const [usuario, setUsuario] = useState(() => getActiveSessionUser());
  const [productores, setProductores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const disparadorRef = useRef(null);

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
    let activo = true;
    obtenerProductoresPublicos()
      .then((items) => {
        if (activo) setProductores(items);
      })
      .catch((err) => {
        if (activo) setError(err?.message || "No se pudieron cargar los productores.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const abrirMisPropuestas = (event) => {
    if (usuario) return;
    event.preventDefault();
    sessionStorage.setItem("postLoginRedirect", "/perfil/propuestas");
    navigate({ to: "/login" });
  };

  const cerrarDetalle = useCallback(() => {
    setSeleccionado(null);
    disparadorRef.current?.focus();
  }, []);

  return (
    <>
      {showLoading ? <PageLoading message={loadingMessage} /> : null}
      <main
        ref={ref}
        className={`productores-directorio${showPrepaint ? " propuesta-page--prepaint" : ""}`}
        inert={inert}
      >
        <header className="productores-directorio__hero">
          <h1><ST>Dale a conocer tu emprendimiento</ST></h1>
          <p className="productores-directorio__lead">
            <ST>Comparte tu historia y forma parte del espacio de productores de Café UNA.</ST>
          </p>
          <div className="productores-directorio__acciones">
            <Link className="productores-directorio__boton" to="/productores/propuesta">
              <ST>Enviar propuesta</ST>
            </Link>
            <Link
              className="productores-directorio__boton"
              to={usuario ? rutaMisPropuestas(usuario) : "/login"}
              onClick={abrirMisPropuestas}
            >
              <ST>Mis propuestas</ST>
            </Link>
          </div>
        </header>

        <section className="productores-directorio__lista" aria-labelledby="nuestros-productores">
          <h2 id="nuestros-productores"><ST>Nuestros productores</ST></h2>
          <p className="productores-directorio__lista-lead">
            <ST>Conoce sus historias, sus productos y dónde encontrarlos.</ST>
          </p>

          {cargando ? (
            <div className="productores-directorio__vacio">
              <p><ST>Cargando productores...</ST></p>
            </div>
          ) : null}

          {error ? (
            <div className="productores-directorio__vacio" role="alert">
              <p><ST>{error}</ST></p>
            </div>
          ) : null}

          {!cargando && !error && productores.length === 0 ? (
            <div className="productores-directorio__vacio">
              <Sprout size={42} strokeWidth={1.4} aria-hidden="true" />
              <p className="productores-directorio__vacio-titulo">
                <ST>Pronto conocerás a nuestros productores</ST>
              </p>
              <p><ST>¿Tienes un emprendimiento? Tu propuesta puede ser la primera.</ST></p>
            </div>
          ) : null}

          {!cargando && !error && productores.length > 0 ? (
            <div className="productores-directorio__grid">
              {productores.map((item) => {
                const lugar = lugarCorto(item);
                const mapa = enlacePublico(item.enlaceUbicacion);
                return (
                  <article key={item.id} className="productores-directorio__card">
                    <img src={urlImagenPublica(item.imagenUrl)} alt={item.nombre || ""} />
                    <div className="productores-directorio__cuerpo">
                      <h3>{item.nombre}</h3>
                      {lugar ? (
                        <p className="productores-directorio__lugar">
                          <MapPin size={15} aria-hidden="true" />
                          <span>{lugar}</span>
                        </p>
                      ) : null}
                      <p className="productores-directorio__resumen">{item.descripcion}</p>
                      <div className="productores-directorio__botones">
                        <button
                          type="button"
                          className="productores-directorio__btn productores-directorio__btn--lleno"
                          onClick={(event) => {
                            disparadorRef.current = event.currentTarget;
                            setSeleccionado(item);
                          }}
                        >
                          <ST>Ver detalles</ST>
                          <ArrowRight size={16} aria-hidden="true" />
                        </button>
                        {mapa ? (
                          <a
                            className="productores-directorio__btn productores-directorio__btn--linea"
                            href={mapa}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MapPin size={15} aria-hidden="true" />
                            <ST>Ver ubicación</ST>
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>
      </main>
      {seleccionado ? <DetalleProductor productor={seleccionado} onClose={cerrarDetalle} /> : null}
    </>
  );
}
