import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Info, Upload } from "lucide-react";
import BackToHomeLink from "../../Components/BackToHomeLink/BackToHomeLink";
import PageLoading from "../../Components/PageLoading/PageLoading";
import { PublicPageHeader } from "../../Components/Public/PublicPageHeader";
import {
  descargarArchivo,
  obtenerDocumentosPublicos,
  registrarVistaDocumento,
} from "../../services/documentosService";
import { getActiveSessionUser } from "../../services/sessionService";
import { SolicitarDocumentoModal } from "./SolicitarDocumentoModal";
import { VisualizarDocumentoModal } from "./VisualizarDocumentoModal";
import { usePublicPageLoadingGate } from "../../hooks/usePublicPageLoadingGate";
import { useTraducir } from "../../hooks/useTraducir";
import { ST } from "../../Components/T/ST";
import { BarraHerramientas } from "./components/BarraHerramientas";
import { CategoriasLista } from "./components/CategoriasLista";
import { DocumentoFila, FilasEsqueleto } from "./components/DocumentoFila";
import { Pagination } from "./components/Pagination";
import { categoriasConConteo, filtrosActivos, normalizarOrden } from "./repositorioLogic";
import "./Repositorio.css";

const LIMITE = 12;
const FILTROS_VACIOS = { buscar: "", categoria: "todas", orden: "recientes", pagina: 1 };

function leerFiltrosUrl() {
  if (typeof window === "undefined") return { ...FILTROS_VACIOS };
  const params = new URLSearchParams(window.location.search);
  return {
    buscar: params.get("buscar") || "",
    categoria: params.get("categoria") || "todas",
    orden: normalizarOrden(params.get("orden")),
    pagina: parseInt(params.get("pagina") || "1", 10) || 1,
  };
}

/** Writes buscar/categoria/orden/pagina to the URL, keeping any other param (docId). */
function escribirFiltrosUrl(filtros) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  ["buscar", "categoria", "orden", "pagina"].forEach((clave) => params.delete(clave));
  const buscar = String(filtros.buscar || "").trim();
  if (buscar) params.set("buscar", buscar);
  if (filtros.categoria && filtros.categoria !== "todas") params.set("categoria", filtros.categoria);
  if (filtros.orden && filtros.orden !== "recientes") params.set("orden", filtros.orden);
  if (filtros.pagina > 1) params.set("pagina", String(filtros.pagina));
  const query = params.toString();
  window.history.replaceState(null, "", query ? `${window.location.pathname}?${query}` : window.location.pathname);
}

function quitarDocIdUrl() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (!params.has("docId")) return;
  params.delete("docId");
  const query = params.toString();
  window.history.replaceState(null, "", query ? `${window.location.pathname}?${query}` : window.location.pathname);
}

export default function Repositorio() {
  const user = getActiveSessionUser();
  const tLead = useTraducir("Investigaciones, guías, tesis y noticias sobre el café, de libre consulta y descarga.");
  const tTitulo = useTraducir("Repositorio");

  const esAdmin = useMemo(() => {
    if (!user) return false;
    const roles = Array.isArray(user.roles) ? user.roles : [user.role || user.rol];
    return roles.some((r) => ["admin", "superadmin"].includes(String(r || "").toLowerCase()));
  }, [user]);

  const [filtros, setFiltros] = useState(leerFiltrosUrl);
  const filtrosRef = useRef(filtros);
  const fijarFiltros = useCallback((siguientes) => {
    filtrosRef.current = siguientes;
    setFiltros(siguientes);
    escribirFiltrosUrl(siguientes);
  }, []);

  const [documentos, setDocumentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [totalResultados, setTotalResultados] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [inicialCargado, setInicialCargado] = useState(false);
  const [error, setError] = useState("");
  const [avisoDescarga, setAvisoDescarga] = useState("");
  const [reintento, setReintento] = useState(0);

  const [documentoSolicitar, setDocumentoSolicitar] = useState(null);
  const [documentoVisualizar, setDocumentoVisualizar] = useState(null);
  const docIdAtendido = useRef(null);

  // Back/forward restores the filters from the URL.
  useEffect(() => {
    const alRetroceder = () => {
      const url = leerFiltrosUrl();
      filtrosRef.current = url;
      setFiltros(url);
    };
    window.addEventListener("popstate", alRetroceder);
    return () => window.removeEventListener("popstate", alRetroceder);
  }, []);

  // Every way of opening the viewer counts one view.
  const abrirVisor = useCallback((doc) => {
    setDocumentoVisualizar(doc);
    void registrarVistaDocumento(doc.id).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelada = false;
    const cargar = async () => {
      try {
        setCargando(true);
        setError("");
        const payload = await obtenerDocumentosPublicos({
          categoria: filtros.categoria === "todas" ? "" : filtros.categoria,
          buscar: filtros.buscar,
          orden: filtros.orden,
          pagina: filtros.pagina,
          limite: LIMITE,
        });
        if (cancelada) return;
        setDocumentos(payload.items || []);
        setTotalResultados(payload.total || 0);
        setTotalPaginas(payload.totalPaginas || 1);
        if (payload.facetas) setCategorias(categoriasConConteo(payload.facetas));

        // ?docId= deep link: open the viewer once its document shows up in the list.
        const docId = new URLSearchParams(window.location.search).get("docId");
        if (docId && docIdAtendido.current !== docId) {
          const encontrado = (payload.items || []).find((d) => String(d.id) === String(docId));
          if (encontrado) {
            docIdAtendido.current = docId;
            abrirVisor(encontrado);
          }
        }
      } catch (err) {
        if (!cancelada) {
          console.error("Error al cargar el repositorio:", err);
          setError("No se pudieron cargar los documentos. Intenta de nuevo en unos minutos.");
        }
      } finally {
        if (!cancelada) {
          setCargando(false);
          setInicialCargado(true);
        }
      }
    };
    cargar();
    return () => {
      cancelada = true;
    };
  }, [filtros.categoria, filtros.buscar, filtros.orden, filtros.pagina, reintento, abrirVisor]);

  const cambiarFiltro = useCallback(
    (cambios) => fijarFiltros({ ...filtrosRef.current, ...cambios, pagina: 1 }),
    [fijarFiltros],
  );
  const buscarTexto = useCallback((texto) => cambiarFiltro({ buscar: texto }), [cambiarFiltro]);
  const limpiar = useCallback(() => fijarFiltros({ ...FILTROS_VACIOS, orden: filtrosRef.current.orden }), [fijarFiltros]);

  const cambiarPagina = useCallback(
    (pagina) => {
      fijarFiltros({ ...filtrosRef.current, pagina });
      const barra = document.querySelector(".repo-toolbar");
      if (barra && barra.getBoundingClientRect().top < 0) {
        barra.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [fijarFiltros],
  );

  const cerrarVisor = () => {
    setDocumentoVisualizar(null);
    quitarDocIdUrl();
  };

  const descargar = async (doc) => {
    setAvisoDescarga("");
    if (doc.esPrivado && !esAdmin) {
      setDocumentoSolicitar(doc);
      return;
    }
    try {
      await descargarArchivo(doc.id, doc.nombreOriginal || `${doc.titulo}.pdf`);
      setDocumentos((prev) =>
        prev.map((item) =>
          item.id === doc.id ? { ...item, descargasCount: (item.descargasCount || 0) + 1 } : item,
        ),
      );
    } catch (err) {
      console.error("Error al descargar:", err);
      if (doc.esPrivado) setDocumentoSolicitar(doc);
      else setAvisoDescarga(err?.message || "No se pudo descargar el archivo. Intenta de nuevo.");
    }
  };

  const showLoadingGate = usePublicPageLoadingGate("repositorio", inicialCargado);
  if (showLoadingGate) return <PageLoading message="Cargando biblioteca digital..." />;

  const totalTodas = categorias.reduce((suma, c) => suma + c.count, 0);
  const hayFiltros = filtrosActivos(filtros);

  return (
    <div className="pub-page repo-page">
      <div className="pub-container">
        <div className="repo-back no-print">
          <BackToHomeLink />
        </div>

        <PublicPageHeader
          title={tTitulo}
          lead={tLead}
          actions={
            <button type="button" className="pub-btn pub-btn--primary" onClick={() => setDocumentoSolicitar({})}>
              <Upload size={18} aria-hidden="true" />
              <ST>Enviar documento</ST>
            </button>
          }
        />

        <BarraHerramientas
          buscar={filtros.buscar}
          orden={filtros.orden}
          categoria={filtros.categoria}
          categorias={categorias}
          onBuscar={buscarTexto}
          onOrden={(orden) => cambiarFiltro({ orden })}
          onCategoria={(categoria) => cambiarFiltro({ categoria })}
        />

        <div className="repo-columns">
          <aside className="repo-sidebar repo-only-desktop">
            <CategoriasLista
              categorias={categorias}
              total={totalTodas}
              seleccionada={filtros.categoria}
              onSeleccionar={(categoria) => cambiarFiltro({ categoria })}
            />
          </aside>

          <main className="repo-content">
            {error ? (
              <div className="pub-alert" role="alert">
                <Info size={18} aria-hidden="true" />
                <span>
                  <ST>{error}</ST>
                </span>
                <button type="button" className="pub-btn pub-btn--link" onClick={() => setReintento((n) => n + 1)}>
                  <ST>Reintentar</ST>
                </button>
              </div>
            ) : null}
            {avisoDescarga ? (
              <div className="pub-alert" role="alert">
                <Info size={18} aria-hidden="true" />
                <span>
                  <ST>{avisoDescarga}</ST>
                </span>
              </div>
            ) : null}

            <section className="pub-panel repo-panel" aria-busy={cargando}>
              <p className="repo-count" aria-live="polite">
                {totalResultados} <ST>{totalResultados === 1 ? "documento" : "documentos"}</ST>
              </p>

              {cargando ? (
                <FilasEsqueleto />
              ) : documentos.length > 0 ? (
                <ul className="repo-list">
                  {documentos.map((doc) => (
                    <DocumentoFila
                      key={doc.id}
                      doc={doc}
                      esAdmin={esAdmin}
                      onVer={abrirVisor}
                      onDescargar={descargar}
                    />
                  ))}
                </ul>
              ) : error ? null : (
                <div className="repo-empty">
                  <p>
                    <ST>
                      {hayFiltros
                        ? "No encontramos documentos con esa búsqueda."
                        : "Todavía no hay documentos publicados."}
                    </ST>
                  </p>
                  {hayFiltros ? (
                    <button type="button" className="pub-btn pub-btn--link" onClick={limpiar}>
                      <ST>Limpiar búsqueda</ST>
                    </button>
                  ) : null}
                </div>
              )}
            </section>

            <Pagination paginaActual={filtros.pagina} totalPaginas={totalPaginas} onCambiarPagina={cambiarPagina} />
          </main>
        </div>
      </div>

      {documentoSolicitar ? (
        <SolicitarDocumentoModal
          documento={documentoSolicitar.id ? documentoSolicitar : null}
          onClose={() => setDocumentoSolicitar(null)}
        />
      ) : null}

      {documentoVisualizar ? (
        <VisualizarDocumentoModal
          documento={documentoVisualizar}
          onClose={cerrarVisor}
          onSolicitarAcceso={
            esAdmin
              ? undefined
              : (doc) => {
                  cerrarVisor();
                  setDocumentoSolicitar(doc);
                }
          }
        />
      ) : null}
    </div>
  );
}
