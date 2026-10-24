import { Clock, ExternalLink, MapPin, Phone, Store } from "lucide-react";

import { ST } from "../../Components/T/ST";
import { normalizeImageUrl } from "../../lib/imageUtils";
import { esUrlGoogleMaps } from "../../lib/puntoVentaPresentacion";
import { HorarioCompra } from "../ProductDetail/HorarioCompra";

export function CheckoutPuntoDetalle({ punto }) {
  const fotos = [punto.imagenUrl, ...(Array.isArray(punto.imagenes) ? punto.imagenes : [])].filter(Boolean);
  const principal = fotos[0] || "";
  const secundarias = fotos.slice(1);
  const mapsUrl = esUrlGoogleMaps(punto.mapsUrl) ? String(punto.mapsUrl).trim() : "";
  const telefono = String(punto.telefono || "").trim();
  const hayDatos = Boolean(punto.direccion || mapsUrl || telefono || punto.horario);

  return (
    <section className="checkout-pos-detail" aria-labelledby="checkout-pos-detail-title">
      <header className="checkout-pos-detail__head">
        <span className="checkout-pos-detail__mark" aria-hidden="true">
          <Store size={16} strokeWidth={2.2} />
        </span>
        <div>
          <h3 id="checkout-pos-detail-title">
            <ST>Detalles del punto de venta</ST>
          </h3>
          <p className="checkout-pos-detail__name">{punto.name}</p>
        </div>
      </header>
      {principal || hayDatos ? (
        <div className={`checkout-pos-detail__layout${principal ? "" : " is-text-only"}`}>
          {principal ? (
            <div>
              <img className="checkout-pos-detail__hero" src={normalizeImageUrl(principal)} alt="" />
              {secundarias.length ? (
                <div className="checkout-pos-detail__thumbs">
                  {secundarias.map((url) => (
                    <img key={url} src={normalizeImageUrl(url)} alt="" />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {hayDatos ? (
            <div className="checkout-pos-detail__facts">
              {punto.direccion || mapsUrl ? (
                <div className="checkout-pos-detail__fact">
                  <p className="checkout-pos-detail__label">
                    <MapPin size={15} aria-hidden="true" />
                    <ST>Dirección</ST>
                  </p>
                  {punto.direccion ? <p className="checkout-pos-detail__value">{punto.direccion}</p> : null}
                  {mapsUrl ? (
                    <a className="checkout-pos-detail__maps" href={mapsUrl} target="_blank" rel="noopener noreferrer">
                      <ST>Ver en Maps</ST>
                      <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              ) : null}
              {telefono ? (
                <div className="checkout-pos-detail__fact">
                  <p className="checkout-pos-detail__label">
                    <Phone size={15} aria-hidden="true" />
                    <ST>Teléfono</ST>
                  </p>
                  <p className="checkout-pos-detail__value">
                    <a href={`tel:${telefono.replace(/[^\d+]/g, "")}`}>{telefono}</a>
                  </p>
                </div>
              ) : null}
              {punto.horario ? (
                <div className="checkout-pos-detail__fact">
                  <p className="checkout-pos-detail__label">
                    <Clock size={15} aria-hidden="true" />
                    <ST>Horario</ST>
                  </p>
                  <p className="checkout-pos-detail__value">{punto.horario}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      <HorarioCompra
        ubicacionId={punto.id}
        titulo="Fechas sin retiro de pedidos"
        variante="incrustada"
      />
    </section>
  );
}
