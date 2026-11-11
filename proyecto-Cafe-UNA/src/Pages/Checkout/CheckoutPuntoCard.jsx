import { useState } from "react";
import { ExternalLink, MapPin, Package, Store } from "lucide-react";

import { ImageLightbox } from "../../Components/ImageLightbox/ImageLightbox";
import { ST } from "../../Components/T/ST";
import { useTraducir } from "../../hooks/useTraducir";
import { normalizeImageUrl } from "../../lib/imageUtils";
import { esUrlGoogleMaps } from "../../lib/puntoVentaPresentacion";

export function CheckoutPuntoCard({
  punto,
  seleccionado,
  lineasStock,
  onSelect,
  etiquetaDisponible,
  etiquetaSinStock,
  etiquetaUnidades,
  etiquetaUnidadesEnStock,
}) {
  const [fotoAbierta, setFotoAbierta] = useState(false);
  const tAmpliar = useTraducir("Ver imagen completa");
  const mapsUrl = esUrlGoogleMaps(punto.mapsUrl) ? String(punto.mapsUrl).trim() : "";
  const fotoUrl = punto.imagenUrl ? normalizeImageUrl(punto.imagenUrl) : "";
  const elegir = () => {
    if (!punto.cubrePedido) return;
    onSelect(punto.code);
  };

  return (
    <div
      role="radio"
      aria-checked={seleccionado}
      aria-disabled={!punto.cubrePedido}
      aria-label={[punto.name, punto.direccion].filter(Boolean).join(". ")}
      tabIndex={punto.cubrePedido ? 0 : -1}
      className={`checkout-pos__card${seleccionado ? " is-selected" : ""}${punto.cubrePedido ? "" : " is-disabled"}`}
      onClick={(event) => {
        if (event.target.closest("a, button")) return;
        elegir();
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          elegir();
        }
      }}
    >
      <span className="checkout-pos__lead">
        <span className="checkout-pos__radio" aria-hidden="true" />
        {fotoUrl ? (
          <button
            type="button"
            className="checkout-pos__photo-btn"
            onClick={() => setFotoAbierta(true)}
            aria-label={tAmpliar}
          >
            <img className="checkout-pos__photo" src={fotoUrl} alt="" />
          </button>
        ) : (
          <span className="checkout-pos__photo checkout-pos__photo--empty" aria-hidden="true">
            <Store size={22} />
          </span>
        )}
      </span>
      <span className="checkout-pos__card-body">
        <span className="checkout-pos__card-name">{punto.name}</span>
        {punto.direccion ? (
          <span className="checkout-pos__address" title={punto.direccion}>
            <MapPin size={14} aria-hidden="true" />
            <span>{punto.direccion}</span>
          </span>
        ) : null}
        {mapsUrl ? (
          <a className="checkout-pos__maps" href={mapsUrl} target="_blank" rel="noopener noreferrer">
            <ST>Ver en Maps</ST>
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        ) : null}
      </span>
      <span className="checkout-pos__aside">
        {punto.cubrePedido ? (
          <span className="checkout-pos__badge">{etiquetaDisponible}</span>
        ) : (
          <span className="checkout-pos__card-meta">{etiquetaSinStock}</span>
        )}
        {punto.cubrePedido && lineasStock.length === 1 ? (
          <span className="checkout-pos__units">
            <Package size={14} aria-hidden="true" />
            <span>{lineasStock[0].disponible} {etiquetaUnidadesEnStock}</span>
          </span>
        ) : null}
        {punto.cubrePedido && lineasStock.length > 1 ? (
          <ul className="checkout-pos__stock">
            {lineasStock.map((linea) => (
              <li key={linea.id}>
                <Package size={14} aria-hidden="true" />
                <span>{linea.nombre}: {linea.disponible} {etiquetaUnidades}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </span>
      {fotoUrl ? (
        <ImageLightbox
          images={[fotoUrl]}
          index={fotoAbierta ? 0 : -1}
          onClose={() => setFotoAbierta(false)}
          alt={punto.name || ""}
        />
      ) : null}
    </div>
  );
}
