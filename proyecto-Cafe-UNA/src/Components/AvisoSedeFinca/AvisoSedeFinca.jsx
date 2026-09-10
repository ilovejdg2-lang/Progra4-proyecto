import { ExternalLink, MapPin } from "lucide-react";
import { ST } from "../T/ST";

/**
 * Aviso de sede fija (visitas / voluntariado / entrega de donaciones).
 * `sede` = { nombre, url, linkText } desde sedeDesdeHomeLocation.
 */
export default function AvisoSedeFinca({ sede, contexto = "visita" }) {
  if (!sede?.nombre) return null;

  const mensaje =
    contexto === "donacion"
      ? "La entrega presencial de donaciones se recibe únicamente en la"
      : contexto === "voluntariado"
        ? "El voluntariado se realiza en la"
        : "Las visitas se realizan en la";

  return (
    <aside className="aviso-sede-finca" aria-label="Ubicación">
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
    </aside>
  );
}
