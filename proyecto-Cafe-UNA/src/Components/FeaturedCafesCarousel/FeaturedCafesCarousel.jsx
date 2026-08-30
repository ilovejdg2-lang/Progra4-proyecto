import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { imagenPrincipalProducto } from "../../lib/productoImagenes";
import { normalizeImageUrl } from "../../lib/imageUtils";
import { calcularPrecioConIVA } from "../../services/productosService";
import { useTraducir } from "../../hooks/useTraducir";
import { ST } from "../T/ST";
import "./FeaturedCafesCarousel.css";

function formatCRC(value) {
  return `\u20A1${(Number(value) || 0).toLocaleString("es-CR")}`;
}

function posicionDeCarta(index, activo, total) {
  if (total <= 1) return "center";
  const diff = (index - activo + total) % total;
  if (diff === 0) return "center";
  if (diff === 1) return "right";
  if (diff === total - 1) return "left";
  return "hidden";
}

function StockLabel({ stock }) {
  const agotado = useTraducir("Agotado");
  const disponibles = useTraducir(`${stock} disponibles`);
  return stock <= 0 ? agotado : disponibles;
}

function CategoriaLabel({ texto }) {
  return useTraducir(texto);
}

export default function FeaturedCafesCarousel({ products = [] }) {
  const [activo, setActivo] = useState(0);
  const lista = useMemo(() => products.filter(Boolean), [products]);
  const total = lista.length;
  const ariaSeleccion = useTraducir("Selección destacada de cafés");
  const ariaCafes = useTraducir("Cafés destacados");
  const ariaAnterior = useTraducir("Anterior");
  const ariaSiguiente = useTraducir("Siguiente");

  if (total === 0) return null;

  const ir = (delta) => {
    setActivo((actual) => (actual + delta + total) % total);
  };

  return (
    <div className="featured-cafes" data-count={total}>
      <div className="featured-cafes__stage" aria-label={ariaSeleccion}>
        {lista.map((producto, index) => {
          const posicion = posicionDeCarta(index, activo, total);
          const imagen = normalizeImageUrl(imagenPrincipalProducto(producto), { width: 800 })
            || imagenPrincipalProducto(producto);
          const precio = calcularPrecioConIVA(producto.precioNormal ?? producto.price ?? 0);
          const stock = Number(producto.stock) || 0;

          const peso = String(producto.peso || "").trim();
          const categoria = String(producto.categoria || "").trim();
          const contenido = (
            <>
              <div className="featured-cafes__media">
                {imagen ? (
                  <img
                    src={imagen}
                    alt={producto.nombre || "Café"}
                    width="640"
                    height="640"
                    loading="eager"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="featured-cafes__media-placeholder" aria-hidden="true" />
                )}
                {peso ? <span className="featured-cafes__badge">{peso.toUpperCase()}</span> : null}
              </div>
              <div className="featured-cafes__body">
                {categoria || peso ? (
                  <p className="featured-cafes__eyebrow">
                    {categoria ? <CategoriaLabel texto={categoria} /> : peso}
                  </p>
                ) : null}
                <h3><ST>{producto.nombre}</ST></h3>
                {producto.descripcion ? <p className="featured-cafes__desc">{producto.descripcion}</p> : null}
                <div className="featured-cafes__meta">
                  <span className="featured-cafes__price">{formatCRC(precio)}</span>
                  <span className={`featured-cafes__stock${stock <= 0 ? " is-out" : ""}`}>
                    <StockLabel stock={stock} />
                  </span>
                </div>
              </div>
            </>
          );

          return (
            <article
              key={producto.id ?? producto.nombre ?? index}
              className={`featured-cafes__card featured-cafes__card--${posicion}`}
              aria-hidden={posicion === "hidden"}
            >
              {producto.id ? (
                <Link
                  to="/productos/$productId"
                  params={{ productId: String(producto.id) }}
                  className="featured-cafes__link"
                  tabIndex={posicion === "hidden" ? -1 : undefined}
                >
                  {contenido}
                </Link>
              ) : (
                <div className="featured-cafes__surface">{contenido}</div>
              )}
            </article>
          );
        })}
      </div>

      {total > 1 ? (
        <div className="featured-cafes__controls">
          <button type="button" className="featured-cafes__arrow" onClick={() => ir(-1)} aria-label={ariaAnterior}>
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <div className="featured-cafes__dots" role="tablist" aria-label={ariaCafes}>
            {lista.map((producto, index) => (
              <button
                key={producto.id ?? index}
                type="button"
                className={`featured-cafes__dot${index === activo ? " is-active" : ""}`}
                onClick={() => setActivo(index)}
                aria-label={`Ver ${producto.nombre || `café ${index + 1}`}`}
                aria-current={index === activo ? "true" : undefined}
              />
            ))}
          </div>
          <button type="button" className="featured-cafes__arrow" onClick={() => ir(1)} aria-label={ariaSiguiente}>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
