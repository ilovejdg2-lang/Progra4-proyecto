import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { FileText, MapPin, Minus, Plus, Search, Send, Sprout } from "lucide-react";
import { ST } from "../T/ST";
import { useIdioma } from "../../lib/useIdioma";
import { DEFAULT_PRODUCTORES_HERO, obtenerProductoresHero } from "../../services/informacionService";
import { obtenerProductoresPublicos } from "../../services/propuestasProductoresService";
import { useSessionUser } from "../../hooks/useSessionUser";
import { rutaMisPropuestas } from "../../lib/rutasPropuestas";
import "./ProductoresHero.css";

const TOPE_UBICACIONES_EXTRA = 5;

/** + (productores mostrados − 1), con tope de +5. Con uno o ninguno no hay extras. */
export function cantidadUbicacionesExtra(total) {
  const cantidad = Number(total);
  if (!Number.isFinite(cantidad) || cantidad <= 1) return 0;
  return Math.min(TOPE_UBICACIONES_EXTRA, cantidad - 1);
}

/** El CMS puede traer "+5 Ubicaciones activas"; el número se calcula aparte. */
export function etiquetaUbicacionesHero(textoCms, respaldo) {
  const limpio = String(textoCms || "").trim().replace(/^\+\s*\d+\s*/, "").trim();
  return limpio || respaldo;
}

function AccionHeroBoton({ to, className, children, onClick }) {
  if (!to) return null;

  if (to.startsWith("#")) {
    return (
      <a
        href={to}
        className={className}
        onClick={(e) => {
          if (onClick) onClick(e);
          const el = document.querySelector(to);
          if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: "smooth" });
          }
        }}
      >
        {children}
      </a>
    );
  }

  if (to.startsWith("http://") || to.startsWith("https://")) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <Link to={to} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

export default function ProductoresHero({ className = "", customData = null }) {
  const navigate = useNavigate();
  const { esEn } = useIdioma();
  const usuario = useSessionUser();
  const [heroInfo, setHeroInfo] = useState(customData || DEFAULT_PRODUCTORES_HERO);
  const [productoresCount, setProductoresCount] = useState(0);
  const [mapZoom, setMapZoom] = useState(1);

  useEffect(() => {
    if (customData) {
      setHeroInfo(customData);
      return;
    }
    let activo = true;
    obtenerProductoresHero()
      .then((info) => {
        if (activo && info) setHeroInfo(info);
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [customData]);

  useEffect(() => {
    let activo = true;
    obtenerProductoresPublicos()
      .then((items) => {
        if (activo && Array.isArray(items)) {
          setProductoresCount(items.length);
        }
      })
      .catch(() => {});
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

  const zoomIn = () => setMapZoom((z) => Math.min(1.6, +(z + 0.15).toFixed(2)));
  const zoomOut = () => setMapZoom((z) => Math.max(1, +(z - 0.15).toFixed(2)));

  const eyebrow = (esEn ? heroInfo.eyebrowEn : null) || heroInfo.eyebrow || DEFAULT_PRODUCTORES_HERO.eyebrow;
  const title = (esEn ? heroInfo.titleEn : null) || heroInfo.title || DEFAULT_PRODUCTORES_HERO.title;
  const description = (esEn ? heroInfo.descriptionEn : null) || heroInfo.description || DEFAULT_PRODUCTORES_HERO.description;
  const primaryText = (esEn ? heroInfo.linkTextEn : null) || heroInfo.linkText || DEFAULT_PRODUCTORES_HERO.linkText;
  const primaryUrl = heroInfo.linkUrl || DEFAULT_PRODUCTORES_HERO.linkUrl;
  const secondaryText = (esEn ? heroInfo.secondaryButtonTextEn : null) || heroInfo.secondaryButtonText || DEFAULT_PRODUCTORES_HERO.secondaryButtonText;
  const rawSecondaryUrl = String(heroInfo.secondaryButtonUrl || DEFAULT_PRODUCTORES_HERO.secondaryButtonUrl || "/productores").trim();
  const secondaryUrl = (rawSecondaryUrl === "#nuestros-productores" || !rawSecondaryUrl) ? "/productores" : rawSecondaryUrl;
  const tertiaryText = (esEn ? heroInfo.tertiaryButtonTextEn : null) || heroInfo.tertiaryButtonText || DEFAULT_PRODUCTORES_HERO.tertiaryButtonText;
  const tertiaryUrl = heroInfo.tertiaryButtonUrl || DEFAULT_PRODUCTORES_HERO.tertiaryButtonUrl;

  const etiquetaUbicaciones = etiquetaUbicacionesHero(
    (esEn ? heroInfo.footerTextEn : null) || heroInfo.footerText,
    esEn ? "Active locations" : "Ubicaciones activas",
  );
  const ubicacionesExtra = cantidadUbicacionesExtra(productoresCount);
  const footerText = ubicacionesExtra > 0 ? `+${ubicacionesExtra} ${etiquetaUbicaciones}` : "";
  const fondoImagen = heroInfo.image || DEFAULT_PRODUCTORES_HERO.image;

  return (
    <section className={`productores-hero ${className}`.trim()} aria-label="Portada de Productores Locales">
      <div
        className="productores-hero__map-bg"
        style={{
          backgroundImage: `url("${fondoImagen}")`,
          transform: `scale(${mapZoom})`,
        }}
      />
      <div className="productores-hero__overlay" />

      <div className="productores-hero__container">
        <article className="productores-hero__card">
          <div className="productores-hero__card-body">
            {eyebrow ? (
              <div className="productores-hero__badge">
                <Sprout size={14} className="productores-hero__badge-icon" aria-hidden="true" />
                <span><ST>{eyebrow}</ST></span>
              </div>
            ) : null}

            <h2 className="productores-hero__title">
              <ST>{title}</ST>
            </h2>

            {description ? (
              <p className="productores-hero__description">
                <ST>{description}</ST>
              </p>
            ) : null}

            <div className="productores-hero__actions">
              {primaryText ? (
                <AccionHeroBoton to={primaryUrl} className="productores-hero__btn-primary">
                  <Send size={15} aria-hidden="true" />
                  <span><ST>{primaryText}</ST></span>
                </AccionHeroBoton>
              ) : null}

              {secondaryText ? (
                <AccionHeroBoton to={secondaryUrl} className="productores-hero__btn-secondary">
                  <Search size={15} aria-hidden="true" />
                  <span><ST>{secondaryText}</ST></span>
                </AccionHeroBoton>
              ) : null}
            </div>
          </div>

          {footerText ? (
            <div className="productores-hero__card-footer">
              <MapPin size={16} className="productores-hero__footer-icon" aria-hidden="true" />
              <span><ST>{footerText}</ST></span>
            </div>
          ) : null}
        </article>
      </div>

      <div className="productores-hero__map-controls" aria-label="Controles de mapa">
        <button
          type="button"
          className="productores-hero__map-btn"
          onClick={zoomIn}
          title={esEn ? "Zoom in" : "Acercar mapa"}
          aria-label={esEn ? "Zoom in" : "Acercar mapa"}
        >
          <Plus size={18} aria-hidden="true" />
        </button>
        <div className="productores-hero__map-btn-divider" />
        <button
          type="button"
          className="productores-hero__map-btn"
          onClick={zoomOut}
          title={esEn ? "Zoom out" : "Alejar mapa"}
          aria-label={esEn ? "Zoom out" : "Alejar mapa"}
        >
          <Minus size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="productores-hero__map-attribution">
        <span>Finca Santa Lucía · Mapa</span>
      </div>
    </section>
  );
}
