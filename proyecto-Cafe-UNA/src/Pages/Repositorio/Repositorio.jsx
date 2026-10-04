import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  Eye,
  FileText,
  FolderOpen,
  Info,
  Sparkles,
} from "lucide-react";
import BackToHomeLink from "../../Components/BackToHomeLink/BackToHomeLink";
import PageLoading from "../../Components/PageLoading/PageLoading";
import {
  descargarArchivo,
  obtenerDocumentosPublicos,
  registrarVistaDocumento,
} from "../../services/documentosService";
import { getActiveSessionUser } from "../../services/sessionService";
import { SolicitarDocumentoModal } from "./SolicitarDocumentoModal";
import { VisualizarDocumentoModal } from "./VisualizarDocumentoModal";
import { usePublicPageLoadingGate } from "../../hooks/usePublicPageLoadingGate";
import { ST } from "../../Components/T/ST";

// Componentes del nuevo layout de biblioteca digital
import { Sidebar } from "./components/Sidebar";
import { ResultsToolbar } from "./components/ResultsToolbar";
import { ActiveFilterChips } from "./components/ActiveFilterChips";
import { DocumentGrid } from "./components/DocumentGrid";
import { DocumentList } from "./components/DocumentList";
import { Pagination } from "./components/Pagination";

import "../Voluntariado/SolicitarVoluntariado.css";
import "./Repositorio.css";

// Helper para leer query params actuales de la URL
function parseUrlFilters() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    buscar: params.get("buscar") || "",
    categoria: params.get("categoria") || "todas",
    subcategoria: params.get("subcategoria") || "",
    anioDesde: params.get("anioDesde") || "",
    anioHasta: params.get("anioHasta") || "",
    autor: params.get("autor") || "",
    tipoArchivo: params.get("tipoArchivo") || "todos",
    idioma: params.get("idioma") || "todos",
    etiquetas: params.get("etiquetas") || "",
    accesoRapido: params.get("accesoRapido") || "todos",
    orden: params.get("orden") || "recientes",
    vista: params.get("vista") || "grid",
    miBiblioteca: params.get("miBiblioteca") || "",
    pagina: parseInt(params.get("pagina") || "1", 10) || 1,
  };
}

export default function Repositorio() {
  const user = getActiveSessionUser();

  // Regla estricta: Solo roles superAdmin o administrativos ven documentos privados
  const esAdmin = useMemo(() => {
    if (!user) return false;
    const roles = Array.isArray(user.roles) ? user.roles : [user.role || user.rol];
    return roles.some((r) =>
      ["admin", "superadmin"].includes(String(r || "").toLowerCase()),
    );
  }, [user]);

  // Estado sincronizado con URL
  const [filtros, setFiltros] = useState(parseUrlFilters);

  // Datos del catálogo
  const [documentos, setDocumentos] = useState([]);
  const [facetas, setFacetas] = useState({
    categorias: [],
    subcategorias: [],
    anios: [],
    tiposArchivo: [],
    idiomas: [],
    autores: [],
    etiquetas: [],
    accesosRapidos: { todos: 0, novedades: 0, populares: 0, destacados: 0 },
  });
  const [estadisticas, setEstadisticas] = useState({
    totalDocumentos: 0,
    totalCategorias: 0,
    totalDescargas: 0,
    totalVistas: 0,
  });

  const [totalResultados, setTotalResultados] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [inicialCargado, setInicialCargado] = useState(false);
  const [error, setError] = useState("");

  // Estado del layout
  const [vistaCuadricula, setVistaCuadricula] = useState(() => filtros.vista !== "list");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarColapsado, setSidebarColapsado] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("biblio_sidebar_collapsed") === "true";
    }
    return false;
  });

  // Modales
  const [documentoSolicitar, setDocumentoSolicitar] = useState(null);
  const [documentoVisualizar, setDocumentoVisualizar] = useState(null);

  // Persistencia de favoritos, leer más tarde e historial
  const [favoritosIds, setFavoritosIds] = useState(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const s = localStorage.getItem("biblio_favoritos_ids");
      return s ? new Set(JSON.parse(s)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [leerTardeIds, setLeerTardeIds] = useState(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const s = localStorage.getItem("biblio_leertarde_ids");
      return s ? new Set(JSON.parse(s)) : new Set();
    } catch {
      return new Set();
    }
  });

  const handleToggleLeerTarde = useCallback((doc) => {
    setLeerTardeIds((prev) => {
      const next = new Set(prev);
      const idStr = String(doc.id);
      if (next.has(idStr)) next.delete(idStr);
      else next.add(idStr);
      try {
        localStorage.setItem("biblio_leertarde_ids", JSON.stringify([...next]));
      } catch (err) {
        console.warn("No se pudo guardar en leer más tarde:", err);
      }
      return next;
    });
  }, []);

  const [historialIds, setHistorialIds] = useState(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const s = localStorage.getItem("biblio_historial_ids");
      return s ? new Set(JSON.parse(s)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Actualizar URL cuando cambian los filtros (history replaceState sin recargar página ni alterar posición de scroll)
  const sincronizarUrl = useCallback((nuevosFiltros) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    Object.entries(nuevosFiltros).forEach(([clave, valor]) => {
      const v = String(valor ?? "").trim();
      if (
        v &&
        !(clave === "categoria" && v === "todas") &&
        !(clave === "tipoArchivo" && v === "todos") &&
        !(clave === "idioma" && v === "todos") &&
        !(clave === "accesoRapido" && v === "todos") &&
        !(clave === "miBiblioteca" && v === "") &&
        !(clave === "orden" && v === "recientes") &&
        !(clave === "vista" && v === "grid") &&
        !(clave === "pagina" && v === "1")
      ) {
        params.set(clave, v);
      }
    });

    const queryString = params.toString();
    const nuevaUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;

    window.history.replaceState(nuevosFiltros, "", nuevaUrl);
  }, []);

  // Escuchar cambios de historial (atrás / adelante)
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseUrlFilters();
      setFiltros(parsed);
      setVistaCuadricula(parsed.vista !== "list");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Consultar catálogo en backend con cancelación de peticiones obsoletas
  useEffect(() => {
    let cancelada = false;
    const cargarCatalogo = async () => {
      try {
        setCargando(true);
        setError("");

        const payload = await obtenerDocumentosPublicos({
          categoria: filtros.categoria === "todas" ? "" : filtros.categoria,
          subcategoria: filtros.subcategoria,
          buscar: filtros.buscar,
          orden: filtros.orden,
          anioDesde: filtros.anioDesde,
          anioHasta: filtros.anioHasta,
          autor: filtros.autor,
          tipoArchivo: filtros.tipoArchivo,
          idioma: filtros.idioma,
          etiquetas: filtros.etiquetas,
          accesoRapido: filtros.accesoRapido,
          pagina: filtros.pagina,
          limite: 12,
        });

        if (cancelada) return;

        setDocumentos(payload.items || []);
        setTotalResultados(payload.total || 0);
        setTotalPaginas(payload.totalPaginas || 1);
        if (payload.facetas) setFacetas(payload.facetas);
        if (payload.estadisticas) setEstadisticas(payload.estadisticas);
      } catch (err) {
        if (!cancelada) {
          console.error("Error al cargar biblioteca digital:", err);
          setError("No se pudieron cargar los documentos. Intente más tarde.");
        }
      } finally {
        if (!cancelada) {
          setCargando(false);
          setInicialCargado(true);
        }
      }
    };

    cargarCatalogo();
    return () => {
      cancelada = true;
    };
  }, [
    filtros.categoria,
    filtros.subcategoria,
    filtros.buscar,
    filtros.orden,
    filtros.anioDesde,
    filtros.anioHasta,
    filtros.autor,
    filtros.tipoArchivo,
    filtros.idioma,
    filtros.etiquetas,
    filtros.accesoRapido,
    filtros.pagina,
  ]);

  // Manejador genérico para cambiar un filtro
  const handleCambiarFiltro = useCallback(
    (clave, valor) => {
      setFiltros((prev) => {
        const next = { ...prev, [clave]: valor, pagina: 1 };
        sincronizarUrl(next);
        return next;
      });
    },
    [sincronizarUrl],
  );

  // Manejador para cambiar múltiples filtros atómicamente (ej. categoría y subcategoría a la vez)
  const handleCambiarFiltros = useCallback(
    (cambios) => {
      setFiltros((prev) => {
        const next = { ...prev, ...cambios, pagina: 1 };
        sincronizarUrl(next);
        return next;
      });
    },
    [sincronizarUrl],
  );

  // Manejador de búsqueda
  const handleBuscar = useCallback(
    (termino) => {
      handleCambiarFiltro("buscar", termino);
    },
    [handleCambiarFiltro],
  );

  // Manejador de cambio de página
  const handleCambiarPagina = useCallback(
    (nuevaPagina) => {
      setFiltros((prev) => {
        const next = { ...prev, pagina: nuevaPagina };
        sincronizarUrl(next);
        return next;
      });
      // Desplazamiento suave solo si el usuario se encuentra debajo de la barra de herramientas
      const toolbar = document.querySelector(".biblio-toolbar");
      if (toolbar) {
        const rect = toolbar.getBoundingClientRect();
        if (rect.top < 0) {
          toolbar.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    },
    [sincronizarUrl],
  );

  // Alternar vista cuadrícula / lista
  const handleToggleVista = useCallback(
    (cuadricula) => {
      setVistaCuadricula(cuadricula);
      setFiltros((prev) => {
        const next = { ...prev, vista: cuadricula ? "grid" : "list" };
        sincronizarUrl(next);
        return next;
      });
    },
    [sincronizarUrl],
  );

  // Limpiar todos los filtros
  const handleLimpiarTodos = useCallback(() => {
    const limpios = {
      buscar: "",
      categoria: "todas",
      subcategoria: "",
      anioDesde: "",
      anioHasta: "",
      autor: "",
      tipoArchivo: "todos",
      idioma: "todos",
      visibilidad: "todas",
      etiquetas: "",
      accesoRapido: "todos",
      orden: "recientes",
      vista: vistaCuadricula ? "grid" : "list",
      pagina: 1,
    };
    setFiltros(limpios);
    sincronizarUrl(limpios);
  }, [sincronizarUrl, vistaCuadricula]);

  // Alternar colapso de sidebar en escritorio
  const handleToggleColapso = () => {
    setSidebarColapsado((prev) => {
      const nuevo = !prev;
      localStorage.setItem("biblio_sidebar_collapsed", String(nuevo));
      return nuevo;
    });
  };

  // Descarga de archivo
  const handleDescargar = async (doc) => {
    if (doc.esPrivado && !esAdmin) {
      setDocumentoSolicitar(doc);
      return;
    }

    try {
      await descargarArchivo(doc.id, doc.nombreOriginal || `${doc.titulo}.pdf`);
      // Incrementar descargas localmente
      setDocumentos((prev) =>
        prev.map((item) =>
          item.id === doc.id
            ? { ...item, descargasCount: (item.descargasCount || 0) + 1 }
            : item,
        ),
      );
      setEstadisticas((prev) => ({
        ...prev,
        totalDescargas: (prev.totalDescargas || 0) + 1,
      }));
    } catch (err) {
      console.error("Error al descargar:", err);
      if (doc.esPrivado) {
        setDocumentoSolicitar(doc);
      } else {
        alert(err?.message || "Ocurrió un error al descargar el archivo.");
      }
    }
  };

  // Visualizar documento y registrar vista
  const handleVisualizar = (doc) => {
    setDocumentoVisualizar(doc);
    // Registrar vista en backend e historial local
    void registrarVistaDocumento(doc.id).catch(() => {});
    setHistorialIds((prev) => {
      const next = new Set(prev);
      next.add(String(doc.id));
      try {
        localStorage.setItem("biblio_historial_ids", JSON.stringify([...next]));
      } catch (err) {
        console.warn("No se pudo guardar historial:", err);
      }
      return next;
    });
    setDocumentos((prev) =>
      prev.map((item) =>
        item.id === doc.id
          ? { ...item, vistasCount: (item.vistasCount || 0) + 1 }
          : item,
      ),
    );
  };

  // Abrir automáticamente el visor si viene docId en la URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const docId = params.get("docId");
    if (docId && documentos.length > 0) {
      const encontrado = documentos.find((d) => String(d.id) === String(docId));
      if (encontrado) {
        const timer = setTimeout(() => {
          setDocumentoVisualizar((prev) => (prev?.id === encontrado.id ? prev : encontrado));
        }, 50);
        return () => clearTimeout(timer);
      }
    }
    return undefined;
  }, [documentos]);

  // Documentos filtrados según Mi Biblioteca si está activo
  const documentosMostrados = useMemo(() => {
    if (!filtros.miBiblioteca) return documentos;
    if (filtros.miBiblioteca === "favoritos") {
      return documentos.filter((d) => favoritosIds.has(String(d.id)));
    }
    if (filtros.miBiblioteca === "leer_mas_tarde") {
      return documentos.filter((d) => leerTardeIds.has(String(d.id)));
    }
    if (filtros.miBiblioteca === "historial") {
      return documentos.filter((d) => historialIds.has(String(d.id)));
    }
    return documentos;
  }, [documentos, filtros.miBiblioteca, favoritosIds, leerTardeIds, historialIds]);

  const totalCalculado = filtros.miBiblioteca
    ? documentosMostrados.length
    : totalResultados;

  // Gate de carga pública: solo para la carga inicial de la página
  const showLoadingGate = usePublicPageLoadingGate("repositorio", inicialCargado);
  if (showLoadingGate) {
    return <PageLoading message="Cargando biblioteca digital..." />;
  }

  return (
    <div className="biblio-page">
      {/* Botón Volver al inicio */}
      <div className="biblio-back-container no-print">
        <BackToHomeLink />
      </div>

      {/* Encabezado y Estadísticas Calculadas (Estilo Institucional / Administrativo) */}
      <section className="biblio-header-section" aria-labelledby="biblio-title">
        <div className="biblio-header-content">
          <div className="biblio-header-top">
            <div>
              <div className="badge--admin-docs">
                <Sparkles size={13} className="text-amber-500 mr-1" />
                <span>
                  <ST>Repositorio Institucional & Biblioteca Digital</ST>
                </span>
              </div>
              <h1 id="biblio-title" className="admin-docs-title">
                <ST>Biblioteca Digital Café-UNA</ST>
              </h1>
              <p className="admin-docs-subtitle">
                <ST>
                  Consulta, descarga e investiga informes oficiales, manuales de producción, guías
                  técnicas y normativas del Proyecto Café-UNA.
                </ST>
              </p>
            </div>
          </div>

          {/* Franja de estadísticas / KPIs calculadas desde la base de datos */}
          <div className="admin-docs-kpi-grid biblio-kpi-grid" role="region" aria-label="Estadísticas de la biblioteca">
            <div className="admin-docs-kpi-card">
              <span className="kpi-icon kpi-icon--blue">
                <FileText size={20} />
              </span>
              <div className="kpi-info">
                <span className="kpi-num">{estadisticas.totalDocumentos || 0}</span>
                <span className="kpi-lbl">
                  <ST>Documentos</ST>
                </span>
              </div>
            </div>

            <div className="admin-docs-kpi-card">
              <span className="kpi-icon kpi-icon--emerald">
                <FolderOpen size={20} />
              </span>
              <div className="kpi-info">
                <span className="kpi-num">{estadisticas.totalCategorias || 4}</span>
                <span className="kpi-lbl">
                  <ST>Categorías temáticas</ST>
                </span>
              </div>
            </div>

            <div className="admin-docs-kpi-card">
              <span className="kpi-icon kpi-icon--amber">
                <Download size={20} />
              </span>
              <div className="kpi-info">
                <span className="kpi-num">{estadisticas.totalDescargas || 0}</span>
                <span className="kpi-lbl">
                  <ST>Descargas totales</ST>
                </span>
              </div>
            </div>

            <div className="admin-docs-kpi-card">
              <span className="kpi-icon kpi-icon--purple">
                <Eye size={20} />
              </span>
              <div className="kpi-info">
                <span className="kpi-num">{estadisticas.totalVistas || 0}</span>
                <span className="kpi-lbl">
                  <ST>Visualizaciones</ST>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contenedor Principal: Layout de Dos Columnas (Sidebar + Contenido) */}
      <div className="biblio-layout-container">
        {/* Sidebar de navegación y filtros */}
        <Sidebar
          filtros={filtros}
          facetas={facetas}
          estadisticas={estadisticas}
          usuario={user}
          esAdmin={esAdmin}
          totalResultados={totalCalculado}
          favoritosCount={favoritosIds.size}
          leerTardeCount={leerTardeIds.size}
          historialCount={historialIds.size}
          onBuscar={handleBuscar}
          onCambiarFiltro={handleCambiarFiltro}
          onCambiarFiltros={handleCambiarFiltros}
          onLimpiarFiltros={handleLimpiarTodos}
          onAbrirSolicitarModal={() => setDocumentoSolicitar({})}
          mobileOpen={mobileDrawerOpen}
          onCloseMobile={() => setMobileDrawerOpen(false)}
          sidebarColapsado={sidebarColapsado}
          onToggleColapso={handleToggleColapso}
        />

        {/* Área de Contenido Principal */}
        <main
          className={`biblio-main-content ${
            sidebarColapsado ? "biblio-main-content--expanded" : ""
          }`}
          role="main"
          aria-hidden={mobileDrawerOpen}
          style={mobileDrawerOpen ? { pointerEvents: "none", userSelect: "none" } : undefined}
        >
          {/* Barra superior de herramientas y orden */}
          <ResultsToolbar
            totalResultados={totalCalculado}
            paginaActual={filtros.pagina}
            limitePorPagina={12}
            orden={filtros.orden}
            onCambiarOrden={(ord) => handleCambiarFiltro("orden", ord)}
            vistaCuadricula={vistaCuadricula}
            onToggleVista={handleToggleVista}
            onAbrirFiltrosMobile={() => setMobileDrawerOpen(true)}
            sidebarColapsado={sidebarColapsado}
            onToggleColapso={handleToggleColapso}
            filtrosActivosCount={
              (filtros.buscar ? 1 : 0) +
              (filtros.categoria !== "todas" ? 1 : 0) +
              (filtros.subcategoria ? 1 : 0) +
              (filtros.anioDesde || filtros.anioHasta ? 1 : 0) +
              (filtros.tipoArchivo !== "todos" ? 1 : 0) +
              (filtros.autor ? 1 : 0) +
              (filtros.idioma !== "todos" ? 1 : 0) +
              (esAdmin && filtros.visibilidad !== "todas" ? 1 : 0) +
              (filtros.accesoRapido !== "todos" ? 1 : 0) +
              (filtros.miBiblioteca ? 1 : 0)
            }
          />

          {/* Chips de filtros activos removibles */}
          <ActiveFilterChips
            filtros={filtros}
            onEliminarFiltro={handleCambiarFiltro}
            onLimpiarTodos={handleLimpiarTodos}
          />

          {/* Mensaje de error si falla */}
          {error && (
            <div className="biblio-error-banner" role="alert">
              <Info size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Resultados: Cuadrícula o Lista */}
          {vistaCuadricula ? (
            <DocumentGrid
              documentos={documentosMostrados}
              cargando={cargando}
              terminoBusqueda={filtros.buscar}
              esAdmin={esAdmin}
              usuario={user}
              favoritosIds={favoritosIds}
              onVisualizar={handleVisualizar}
              onDescargar={handleDescargar}
              onVerDetalle={(doc) => setDocumentoVisualizar(doc)}
              onToggleFavorito={(doc) => {
                setFavoritosIds((prev) => {
                  const next = new Set(prev);
                  const idStr = String(doc.id);
                  if (next.has(idStr)) next.delete(idStr);
                  else next.add(idStr);
                  try {
                    localStorage.setItem("biblio_favoritos_ids", JSON.stringify([...next]));
                  } catch (err) {
                    console.warn("No se pudo guardar favorito:", err);
                  }
                  return next;
                });
              }}
              onToggleLeerTarde={handleToggleLeerTarde}
              onFiltrarEtiqueta={(tag) => handleCambiarFiltro("etiquetas", tag)}
              onLimpiarFiltros={handleLimpiarTodos}
            />
          ) : (
            <DocumentList
              documentos={documentosMostrados}
              cargando={cargando}
              terminoBusqueda={filtros.buscar}
              esAdmin={esAdmin}
              usuario={user}
              favoritosIds={favoritosIds}
              onVisualizar={handleVisualizar}
              onDescargar={handleDescargar}
              onVerDetalle={(doc) => setDocumentoVisualizar(doc)}
              onToggleFavorito={(doc) => {
                setFavoritosIds((prev) => {
                  const next = new Set(prev);
                  const idStr = String(doc.id);
                  if (next.has(idStr)) next.delete(idStr);
                  else next.add(idStr);
                  try {
                    localStorage.setItem("biblio_favoritos_ids", JSON.stringify([...next]));
                  } catch (err) {
                    console.warn("No se pudo guardar favorito:", err);
                  }
                  return next;
                });
              }}
              onToggleLeerTarde={handleToggleLeerTarde}
              onFiltrarEtiqueta={(tag) => handleCambiarFiltro("etiquetas", tag)}
              onLimpiarFiltros={handleLimpiarTodos}
            />
          )}

          {/* Paginación */}
          <Pagination
            paginaActual={filtros.pagina}
            totalPaginas={totalPaginas}
            onCambiarPagina={handleCambiarPagina}
          />
        </main>
      </div>

      {/* Modal de Solicitud / Propuesta de Documento */}
      {documentoSolicitar && (
        <SolicitarDocumentoModal
          documento={documentoSolicitar?.id ? documentoSolicitar : null}
          onClose={() => setDocumentoSolicitar(null)}
          onExito={() => {
            setDocumentoSolicitar(null);
            alert("Su solicitud o propuesta de archivo fue enviada con éxito.");
          }}
        />
      )}

      {/* Modal de Visualización en línea */}
      {documentoVisualizar && (
        <VisualizarDocumentoModal
          documento={documentoVisualizar}
          onClose={() => setDocumentoVisualizar(null)}
          onSolicitarAcceso={(doc) => {
            setDocumentoVisualizar(null);
            setDocumentoSolicitar(doc);
          }}
        />
      )}
    </div>
  );
}
