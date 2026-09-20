import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Coins,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Loader2,
  Receipt,
  RotateCcw,
  Search,
  User,
  X,
} from "lucide-react";

import { AdminLayout } from "../layouts/AdminLayout";
import PageLoading from "../../../Components/PageLoading/PageLoading";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import {
  descargarFacturaPdf,
  obtenerFacturasAdmin,
  obtenerUrlFacturaPdf,
} from "../../../services/facturasService";
import { getActiveSessionUser } from "../../../services/sessionService";
import { ST } from "../../../Components/T/ST";
import "./Facturas.css";

export default function AdminFacturas() {
  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtroBuscar, setFiltroBuscar] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [descargandoId, setDescargandoId] = useState(null);

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setError("");
      const res = await obtenerFacturasAdmin({
        q: filtroBuscar,
        estado: filtroEstado,
      });
      setFacturas(res.items || []);
    } catch (err) {
      console.error("Error al cargar facturas:", err);
      setError("No se pudieron cargar las facturas en este momento.");
    } finally {
      setCargando(false);
    }
  }, [filtroBuscar, filtroEstado]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const metricas = useMemo(() => {
    const totalMonto = facturas.reduce((acc, f) => acc + (f.total || 0), 0);
    const totalFacturas = facturas.length;
    const promedio = totalFacturas > 0 ? totalMonto / totalFacturas : 0;
    return {
      totalMonto,
      totalFacturas,
      promedio,
    };
  }, [facturas]);

  const handleDescargar = async (factura) => {
    try {
      setDescargandoId(factura.id);
      const safeName = (factura.consecutivo || factura.id || "factura").replace(/[^a-zA-Z0-9_-]/g, "_");
      await descargarFacturaPdf(factura.id, `factura-${safeName}.pdf`);
    } catch (err) {
      alert(err?.message || "No se pudo descargar la factura en este momento.");
    } finally {
      setDescargandoId(null);
    }
  };

  const { showLoading, loadingMessage } = useAdminPageGate("/admin/facturas", !cargando);

  if (showLoading) {
    return <PageLoading message={loadingMessage} />;
  }

  const user = getActiveSessionUser();

  return (
    <AdminLayout>
      <div className="admin-facturas-page">
        {/* Encabezado Principal */}
        <header className="admin-facturas__header">
          <div className="admin-facturas__header-info">
            <div className="admin-facturas__badge-tag">
              <Receipt size={15} />
              <span><ST>Facturación Electrónica</ST></span>
            </div>
            <h1 className="admin-facturas__title">
              <ST>Repositorio de Facturas</ST>
            </h1>
            <p className="admin-facturas__subtitle">
              <ST>
                Registro oficial, consulta y descarga de comprobantes electrónicos emitidos en compras y ventas de Café UNA.
              </ST>
            </p>
          </div>
        </header>

        {/* Tarjetas de Métricas Resumen */}
        <section className="admin-facturas__metrics-grid">
          <div className="facturas-metric-card">
            <div className="facturas-metric-card__icon facturas-metric-card__icon--blue">
              <Receipt size={24} />
            </div>
            <div className="facturas-metric-card__content">
              <span className="facturas-metric-card__label"><ST>Total Facturas</ST></span>
              <strong className="facturas-metric-card__value">{metricas.totalFacturas}</strong>
              <span className="facturas-metric-card__hint"><ST>Comprobantes generados</ST></span>
            </div>
          </div>

          <div className="facturas-metric-card">
            <div className="facturas-metric-card__icon facturas-metric-card__icon--red">
              <Coins size={24} />
            </div>
            <div className="facturas-metric-card__content">
              <span className="facturas-metric-card__label"><ST>Total Facturado</ST></span>
              <strong className="facturas-metric-card__value">
                ₡ {metricas.totalMonto.toLocaleString("es-CR", { minimumFractionDigits: 2 })}
              </strong>
              <span className="facturas-metric-card__hint"><ST>Ventas registradas</ST></span>
            </div>
          </div>

          <div className="facturas-metric-card">
            <div className="facturas-metric-card__icon facturas-metric-card__icon--emerald">
              <BarChart3 size={24} />
            </div>
            <div className="facturas-metric-card__content">
              <span className="facturas-metric-card__label"><ST>Promedio por Factura</ST></span>
              <strong className="facturas-metric-card__value">
                ₡ {metricas.promedio.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
              <span className="facturas-metric-card__hint"><ST>Ticket promedio</ST></span>
            </div>
          </div>
        </section>

        {/* Barra de Filtros y Búsqueda */}
        <section className="admin-facturas__filters-card">
          <div className="admin-facturas__search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              value={filtroBuscar}
              onChange={(e) => setFiltroBuscar(e.target.value)}
              placeholder="Buscar por N° factura, orden o cliente..."
              className="admin-facturas__search-input"
            />
          </div>

          <div className="admin-facturas__select-wrapper">
            <Filter size={16} className="filter-icon" />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="admin-facturas__select"
            >
              <option value=""><ST>Todos los estados</ST></option>
              <option value="Emitida"><ST>Emitida</ST></option>
              <option value="Pagada"><ST>Pagada</ST></option>
              <option value="Anulada"><ST>Anulada</ST></option>
            </select>
          </div>

          {(filtroBuscar || filtroEstado) && (
            <button
              type="button"
              className="admin-facturas__reset-btn"
              onClick={() => {
                setFiltroBuscar("");
                setFiltroEstado("");
              }}
              title="Limpiar filtros"
            >
              <RotateCcw size={15} />
              <span><ST>Restablecer</ST></span>
            </button>
          )}
        </section>

        {/* Mensaje de Error si ocurre */}
        {error && (
          <div className="admin-facturas__error-banner" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Tabla de Facturas */}
        <section className="admin-facturas__table-container">
          {facturas.length === 0 ? (
            <div className="admin-facturas__empty">
              <FileCheck size={48} className="empty-icon" />
              <h3><ST>No se encontraron facturas</ST></h3>
              <p>
                <ST>
                  {filtroBuscar || filtroEstado
                    ? "No hay resultados para los filtros seleccionados."
                    : "Las facturas se generarán automáticamente cuando los clientes completen órdenes de compra."}
                </ST>
              </p>
            </div>
          ) : (
            <table className="admin-facturas__table">
              <thead>
                <tr>
                  <th><ST>N° Factura</ST></th>
                  <th><ST>N° Orden</ST></th>
                  <th><ST>Cliente</ST></th>
                  <th><ST>Fecha</ST></th>
                  <th className="text-right"><ST>Subtotal</ST></th>
                  <th className="text-right"><ST>IVA (13%)</ST></th>
                  <th className="text-right"><ST>Total</ST></th>
                  <th><ST>Estado</ST></th>
                  <th className="text-center" style={{ minWidth: "120px" }}><ST>Acciones</ST></th>
                </tr>
              </thead>
              <tbody>
                {facturas.map((fac) => (
                  <tr key={fac.id}>
                    <td>
                      <span className="factura-consecutivo-badge">
                        {fac.consecutivo}
                      </span>
                    </td>
                    <td>
                      <span className="factura-orden-text">{fac.compraNumero}</span>
                    </td>
                    <td>
                      <div className="factura-cliente-cell">
                        <strong>{fac.clienteNombre}</strong>
                        {fac.clienteCorreo && <small>{fac.clienteCorreo}</small>}
                      </div>
                    </td>
                    <td>
                      <span className="factura-fecha-text">
                        {new Date(fac.fechaEmision).toLocaleDateString("es-CR", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="text-right">
                      ₡ {fac.subtotal.toLocaleString("es-CR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-right">
                      ₡ {fac.impuestos.toLocaleString("es-CR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-right font-bold total-highlight">
                      ₡ {fac.total.toLocaleString("es-CR", { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`factura-status-pill status--${fac.estado.toLowerCase()}`}>
                        {fac.estado}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="admin-actions-cell">
                        <button
                          type="button"
                          className="action-btn action-btn--view"
                          onClick={() => setFacturaSeleccionada(fac)}
                          title="Visualizar factura en PDF"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          className="action-btn action-btn--download"
                          onClick={() => handleDescargar(fac)}
                          disabled={descargandoId === fac.id}
                          title="Descargar archivo PDF"
                        >
                          {descargandoId === fac.id ? (
                            <Loader2 size={15} className="action-btn-spinner" />
                          ) : (
                            <Download size={15} />
                          )}
                        </button>
                        <a
                          href={obtenerUrlFacturaPdf(fac.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-btn action-btn--external"
                          title="Abrir PDF en pestaña nueva"
                        >
                          <ExternalLink size={15} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Modal Visualizador de Factura PDF */}
        {facturaSeleccionada && (
          <div className="factura-modal-backdrop" onClick={() => setFacturaSeleccionada(null)}>
            <div className="factura-modal-content" onClick={(e) => e.stopPropagation()}>
              <header className="factura-modal-header">
                <div className="factura-modal-header__title">
                  <FileText size={20} className="modal-title-icon" />
                  <div>
                    <h3>{facturaSeleccionada.consecutivo}</h3>
                    <p>Orden #{facturaSeleccionada.compraNumero} · {facturaSeleccionada.clienteNombre}</p>
                  </div>
                </div>
                <div className="factura-modal-header__actions">
                  <button
                    type="button"
                    className="btn-modal-download"
                    onClick={() => handleDescargar(facturaSeleccionada)}
                  >
                    <Download size={16} />
                    <span><ST>Descargar PDF</ST></span>
                  </button>
                  <button
                    type="button"
                    className="btn-modal-close"
                    onClick={() => setFacturaSeleccionada(null)}
                    title="Cerrar vista previa"
                  >
                    <X size={20} />
                  </button>
                </div>
              </header>

              <div className="factura-modal-body">
                <iframe
                  src={obtenerUrlFacturaPdf(facturaSeleccionada.id, user?.token)}
                  title={`Factura ${facturaSeleccionada.consecutivo}`}
                  className="factura-pdf-iframe"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
