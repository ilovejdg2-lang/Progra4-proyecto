import { Link } from "@tanstack/react-router";
import "./NotFound.css";

export default function NotFound() {
  return (
    <main className="not-found site-canvas" aria-labelledby="not-found-title">
      <p className="not-found__code" aria-hidden="true">
        404
      </p>
      <h1 id="not-found-title" className="not-found__title">
        Página no encontrada
      </h1>
      <p className="not-found__text">
        La ruta que buscás no existe o ya no está disponible.
      </p>
      <Link to="/" className="not-found__button">
        Ir al inicio
      </Link>
    </main>
  );
}
