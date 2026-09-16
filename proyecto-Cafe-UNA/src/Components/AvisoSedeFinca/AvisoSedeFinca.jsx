import { ExternalLink, MapPin } from "lucide-react";
import { useMemo } from "react";
import { toGoogleMapsEmbedUrl } from "../../lib/googleMaps";
import { ST } from "../T/ST";
import { useTraducir } from "../../hooks/useTraducir";
import "./AvisoSedeFinca.css";

/**
 * Aviso de sede fija (visitas / voluntariado / entrega de donaciones).
 * Incluye mapa embebido cuando la URL de Maps se puede convertir a iframe.
 * `sede` = { nombre, url, linkText } desde sedeDesdeHomeLocation.
 */
export default function AvisoSedeFinca({ sede, contexto = "visita" }) {
  const tMapa = useTraducir("Mapa de ubicación");
  const embedUrl = useMemo(
    () => (sede?.url ? toGoogleMapsEmbedUrl(sede.url) : ""),
    [sede?.url],
  );

  if (!sede?.nombre) return null;

  const mensaje =
    contexto === "donacion"
      ? "La entrega presencial de donaciones se recibe únicamente en la"
      : contexto === "voluntariado"
        ? "El voluntariado se realiza en la"
        : "Las visitas se realizan en la";

  return (
    <aside className="aviso-sede-finca" aria-label="Ubicación">
      <div className="aviso-sede-finca__cabecera">
        <MapPin className="aviso-sede-finca__icono" size={20} aria-hidden="true" />
        <div className="aviso-sede-finca__contenido">
          <p className="aviso-sede-finca__texto">
            <ST>{mensaje}</ST>{" "}
            <strong>{sede.nombre}</strong>.
          </p>
          {sede.url ? (
            <a
              className="aviso-sede-finca__link"
              href={sede.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ST>{sede.linkText || "Ver en Google Maps"}</ST>
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>
      {embedUrl ? (
        <div className="aviso-sede-finca__mapa">
          <iframe
            title={tMapa}
            src={embedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      ) : null}
    </aside>
  );
}
