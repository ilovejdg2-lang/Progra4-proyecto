import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Globe, MapPin, Send, Sprout, X } from "lucide-react";

import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "../../Components/Footer/SocialIcons";
import PageLoading from "../../Components/PageLoading/PageLoading";
import { ST } from "../../Components/T/ST";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { usePaintPublicPage } from "../../hooks/usePaintPublicPage";
import { urlImagenPublica } from "../../lib/propuestaProductor";
import { obtenerProductoresPublicos } from "../../services/propuestasProductoresService";
import { getActiveSessionUser, SESSION_UPDATED_EVENT } from "../../services/sessionService";
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

function redesVisibles(item) {
  return [
    { id: "instagram", etiqueta: "Instagram", href: enlacePublico(item?.instagram), icono: <InstagramIcon size={16} /> },
    { id: "facebook", etiqueta: "Facebook", href: enlacePublico(item?.facebook), icono: <FacebookIcon size={16} /> },
    { id: "whatsapp", etiqueta: "WhatsApp", href: enlacePublico(item?.whatsapp), icono: <WhatsAppIcon /> },
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
        if (!activo) return;
        setProductores(items);
        const pedido = new URLSearchParams(window.location.search).get("productor");
        const encontrado = pedido ? items.find((item) => String(item.id) === pedido) : null;
        if (encontrado) setSeleccionado(encontrado);
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
        <section id="nuestros-productores" className="productores-directorio__lista" aria-labelledby="nuestros-productores-titulo">
          <div className="productores-directorio__header-top">
            <div>
              <h1 id="nuestros-productores-titulo" className="productores-directorio__title">
                <ST>Propuestas de productores</ST>
              </h1>
              <p className="productores-directorio__lista-lead">
                <ST>Conoce los emprendimientos de café participantes, sus productos y dónde encontrarlos.</ST>
              </p>
            </div>
            <div className="productores-directorio__header-actions">
              <Link to="/productores/propuesta" className="productores-directorio__btn-enviar">
                <Send size={15} aria-hidden="true" />
                <span><ST>Enviar propuesta</ST></span>
              </Link>
            </div>
          </div>

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
