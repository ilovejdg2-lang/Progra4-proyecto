import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Maximize2 } from "lucide-react";

import { PublicPageGate } from "../../Components/PublicPageGate/PublicPageGate";
import { ST } from "../../Components/T/ST";
import { useCachedPublicPage } from "../../hooks/useCachedPublicPage";
import { useTraducir } from "../../hooks/useTraducir";
import { fetchHistoriaCompletaPage } from "../../lib/historiaCompletaData";
import "../../Components/BackToHomeLink/BackToHomeLink.css";
import "./HistoriaCafe.css";

function minutosLectura(capitulos) {
  const palabras = capitulos
    .flatMap((c) => c.bloques)
    .map((b) => b.texto || "")
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(palabras / 200));
}

function useCapituloActivo(ids) {
  const [activo, setActivo] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entradas) => {
        const visible = entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActivo(visible.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);
  return activo;
}

function GraficoCompost({ pie, compost }) {
  if (!compost.length) return null;
  const maximo = Math.max(1, ...compost.map((c) => c.kg));
  return (
    <figure className="historia-compost">
      {pie ? (
        <figcaption>
          <ST>{pie}</ST>
        </figcaption>
      ) : null}
      <ul>
        {compost.map((fila) => (
          <li key={fila.anio}>
            <span className="historia-compost__anio">{fila.anio}</span>
            <span className="historia-compost__barra" aria-hidden="true">
              <span style={{ width: `${(fila.kg / maximo) * 100}%` }} />
            </span>
            <span className="historia-compost__kg">{fila.kg.toLocaleString("es-CR")} kg</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

function MapaParcelas({ src, pie }) {
  const tAbrir = useTraducir("Ver mapa en grande");
  if (!src) return null;
  return (
    <figure className="historia-figura historia-figura--mapa">
      <a href={src} target="_blank" rel="noreferrer" className="historia-figura__zoom" aria-label={tAbrir}>
        <img src={src} alt={pie} loading="lazy" width={705} height={503} />
        <span className="historia-figura__zoom-icono">
          <Maximize2 size={16} aria-hidden="true" />
          {tAbrir}
        </span>
      </a>
      {pie ? (
        <figcaption>
          <ST>{pie}</ST>
        </figcaption>
      ) : null}
    </figure>
  );
}

function Bloque({ bloque, primero, historia }) {
  switch (bloque.tipo) {
    case "h3":
      return (
        <h3 className="historia-capitulo__sub">
          <ST>{bloque.texto}</ST>
        </h3>
      );
    case "cita":
      return (
        <blockquote className="historia-cita">
          <p>
            <ST>{`«${bloque.texto}»`}</ST>
          </p>
          {bloque.autor ? (
            <footer>
              <ST>{bloque.autor}</ST>
            </footer>
          ) : null}
        </blockquote>
      );
    case "foto":
      return (
        <figure className="historia-figura">
          <img src={bloque.src} alt={bloque.pie} loading="lazy" width={1024} height={681} />
          {bloque.pie ? (
            <figcaption>
              <ST>{bloque.pie}</ST>
            </figcaption>
          ) : null}
        </figure>
      );
    case "mapa":
      return <MapaParcelas src={historia.portada.mapa} pie={historia.portada.pieMapa} />;
    case "compost":
      return <GraficoCompost pie={bloque.pie} compost={historia.compost} />;
    default:
      return (
        <p className={primero ? "historia-capitulo__p historia-capitulo__p--inicial" : "historia-capitulo__p"}>
          <ST>{bloque.texto}</ST>
        </p>
      );
  }
}

export function HistoriaContenido({ historia }) {
  const { portada, cifras, hitos, capitulos } = historia;
  const ids = useMemo(() => capitulos.map((c) => c.id), [capitulos]);
  const activo = useCapituloActivo(ids);
  const minutos = useMemo(() => minutosLectura(capitulos), [capitulos]);
  const tVolver = useTraducir("Volver a Sobre nosotros");
  const tIndice = useTraducir("Capítulos");
  const tMinutos = useTraducir(`${minutos} min de lectura`);
  const tCifras = useTraducir("El proyecto en cifras");
  const detalle = [portada.autora ? `Relato de ${portada.autora}` : "", portada.anio].filter(Boolean).join(" · ");

  return (
    <main className="historia-cafe site-canvas">
      <Link to="/AboutUs" className="page-back-link historia-cafe__volver">
        <ArrowLeft size={16} strokeWidth={2.4} aria-hidden="true" />
        {tVolver}
      </Link>

      <header className="historia-portada">
        {portada.foto ? (
          <img src={portada.foto} alt="" className="historia-portada__foto" width={1024} height={681} />
        ) : null}
        <div className="historia-portada__texto">
          {portada.eyebrow ? (
            <p className="historia-portada__eyebrow">
              <ST>{portada.eyebrow}</ST>
            </p>
          ) : null}
          <h1>
            <ST>{portada.titulo}</ST>
          </h1>
          {portada.subtitulo ? (
            <p className="historia-portada__subtitulo">
              <ST>{portada.subtitulo}</ST>
            </p>
          ) : null}
          <p className="historia-portada__autora">
            {detalle ? <><ST>{detalle}</ST> · </> : null}
            {tMinutos}
          </p>
        </div>
      </header>

      {cifras.length ? (
        <section className="historia-cifras" aria-label={tCifras}>
          {cifras.map((cifra, i) => (
            <div key={`${cifra.valor}-${i}`} className="historia-cifra">
              <strong>{cifra.valor}</strong>
              <span>
                <ST>{cifra.texto}</ST>
              </span>
            </div>
          ))}
        </section>
      ) : null}

      {hitos.length ? (
        <section className="historia-linea" aria-labelledby="historia-linea-titulo">
          <h2 id="historia-linea-titulo">
            <ST>Hitos del proyecto</ST>
          </h2>
          <ol>
            {hitos.map((hito, i) => (
              <li key={`${hito.anio}-${i}`}>
                <span className="historia-linea__anio">{hito.anio}</span>
                <p>
                  <ST>{hito.texto}</ST>
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="historia-cuerpo">
        <nav className="historia-indice" aria-label={tIndice}>
          <p className="historia-indice__titulo">{tIndice}</p>
          <ol>
            {capitulos.map((capitulo, i) => (
              <li key={capitulo.id}>
                <a
                  href={`#${capitulo.id}`}
                  className={activo === capitulo.id ? "is-activo" : undefined}
                  aria-current={activo === capitulo.id ? "true" : undefined}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <ST>{capitulo.titulo}</ST>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="historia-articulo">
          {capitulos.map((capitulo, i) => (
            <section key={capitulo.id} id={capitulo.id} className="historia-capitulo">
              <p className="historia-capitulo__numero">{String(i + 1).padStart(2, "0")}</p>
              <h2>
                <ST>{capitulo.titulo}</ST>
              </h2>
              {capitulo.bloques.map((bloque, j) => (
                <Bloque key={j} bloque={bloque} primero={i === 0 && j === 0} historia={historia} />
              ))}
            </section>
          ))}

          <footer className="historia-cierre">
            {portada.cierre ? (
              <p>
                <ST>{portada.cierre}</ST>
              </p>
            ) : null}
            <div className="historia-cierre__acciones">
              <Link to="/productos" className="historia-cierre__principal">
                <ST>Conocé el café que nace de esta historia</ST>
              </Link>
              <Link to="/AboutUs" className="historia-cierre__secundario">
                {tVolver}
              </Link>
            </div>
          </footer>
        </article>
      </div>
    </main>
  );
}

export default function HistoriaCafe() {
  const { data, showLoading, isError, error, reload, loadingMessage } = useCachedPublicPage(
    "historia",
    fetchHistoriaCompletaPage,
  );

  return (
    <PublicPageGate
      showLoading={showLoading}
      loadingMessage={loadingMessage}
      isError={isError}
      error={error}
      errorMessage="No se pudo cargar la historia completa."
      onRetry={reload}
    >
      {data ? <HistoriaContenido historia={data} /> : null}
    </PublicPageGate>
  );
}
