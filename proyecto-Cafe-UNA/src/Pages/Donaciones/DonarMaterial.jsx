import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import BackToHomeLink from "../../Components/BackToHomeLink/BackToHomeLink";
import { HOME_SCROLL_SECTIONS } from "../../lib/homeScrollTarget";
import PageLoading from "../../Components/PageLoading/PageLoading";
import { getActiveSessionUser } from "../../services/sessionService";
import {
  enviarSolicitudDonacion,
  obtenerNecesidadesPublicas,
} from "../../services/donacionesService";
import { ST } from "../../Components/T/ST";
import { t } from "../../lib/t";
import "./NecesidadesDonacion.css";

export default function DonarMaterial() {
  const { necesidadId } = useParams({ strict: false });
  const navigate = useNavigate();
  const session = getActiveSessionUser();
  const [necesidad, setNecesidad] = useState(null);
  const [descripcion, setDescripcion] = useState("");
  const [fechaPropuesta, setFechaPropuesta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [status, setStatus] = useState("loading");

  const redirect = `/donaciones/necesidades/${necesidadId}/donar`;

  useEffect(() => {
    if (!session) {
      sessionStorage.setItem("postLoginRedirect", redirect);
      navigate({ to: "/login" });
    }
  }, [session, navigate, redirect]);

  useEffect(() => {
    let vivo = true;
    obtenerNecesidadesPublicas()
      .then((rows) => {
        if (!vivo) return;
        const found = rows.find((row) => String(row.id) === String(necesidadId));
        setNecesidad(found || null);
        setStatus("success");
      })
      .catch(() => {
        if (!vivo) return;
        setStatus("error");
      });
    return () => {
      vivo = false;
    };
  }, [necesidadId]);

  const minFecha = useMemo(() => new Date().toISOString().slice(0, 10), []);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    if (!descripcion.trim() || !fechaPropuesta) {
      setError(t("Completá la descripción y la fecha propuesta."));
      return;
    }
    setEnviando(true);
    try {
      await enviarSolicitudDonacion({
        necesidadId: Number(necesidadId),
        tipo: necesidad?.titulo || "",
        descripcion: descripcion.trim(),
        fechaPropuesta,
      });
      setOk(true);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : t("No se pudo enviar la solicitud."),
      );
    } finally {
      setEnviando(false);
    }
  }

  if (!session || status === "loading") {
    return <PageLoading message="Cargando formulario..." />;
  }

  return (
    <main className="necesidades-page site-canvas">
      <BackToHomeLink homeSection={HOME_SCROLL_SECTIONS.voluntariado} />
      <p>
        <Link to="/donaciones/necesidades"><ST>Volver al catálogo</ST></Link>
      </p>
      <h1 className="necesidades-page__title"><ST>Registrar donación</ST></h1>
      {necesidad ? (
        <p className="necesidades-page__lead">
          <ST>Tipo de donación</ST>: <strong><ST>{necesidad.titulo}</ST></strong>
        </p>
      ) : (
        <p className="necesidades-page__error">
          <ST>Esa necesidad ya no está activa.</ST>
        </p>
      )}

      {ok ? (
        <div className="necesidad-ok" role="status">
          <ST>¡Listo! Recibimos tu solicitud en estado Pendiente. Podés verla en tu perfil.</ST>
        </div>
      ) : necesidad ? (
        <form className="necesidad-form" onSubmit={onSubmit}>
          <label>
            <ST>Tipo de donación</ST>
            <input type="text" value={necesidad.titulo} readOnly />
          </label>
          <label>
            <ST>Descripción</ST>
            <textarea
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              maxLength={2000}
              required
            />
          </label>
          <label>
            <ST>Fecha propuesta</ST>
            <input
              type="date"
              min={minFecha}
              value={fechaPropuesta}
              onChange={(event) => setFechaPropuesta(event.target.value)}
              required
            />
          </label>
          {error ? <p className="necesidades-page__error">{error}</p> : null}
          <button type="submit" disabled={enviando}>
            <ST>{enviando ? "Enviando..." : "Enviar solicitud"}</ST>
          </button>
        </form>
      ) : null}
    </main>
  );
}
