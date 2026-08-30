import { useEffect, useState } from "react";
import {
  cacheBrandLogos,
  getLoaderLogoUrl,
} from "../../lib/brandLogoCache";
import { normalizeImageUrl } from "../../lib/imageUtils";
import { obtenerNavbar } from "../../services/informacionService";
import "./BrandLoader.css";

function pickNavbarLogo(navbar) {
  const logoUrl =
    (typeof navbar?.logoUrl === "string" && navbar.logoUrl.trim()) ||
    (typeof navbar?.LogoUrl === "string" && navbar.LogoUrl.trim()) ||
    "";
  const logoClaroUrl =
    (typeof navbar?.logoClaroUrl === "string" && navbar.logoClaroUrl.trim()) ||
    (typeof navbar?.LogoClaroUrl === "string" && navbar.LogoClaroUrl.trim()) ||
    "";
  return { logoUrl, logoClaroUrl, src: logoUrl || logoClaroUrl };
}

function BrandLoaderLogo() {
  const [logoUrl, setLogoUrl] = useState(() => getLoaderLogoUrl());
  const [logoBroken, setLogoBroken] = useState(false);

  useEffect(() => {
    let activo = true;
    const cached = getLoaderLogoUrl();
    if (cached) {
      setLogoUrl(cached);
      setLogoBroken(false);
    }

    obtenerNavbar()
      .then((navbar) => {
        if (!activo) return;
        const { logoUrl: nextLogo, logoClaroUrl, src } = pickNavbarLogo(navbar);
        if (!src) return;
        cacheBrandLogos({ logoUrl: nextLogo, logoClaroUrl });
        setLogoUrl(src);
        setLogoBroken(false);
      })
      .catch(() => {});

    return () => {
      activo = false;
    };
  }, []);

  const src = normalizeImageUrl(logoUrl, { width: 480 });
  const showImage = Boolean(src) && !logoBroken;

  return (
    <div className="brand-loader__mark">
      {showImage ? (
        <img
          className="brand-loader__logo"
          src={src}
          alt=""
          decoding="async"
          onError={() => setLogoBroken(true)}
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
  return (
    <div className={`brand-loader brand-loader--${tone}`}>
      <div className="brand-loader__glow" aria-hidden="true" />
      <BrandLoaderLogo />
      {showSpinner ? <span className="brand-loader__spinner" aria-hidden="true" /> : null}
      <div className="brand-loader__copy">
        {message ? <p className="brand-loader__message">{message}</p> : null}
        {detail ? <p className="brand-loader__detail">{detail}</p> : null}
        {children}
      </div>
    </div>
  );
}
