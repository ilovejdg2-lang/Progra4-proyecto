import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import BackToHomeLink from "../../Components/BackToHomeLink/BackToHomeLink";
import { PublicPageHeader } from "../../Components/Public/PublicPageHeader";
import { HOME_SCROLL_SECTIONS } from "../../lib/homeScrollTarget";
import PageLoading from "../../Components/PageLoading/PageLoading";
import { obtenerNecesidadesPublicas } from "../../services/donacionesService";
import { ST } from "../../Components/T/ST";
import { useTraducir } from "../../hooks/useTraducir";
import "./NecesidadesDonacion.css";

const PRIORIDADES = {
  ALTA: { clave: "alta", texto: "Prioridad alta" },
  MEDIA: { clave: "media", texto: "Prioridad media" },
};

function prioridadDe(valor) {
  return PRIORIDADES[valor] || { clave: "baja", texto: "Prioridad baja" };
}

function materialesActivos(item) {
  return (item.materiales || [])
    .filter((mat) => !mat.estado || mat.estado === "ACTIVA")
    .map((mat) => mat.nombre)
    .join(", ");
}

export default function NecesidadesDonacion() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const tTitulo = useTraducir("Lo que necesitamos");
  const tLead = useTraducir(
    "Si podés aportar alguno de estos materiales, elegí la necesidad y completá la donación.",
  );

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
    <main className="pub-page necesidades-page">
      <div className="pub-form-container">
        <div className="pub-form-back">
          <BackToHomeLink homeSection={HOME_SCROLL_SECTIONS.iniciativas} />
        </div>

        <PublicPageHeader
          title={tTitulo}
          lead={tLead}
          actions={
            <Link to="/donaciones/solicitar" className="pub-btn pub-btn--primary">
              <ST>Donar otro material</ST>
            </Link>
          }
        />

        {status === "error" ? (
          <div className="pub-panel necesidades-estado" role="alert">
            <AlertTriangle size={24} aria-hidden="true" />
            <p className="necesidades-estado__titulo">
              <ST>{error}</ST>
            </p>
            <button type="button" className="pub-btn pub-btn--secondary" onClick={load}>
              <ST>Reintentar</ST>
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="pub-panel necesidades-estado">
            <p className="necesidades-estado__titulo">
              <ST>Por ahora no hay necesidades activas.</ST>
            </p>
            <p className="necesidades-estado__texto">
              <ST>Si querés ofrecer un material igual, podés enviarnos tu donación.</ST>
            </p>
          </div>
        ) : (
          <ul className="pub-panel necesidades-lista">
            {items.map((item) => {
              const prioridad = prioridadDe(item.prioridad);
              const materiales = materialesActivos(item);
              return (
                <li key={item.id} className="necesidad-fila">
                  <div className="necesidad-fila__texto">
                    <h2 className="necesidad-fila__titulo">
                      <ST>{item.titulo}</ST>
                    </h2>
                    <p className="necesidad-fila__prioridad">
                      <span
                        className={`necesidad-fila__punto necesidad-fila__punto--${prioridad.clave}`}
                        aria-hidden="true"
                      />
                      <ST>{prioridad.texto}</ST>
                    </p>
                    {item.descripcion ? (
                      <p className="necesidad-fila__meta">
                        <ST>{item.descripcion}</ST>
                      </p>
                    ) : null}
                    {materiales ? (
                      <p className="necesidad-fila__meta">
                        <ST>Materiales aceptados</ST>: <ST>{materiales}</ST>
                      </p>
                    ) : null}
                    {item.cantidadRequerida ? (
                      <p className="necesidad-fila__meta">
                        <ST>Cantidad requerida</ST>: {item.cantidadRequerida}
                      </p>
                    ) : null}
                  </div>
                  <Link
                    to="/donaciones/necesidades/$necesidadId/donar"
                    params={{ necesidadId: String(item.id) }}
                    className="pub-btn pub-btn--secondary necesidad-fila__accion"
                  >
                    <ST>Quiero donar</ST>
                    <span className="pub-visually-hidden">: {item.titulo}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
