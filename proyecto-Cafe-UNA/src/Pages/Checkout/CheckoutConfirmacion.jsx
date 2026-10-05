import { useState } from "react";
import { useTraducir } from "../../hooks/useTraducir";
import { t } from "../../lib/t";
import { normalizeImageUrl } from "../../lib/imageUtils";
import { LOGO_OSCURO_FALLBACK } from "../../lib/brandLogoCache";
import { LOGO_CAFE_UNA_JPEG_BASE64 } from "../../lib/logoCafeUnaBase64";
import { presentarCompra } from "../../lib/resumenCompraPdf";

const formatCRC = (amount) => {
  const value = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return `\u20A1${value.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const VALORES_TRADUCIBLES = new Set(["Estado", "Método de pago"]);

export function CheckoutConfirmacion({
  compra,
  logoUrl,
  descargando = false,
  onDescargar,
  onRastrear,
  onInicio,
  onSeguir,
}) {
  const tGracias = useTraducir("Gracias por tu compra");
  const tPedidoPendiente = useTraducir(
    "Tu pedido quedó pendiente de revisión. Te avisamos cuando se apruebe y envíe.",
  );
  const tResumenCompra = useTraducir("Resumen de la compra");
  const tProducto = useTraducir("Producto");
  const tCantidad = useTraducir("Cantidad");
  const tPrecio = useTraducir("Precio unitario");
  const tSubtotalItem = useTraducir("Subtotal");
  const tSubtotal = useTraducir("Subtotal (sin IVA)");
  const tIva = useTraducir("IVA (13%)");
  const tTotal = useTraducir("Total");
  const tDescargar = useTraducir("Descargar resumen PDF");
  const tPreparando = useTraducir("Preparando PDF...");
  const tRastrearPedido = useTraducir("Rastrear pedido");
  const tVolverInicio = useTraducir("Volver al inicio");
  const tSeguir = useTraducir("Seguir comprando");

  const vista = presentarCompra(compra);
  const [logoFallido, setLogoFallido] = useState(false);
  const logoSrc = logoFallido
    ? `data:image/jpeg;base64,${LOGO_CAFE_UNA_JPEG_BASE64}`
    : normalizeImageUrl(logoUrl || LOGO_OSCURO_FALLBACK, { width: 480 });

  return (
    <main className="checkout-page checkout-page--confirmed">
      <section className="checkout-success-card" aria-live="polite">
        <div className="checkout-success-card__top">
          <img
            className="checkout-success-card__logo"
            src={logoSrc}
            alt="Café UNA"
            onError={() => setLogoFallido(true)}
          />
        </div>
        <div className="checkout-success-card__body">
          <h2>{tGracias}</h2>
          <p>{tPedidoPendiente}</p>
        </div>

        <article className="checkout-receipt" aria-label={tResumenCompra}>
          <h3>{tResumenCompra}</h3>
          <dl className="checkout-receipt__meta">
            {vista.meta.map(([etiqueta, valor]) => (
              <div key={etiqueta}>
                <dt>{t(etiqueta)}</dt>
                <dd>{VALORES_TRADUCIBLES.has(etiqueta) ? t(valor) : valor}</dd>
              </div>
            ))}
          </dl>
          <div className="checkout-receipt__table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">{tProducto}</th>
                  <th scope="col" className="num">{tCantidad}</th>
                  <th scope="col" className="num">{tPrecio}</th>
                  <th scope="col" className="num">{tSubtotalItem}</th>
                </tr>
              </thead>
              <tbody>
                {vista.items.map((item, index) => (
                  <tr key={`${item.productoId || item.nombre}-${index}`}>
                    <td>{item.nombre || "Producto"}</td>
                    <td className="num">{item.cantidad}</td>
                    <td className="num">{formatCRC(item.precioUnitario)}</td>
                    <td className="num">{formatCRC(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="checkout-receipt__totals">
            <div>
              <span>{tSubtotal}</span>
              <strong>{formatCRC(vista.subtotal)}</strong>
            </div>
            <div>
              <span>{tIva}</span>
              <strong>{formatCRC(vista.impuestos)}</strong>
            </div>
            <div className="is-total">
              <span>{tTotal}</span>
              <strong>{formatCRC(vista.total)}</strong>
            </div>
          </div>
          <button
            type="button"
            className="checkout-receipt__download"
            onClick={onDescargar}
            disabled={descargando}
          >
            {descargando ? tPreparando : tDescargar}
          </button>
        </article>

        <div className="checkout-success-card__actions">
          <button type="button" className="checkout-success-card__primary" onClick={onRastrear}>
            {tRastrearPedido}
          </button>
          <button type="button" className="checkout-success-card__secondary" onClick={onInicio}>
            {tVolverInicio}
          </button>
          <button type="button" className="checkout-success-card__secondary" onClick={onSeguir}>
            {tSeguir}
          </button>
        </div>
      </section>
    </main>
  );
}
