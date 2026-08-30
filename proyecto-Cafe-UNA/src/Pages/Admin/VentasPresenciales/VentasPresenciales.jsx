import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

import { AdminPageGate } from "../../../Components/AdminPageGate/AdminPageGate";
import {
  AdminModal,
  AdminModalActions,
  AdminModalBody,
  AdminModalHeader,
} from "../../../Components/Admin/ui/AdminModal";
import { ContadorPalabras } from "../../../Components/Admin/ui/CampoLimitePalabras";
import { NumericInput } from "../../../Components/NumericInput/NumericInput";
import { UiSelect } from "../../../Components/ui/Select";
import { AdminLayout } from "../layouts/AdminLayout";
import { useAdminPageGate } from "../../../hooks/useAdminPageGate";
import { queueFocusFormError } from "../../../lib/formFocus";
import {
  conLimitePalabras,
  MAX_PALABRAS_NOTAS,
} from "../../../lib/formLimits";
import { rolesDeUsuario, tienePermiso } from "../../../lib/permisos";
import { ST } from "../../../Components/T/ST";
import { t } from "../../../lib/t";
import { useIdioma } from "../../../lib/useIdioma";
import { asegurarCamposEnEspanol } from "../../../lib/traducir";
import { obtenerCatalogoProductos, obtenerStockPorUbicacion } from "../../../services/productosService";
import { getActiveSessionUser } from "../../../services/sessionService";
import {
  obtenerPuntosVentaPresencial,
  registrarVentaPresencial,
} from "../../../services/ventasPresencialesService";

const fieldClass =
  "min-h-[var(--control-height)] w-full rounded-full border border-slate-200 bg-slate-50 px-3 text-[length:var(--text-body)] text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white";

function hoyISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function AdminVentasPresenciales() {
  const user = getActiveSessionUser();
  const roles = rolesDeUsuario(user);
  const puedeVer =
    tienePermiso(roles, "ver_inventario") ||
    tienePermiso(roles, "registrar_ventas") ||
    tienePermiso(roles, "ajustar_stock_ubicaciones");
  const puedeRegistrar =
    tienePermiso(roles, "registrar_ventas") ||
    tienePermiso(roles, "ajustar_stock_ubicaciones");

  const [ready, setReady] = useState(false);
  const { showLoading, loadingMessage } = useAdminPageGate("/admin/ventas-presenciales", ready);

  const [puntos, setPuntos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [stockMap, setStockMap] = useState(new Map());
  const [ubicacionCodigo, setUbicacionCodigo] = useState("");
  const [productoId, setProductoId] = useState("");
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [fecha, setFecha] = useState(hoyISO);
  const [notas, setNotas] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const { idioma } = useIdioma();

  const loadBase = async () => {
    setLoadError("");
    try {
      const [puntosData, catalogo] = await Promise.all([
        obtenerPuntosVentaPresencial(),
        obtenerCatalogoProductos(),
      ]);
      setPuntos(puntosData.filter((p) => p.activo !== false));
      setProductos(Array.isArray(catalogo) ? catalogo : catalogo?.data || []);
    } catch (err) {
      setPuntos([]);
      setProductos([]);
      setLoadError(err instanceof Error ? err.message : "No se pudo cargar el formulario.");
    } finally {
      setReady(true);
    }
  };

  useEffect(() => {
    if (!puedeVer) {
      setReady(true);
      return;
    }
    loadBase();
  }, [puedeVer]);

  useEffect(() => {
    if (!ubicacionCodigo) {
      setStockMap(new Map());
      return;
    }
    let activo = true;
    obtenerStockPorUbicacion(ubicacionCodigo)
      .then((rows) => {
        if (!activo) return;
        const map = new Map();
        (Array.isArray(rows) ? rows : []).forEach((row) => {
          map.set(String(row.productId ?? row.productoId), Number(row.stock) || 0);
        });
        setStockMap(map);
      })
      .catch(() => {
        if (activo) setStockMap(new Map());
      });
    return () => {
      activo = false;
    };
  }, [ubicacionCodigo]);

  const opcionesPunto = useMemo(
    () => [
      { value: "", label: t("Seleccionar...") },
      ...puntos.map((p) => ({ value: p.code, label: t(p.name || p.code) })),
    ],
    [puntos, idioma],
  );

  const productosFiltrados = useMemo(() => {
    const q = busquedaProducto.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter((p) =>
      String(p.nombre || "").toLowerCase().includes(q),
    );
  }, [productos, busquedaProducto]);

  const opcionesProducto = useMemo(
    () => [
      { value: "", label: t("Seleccionar...") },
      ...productosFiltrados.map((p) => ({
        value: String(p.id),
        label: t(p.nombre || `Producto ${p.id}`),
      })),
    ],
    [productosFiltrados, idioma],
  );

  const puntoSeleccionado = puntos.find((p) => p.code === ubicacionCodigo) || null;
  const productoSeleccionado = productos.find((p) => String(p.id) === String(productoId)) || null;
  const stockDisponible = productoId ? (stockMap.get(String(productoId)) ?? 0) : null;
  const cantidadNum = Number(cantidad);
  const cantidadInvalida =
    Boolean(productoId) &&
    Boolean(ubicacionCodigo) &&
    (!Number.isInteger(cantidadNum) ||
      cantidadNum <= 0 ||
      (stockDisponible != null && cantidadNum > stockDisponible));

  const stockError =
    productoId && ubicacionCodigo && Number.isInteger(cantidadNum) && cantidadNum > 0 && stockDisponible != null && cantidadNum > stockDisponible
      ? `Stock disponible en este punto: ${stockDisponible} unidades.`
      : "";

  const limpiarFormulario = () => {
    setProductoId("");
    setBusquedaProducto("");
    setCantidad("");
    setFecha(hoyISO());
    setNotas("");
    setFormError("");
  };

  const abrirConfirmacion = (event) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");
    if (!ubicacionCodigo) {
      setFormError("Seleccioná el punto de venta.");
      queueFocusFormError();
      return;
    }
    if (!productoId) {
      setFormError("Seleccioná el producto.");
      queueFocusFormError();
      return;
    }
    if (!Number.isInteger(cantidadNum) || cantidadNum <= 0) {
      setFormError("La cantidad debe ser un entero positivo.");
      queueFocusFormError();
      return;
    }
    if (stockDisponible != null && cantidadNum > stockDisponible) {
      setFormError(`Stock disponible en este punto: ${stockDisponible} unidades.`);
      queueFocusFormError();
      return;
    }
    if (!fecha) {
      setFormError("La fecha es obligatoria.");
      queueFocusFormError();
      return;
    }
    setConfirmOpen(true);
  };

  const confirmar = async () => {
    setIsSaving(true);
    setFormError("");
    try {
      const notasEs = notas.trim()
        ? (await asegurarCamposEnEspanol({ notas: notas.trim() }, ["notas"])).notas
        : "";
      await registrarVentaPresencial({
        productoId,
        ubicacionCodigo,
        cantidad: cantidadNum,
        fecha: `${fecha}T12:00:00`,
        notas: notasEs,
      });
      setConfirmOpen(false);
      setSuccessMessage("Venta presencial registrada correctamente.");
      limpiarFormulario();
      if (ubicacionCodigo) {
        const rows = await obtenerStockPorUbicacion(ubicacionCodigo);
        const map = new Map();
        (Array.isArray(rows) ? rows : []).forEach((row) => {
          map.set(String(row.productId ?? row.productoId), Number(row.stock) || 0);
        });
        setStockMap(map);
      }
    } catch (err) {
      setConfirmOpen(false);
      setFormError(err instanceof Error ? err.message : "No se pudo registrar la venta.");
      queueFocusFormError();
    } finally {
      setIsSaving(false);
    }
  };

  if (!puedeVer) {
    return (
      <AdminPageGate showLoading={showLoading} loadingMessage={loadingMessage}>
        <AdminLayout>
          <section className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">
            <h1 className="text-[length:var(--text-title)] font-semibold text-slate-950"><ST>Acceso restringido</ST></h1>
            <p className="mx-auto mt-2 max-w-md text-[length:var(--text-body)] text-slate-500">
              <ST>No tiene permiso para registrar ventas presenciales.</ST>
            </p>
          </section>
        </AdminLayout>
      </AdminPageGate>
    );
  }

  return (
    <AdminPageGate showLoading={showLoading} loadingMessage={loadingMessage}>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-[length:var(--text-title)] font-bold text-slate-950"><ST>Ventas presenciales</ST></h1>
            <p className="mt-1 text-[length:var(--text-body)] text-slate-600">
              <ST>Registrá ventas en puntos físicos; el stock se descuenta solo de ese punto.</ST>
            </p>
          </div>

          {successMessage ? (
            <p className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-[length:var(--text-body)] text-slate-800">
              <CheckCircle2 className="size-4" /> <ST>{successMessage}</ST>
            </p>
          ) : null}
          {loadError ? (
            <p className="text-[length:var(--text-body)] text-slate-700" role="alert"><ST>{loadError}</ST></p>
          ) : null}

          {puedeRegistrar ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-[length:var(--text-subtitle)] font-semibold text-slate-950">
                <ST>Nueva venta presencial</ST>
              </h2>
              <form onSubmit={abrirConfirmacion} className="mt-4 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
                <div className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
                  <ST>Punto de venta</ST>
                  <UiSelect
                    id="venta-presencial-punto"
                    ariaLabel={t("Punto de venta")}
                    value={ubicacionCodigo}
                    onChange={(valor) => {
                      setUbicacionCodigo(valor);
                      setFormError("");
                      setSuccessMessage("");
                    }}
                    options={opcionesPunto}
                  />
                </div>

                <label className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
                  <ST>Buscar producto</ST>
                  <input
                    type="search"
                    value={busquedaProducto}
                    onChange={(e) => setBusquedaProducto(e.target.value)}
                    placeholder={t("Nombre del producto…")}
                    className={fieldClass}
                  />
                </label>

                <div className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
                  <ST>Producto</ST>
                  <UiSelect
                    id="venta-presencial-producto"
                    ariaLabel={t("Producto")}
                    value={productoId}
                    onChange={(valor) => {
                      setProductoId(valor);
                      setFormError("");
                      setSuccessMessage("");
                    }}
                    options={opcionesProducto}
                  />
                  {productoId && ubicacionCodigo ? (
                    <p className="text-[length:var(--text-body)] font-normal text-slate-600">
                      <ST>Stock en este punto:</ST>{" "}
                      <span className="font-semibold text-slate-900">
                        {stockDisponible ?? "—"}
                      </span>
                    </p>
                  ) : null}
                </div>

                <label className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
                  <ST>Cantidad</ST>
                  <NumericInput
                    name="cantidad"
                    className={fieldClass}
                    value={cantidad}
                    onChange={(e) => {
                      setCantidad(e.target.value);
                      setFormError("");
                      setSuccessMessage("");
                    }}
                    required
                  />
                  {stockError ? (
                    <span className="text-[length:var(--text-body)] font-normal text-red-600" role="alert">
                      <ST>{stockError}</ST>
                    </span>
                  ) : null}
                </label>

                <label className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
                  <ST>Fecha</ST>
                  <input
                    type="date"
                    name="fecha"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className={fieldClass}
                    required
                  />
                </label>

                <label className="grid gap-2 text-[length:var(--text-body)] font-medium text-slate-700">
                  <ST>Notas (opcional)</ST>
                  <textarea
                    className="min-h-[var(--control-height)] rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[length:var(--text-body)] outline-none focus:border-slate-400 focus:bg-white"
                    value={notas}
                    onChange={conLimitePalabras((e) => setNotas(e.target.value), MAX_PALABRAS_NOTAS)}
                  />
                  <ContadorPalabras value={notas} maxPalabras={MAX_PALABRAS_NOTAS} />
                </label>

                {formError ? (
                  <p className="text-[length:var(--text-body)] text-slate-700 sm:col-span-2" role="alert">
                    <ST>{formError}</ST>
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSaving || cantidadInvalida}
                  className="inline-flex min-h-[var(--control-height)] w-fit items-center justify-center rounded-full bg-slate-800 px-5 text-[length:var(--text-body)] font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
                >
                  <ST>Confirmar venta</ST>
                </button>
              </form>
            </section>
          ) : (
            <p className="text-[length:var(--text-body)] text-slate-600">
              <ST>Su rol puede ver esta sección, pero no registrar ventas.</ST>
            </p>
          )}
        </div>

        {confirmOpen ? (
          <AdminModal open onClose={() => !isSaving && setConfirmOpen(false)} maxWidth="max-w-lg" labelledBy="venta-presencial-confirm-title">
            <AdminModalHeader>
              <h2 id="venta-presencial-confirm-title" className="text-[length:var(--text-subtitle)] font-semibold text-slate-950">
                <ST>Confirmar venta presencial</ST>
              </h2>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setConfirmOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
                aria-label={t("Cerrar")}
              >
                <X className="size-5" />
              </button>
            </AdminModalHeader>
            <AdminModalBody>
              <div className="space-y-2 text-[length:var(--text-body)] text-slate-700">
                <p><span className="font-semibold text-slate-900"><ST>Punto:</ST></span> {puntoSeleccionado?.name ? <ST>{puntoSeleccionado.name}</ST> : null}</p>
                <p><span className="font-semibold text-slate-900"><ST>Producto:</ST></span> {productoSeleccionado?.nombre ? <ST>{productoSeleccionado.nombre}</ST> : null}</p>
                <p><span className="font-semibold text-slate-900"><ST>Cantidad:</ST></span> {cantidadNum}</p>
                <p><span className="font-semibold text-slate-900"><ST>Fecha:</ST></span> {fecha}</p>
                {notas.trim() ? (
                  <p><span className="font-semibold text-slate-900"><ST>Notas:</ST></span> {notas}</p>
                ) : null}
              </div>
              <AdminModalActions
                className="mt-6"
                onCancel={() => !isSaving && setConfirmOpen(false)}
                primaryType="button"
                onPrimary={confirmar}
                primaryLabel={isSaving ? "Registrando..." : "Registrar venta"}
                primaryDisabled={isSaving}
              />
            </AdminModalBody>
          </AdminModal>
        ) : null}
      </AdminLayout>
    </AdminPageGate>
  );
}
