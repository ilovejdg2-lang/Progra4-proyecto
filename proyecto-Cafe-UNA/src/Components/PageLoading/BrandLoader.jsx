import { useEffect, useState } from "react";
import {
  ADMIN_THEME_CHANGED_EVENT,
  isAdminThemeDark,
} from "../../lib/adminTheme";
import {
  cacheBrandLogos,
  getLoaderLogoUrl,
  LOGO_CLARO_FALLBACK,
  LOGO_OSCURO_FALLBACK,
  readBrandLogos,
} from "../../lib/brandLogoCache";
import { normalizeImageUrl } from "../../lib/imageUtils";
import { obtenerNavbar } from "../../services/informacionService";
import { ST } from "../T/ST";
import "./BrandLoader.css";

function pickNavbarLogos(navbar) {
  const logoUrl =
    (typeof navbar?.logoUrl === "string" && navbar.logoUrl.trim()) ||
    (typeof navbar?.LogoUrl === "string" && navbar.LogoUrl.trim()) ||
    "";
  const logoClaroUrl =
    (typeof navbar?.logoClaroUrl === "string" && navbar.logoClaroUrl.trim()) ||
    (typeof navbar?.LogoClaroUrl === "string" && navbar.LogoClaroUrl.trim()) ||
    "";
  return { logoUrl, logoClaroUrl };
}

function BrandLoaderLogo({ preferDark }) {
  const [logos, setLogos] = useState(() => readBrandLogos());
  const [logoBroken, setLogoBroken] = useState(false);

  useEffect(() => {
    let activo = true;
    setLogos(readBrandLogos());
    setLogoBroken(false);

    obtenerNavbar()
      .then((navbar) => {
        if (!activo) return;
        const next = pickNavbarLogos(navbar);
        if (!next.logoUrl && !next.logoClaroUrl) return;
        cacheBrandLogos(next);
        setLogos(next);
        setLogoBroken(false);
      })
      .catch(() => {});

    return () => {
      activo = false;
    };
  }, []);

  // En fondo oscuro SIEMPRE priorizar logo claro (blanco/rojo); nunca el logo oscuro.
  const resolved = preferDark
    ? logos.logoClaroUrl || LOGO_CLARO_FALLBACK
    : logos.logoUrl || LOGO_OSCURO_FALLBACK || logos.logoClaroUrl;
  const src = normalizeImageUrl(
    (!logoBroken && resolved) || getLoaderLogoUrl({ dark: preferDark }),
    { width: 480 },
  );
  const showImage = Boolean(src) && !logoBroken;

  return (
    <div className="brand-loader__mark">
      {showImage ? (
        <img
          className="brand-loader__logo"
          src={src}
          alt=""
          decoding="async"
          onError={() => {
            // Si falló el de CMS, reintentar con el estático blanco/rojo en dark.
            if (preferDark && src && !src.includes("logoblancoyrojo")) {
              setLogos((prev) => ({ ...prev, logoClaroUrl: LOGO_CLARO_FALLBACK }));
              setLogoBroken(false);
              return;
            }
            setLogoBroken(true);
          }}
        />
      ) : (
        <span className="brand-loader__spinner brand-loader__spinner--inline" aria-hidden="true" />
      )}
    </div>
  );
}

export default function BrandLoader({
  message,
  detail = "",
  tone = "site",
  showSpinner = true,
  children,
}) {
  const [temaOscuro, setTemaOscuro] = useState(() => isAdminThemeDark());

  useEffect(() => {
    const sync = () => setTemaOscuro(isAdminThemeDark());
    sync();
    window.addEventListener(ADMIN_THEME_CHANGED_EVENT, sync);
    return () => window.removeEventListener(ADMIN_THEME_CHANGED_EVENT, sync);
  }, []);

  const preferDark = tone === "admin" && temaOscuro;

  return (
    <div
      className={[
        "brand-loader",
        `brand-loader--${tone}`,
        preferDark ? "brand-loader--dark" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="brand-loader__glow" aria-hidden="true" />
      <BrandLoaderLogo preferDark={preferDark || tone === "hero"} />
      {showSpinner ? <span className="brand-loader__spinner" aria-hidden="true" /> : null}
      <div className="brand-loader__copy">
        {message ? (
          <p className="brand-loader__message">
            {typeof message === "string" ? <ST>{message}</ST> : message}
          </p>
        ) : null}
        {detail ? (
          <p className="brand-loader__detail">
            {typeof detail === "string" ? <ST>{detail}</ST> : detail}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}
