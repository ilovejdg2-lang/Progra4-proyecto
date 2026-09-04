import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import BackToHomeLink from "../../Components/BackToHomeLink/BackToHomeLink";
import { HOME_SCROLL_SECTIONS } from "../../lib/homeScrollTarget";
import PageLoading from "../../Components/PageLoading/PageLoading";
import { obtenerNecesidadesPublicas } from "../../services/donacionesService";
import { ST } from "../../Components/T/ST";
import "./NecesidadesDonacion.css";

function clasePrioridad(prioridad) {
  if (prioridad === "ALTA") return "necesidad-card__prioridad--alta";
  if (prioridad === "MEDIA") return "necesidad-card__prioridad--media";
  return "necesidad-card__prioridad--baja";
}

function etiquetaPrioridad(prioridad) {
  if (prioridad === "ALTA") return "Alta";
  if (prioridad === "MEDIA") return "Media";
  return "Baja";
}

export default function NecesidadesDonacion() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const data = await obtenerNecesidadesPublicas();
      setItems(data.filter((row) => row.estado === "ACTIVA"));
      setStatus("success");
    } catch (loadError) {
      setItems([]);
      setStatus("error");
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar las necesidades.",
      );
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (status === "loading") {
    return <PageLoading message="Cargando necesidades..." />;
  }

  return (
    <main className="necesidades-page site-canvas">
      <BackToHomeLink homeSection={HOME_SCROLL_SECTIONS.voluntariado} />
      <header className="necesidades-page__header">
        <h1 className="necesidades-page__title"><ST>Necesidades de donación</ST></h1>
        <p className="necesidades-page__lead">
          <ST>Estas son las necesidades materiales activas del proyecto. Si podés aportar, registrá tu donación.</ST>
        </p>
      </header>

      {status === "error" ? (
        <p className="necesidades-page__error">{error}</p>
      ) : items.length === 0 ? (
        <p className="necesidades-page__vacio">
          <ST>Por ahora no hay necesidades activas.</ST>
        </p>
      ) : (
        <ul className="necesidades-grid">
          {items.map((item) => (
            <li key={item.id} className="necesidad-card">
              <span className={`necesidad-card__prioridad ${clasePrioridad(item.prioridad)}`}>
                <ST>Prioridad {etiquetaPrioridad(item.prioridad)}</ST>
              </span>
              <h2 className="necesidad-card__titulo"><ST>{item.titulo}</ST></h2>
              <p className="necesidad-card__texto"><ST>{item.descripcion}</ST></p>
              {item.cantidadRequerida ? (
                <p className="necesidad-card__meta">
                  <ST>Cantidad requerida</ST>: {item.cantidadRequerida}
                </p>
              ) : null}
              <Link
                to="/donaciones/necesidades/$necesidadId/donar"
                params={{ necesidadId: String(item.id) }}
                className="necesidad-card__cta"
              >
                <ST>Quiero donar este material</ST>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
